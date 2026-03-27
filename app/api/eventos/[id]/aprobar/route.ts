import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

type ResultadoDiscernimiento =
  | 'aprobado_sin_modificaciones'
  | 'aprobado_con_modificaciones'
  | 'rechazado'

type CampoEvento =
  | 'nombre'
  | 'fecha_inicio'
  | 'fecha_fin'
  | 'ciudad'
  | 'provincia_evento'
  | 'pais_evento'
  | 'codigo_postal'
  | 'diocesis'
  | 'coordinadores_propuestos'
  | 'asesor_propuesto'
  | 'asesor_voluntario'
  | 'modalidad'
  | 'notas'
  | 'cupo_maximo'

const CAMPOS_EDITABLES: CampoEvento[] = [
  'nombre', 'fecha_inicio', 'fecha_fin',
  'ciudad', 'provincia_evento', 'pais_evento', 'codigo_postal', 'diocesis',
  'coordinadores_propuestos', 'asesor_propuesto', 'asesor_voluntario',
  'modalidad', 'notas', 'cupo_maximo',
]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const resultado = body.resultado_discernimiento as ResultadoDiscernimiento
  const notas = body.notas_discernimiento as string | undefined
  const cambios = (body.cambios ?? {}) as Partial<Record<CampoEvento, unknown>>

  const validResultados: ResultadoDiscernimiento[] = [
    'aprobado_sin_modificaciones',
    'aprobado_con_modificaciones',
    'rechazado',
  ]

  if (!validResultados.includes(resultado)) {
    return NextResponse.json({ error: 'Resultado de discernimiento inválido' }, { status: 400 })
  }

  const accion: 'aprobar' | 'rechazar' = resultado === 'rechazado' ? 'rechazar' : 'aprobar'

  if (accion === 'rechazar' && !notas?.trim()) {
    return NextResponse.json({ error: 'Las notas son obligatorias al rechazar' }, { status: 400 })
  }

  // Validate campo names
  const camposInvalidos = Object.keys(cambios).filter(k => !CAMPOS_EDITABLES.includes(k as CampoEvento))
  if (camposInvalidos.length > 0) {
    return NextResponse.json(
      { error: `Campos no permitidos: ${camposInvalidos.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select(`
      id, estado, organizacion_id,
      requiere_discernimiento_confra, requiere_discernimiento_eqt,
      nombre, fecha_inicio, fecha_fin,
      ciudad, provincia_evento, pais_evento, codigo_postal, diocesis,
      coordinadores_propuestos, asesor_propuesto, asesor_voluntario,
      modalidad, notas, cupo_maximo
    `)
    .eq('id', id)
    .single()

  if (eventoError || !evento) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  const estadoActual = evento.estado
  const requiereConfra = evento.requiere_discernimiento_confra ?? false
  const requiereEqt = evento.requiere_discernimiento_eqt ?? false
  const confraternidadId = evento.organizacion_id

  // Determine required permission and org scope
  let requiredPermission: 'event.approve_confra' | 'event.approve_eqt'
  let requiredOrgId: string | null = null
  let nivel: 'confra' | 'eqt'

  if (estadoActual === 'solicitud') {
    if (requiereConfra) {
      requiredPermission = 'event.approve_confra'
      requiredOrgId = confraternidadId ?? null
      nivel = 'confra'
    } else if (requiereEqt) {
      requiredPermission = 'event.approve_eqt'
      nivel = 'eqt'
    } else {
      return NextResponse.json(
        { error: 'Este evento no requiere discernimiento' },
        { status: 422 }
      )
    }
  } else if (estadoActual === 'discernimiento_confra') {
    requiredPermission = 'event.approve_confra'
    requiredOrgId = confraternidadId ?? null
    nivel = 'confra'
  } else if (estadoActual === 'discernimiento_eqt') {
    requiredPermission = 'event.approve_eqt'
    nivel = 'eqt'
  } else {
    return NextResponse.json(
      { error: `El evento en estado "${estadoActual}" no permite discernimiento` },
      { status: 422 }
    )
  }

  if (!canPerform(ctx, requiredPermission, requiredOrgId)) {
    return NextResponse.json(
      { error: 'No tenés permiso para realizar esta acción' },
      { status: 403 }
    )
  }

  // Build field update payload and cambios rows
  const fieldUpdates: Record<string, unknown> = {}
  const cambiosRows: Array<{
    evento_id: string
    nivel_disc: 'confra' | 'eqt'
    campo: string
    valor_anterior: string | null
    valor_nuevo: string | null
    modificado_por: string | null
  }> = []

  for (const [campo, nuevoValor] of Object.entries(cambios)) {
    const anteriorRaw = (evento as Record<string, unknown>)[campo]
    const valorAnterior = anteriorRaw == null ? null : String(anteriorRaw)
    const valorNuevo = nuevoValor == null ? null : String(nuevoValor)

    // Skip if value hasn't actually changed
    if (valorAnterior === valorNuevo) continue

    fieldUpdates[campo] = nuevoValor
    cambiosRows.push({
      evento_id: id,
      nivel_disc: nivel,
      campo,
      valor_anterior: valorAnterior,
      valor_nuevo: valorNuevo,
      modificado_por: ctx.persona_id,
    })
  }

  // Compute next state
  // Flows:
  //   confra + eqt: solicitud → discernimiento_confra → discernimiento_eqt → aprobado
  //   solo confra:  solicitud → discernimiento_confra → aprobado
  //   solo eqt:     solicitud → discernimiento_eqt → aprobado
  let nextEstado: string
  if (accion === 'rechazar') {
    nextEstado = 'rechazado'
  } else if (estadoActual === 'solicitud' && requiereConfra) {
    nextEstado = 'discernimiento_confra'
  } else if (estadoActual === 'solicitud' && requiereEqt) {
    nextEstado = 'discernimiento_eqt'
  } else if (estadoActual === 'discernimiento_confra' && requiereEqt) {
    nextEstado = 'discernimiento_eqt'
  } else {
    // discernimiento_confra sin eqt, o discernimiento_eqt → aprobado
    nextEstado = 'aprobado'
  }

  const today = new Date().toISOString().split('T')[0]
  const updateData: Record<string, unknown> = { estado: nextEstado }

  // Save discernimiento details for this level
  if (nivel === 'confra') {
    updateData.disc_confra_estado = resultado
    updateData.disc_confra_fecha = today
    updateData.disc_confra_notas = notas || null
    updateData.disc_confra_por = ctx.persona_id
  } else {
    updateData.disc_eqt_estado = resultado
    updateData.disc_eqt_fecha = today
    updateData.disc_eqt_notas = notas || null
    updateData.disc_eqt_por = ctx.persona_id
  }

  // Track rejection globally too
  if (accion === 'rechazar') {
    updateData.rechazado_por = ctx.persona_id
    updateData.motivo_rechazo = notas
    updateData.fecha_rechazo = today
  } else if (nextEstado === 'aprobado') {
    updateData.aprobado_por = ctx.persona_id
    updateData.fecha_aprobacion = today
  }

  const { error: updateError } = await supabase
    .from('eventos')
    .update({ ...updateData, ...fieldUpdates })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  // Insert change rows (non-blocking: event update already succeeded)
  if (cambiosRows.length > 0) {
    const { error: cambiosError } = await supabase
      .from('evento_cambios')
      .insert(cambiosRows)

    if (cambiosError) {
      console.error('[aprobar] Failed to insert evento_cambios:', cambiosError.message)
    }
  }

  return NextResponse.json({ estado: nextEstado })
}
