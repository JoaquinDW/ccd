import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function POST(request: Request) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { organizacion_id, fraternidad_id } = body

  if (!canPerform(ctx, 'event.create', organizacion_id ?? null)) {
    return NextResponse.json(
      { error: 'No tenés permiso para crear eventos en esta organización' },
      { status: 403 }
    )
  }

  // Admins can set any state; regular users always submit as 'solicitud'
  const estado = ctx.is_admin && body.estado ? body.estado : 'solicitud'

  const today = new Date().toISOString().split('T')[0]

  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    nombre: body.nombre,
    tipo: body.tipo,
    tipo_evento_id: body.tipo_evento_id || null,
    modalidad: body.modalidad ?? 'presencial',
    fecha_inicio: body.fecha_inicio,
    fecha_fin: body.fecha_fin,
    estado,
    organizacion_id: organizacion_id || null,       // confraternidad
    fraternidad_id: fraternidad_id || null,
    requiere_discernimiento_confra: body.requiere_discernimiento_confra ?? false,
    requiere_discernimiento_eqt: body.requiere_discernimiento_eqt ?? false,
    coordinadores_propuestos: body.coordinadores_propuestos || null,
    asesor_propuesto: body.asesor_propuesto || null,
    asesor_voluntario: body.asesor_voluntario ?? false,
    es_apv: body.es_apv ?? false,
    ciudad: body.ciudad || null,
    codigo_postal: body.codigo_postal || null,
    diocesis: body.diocesis || null,
    provincia_evento: body.provincia_evento || null,
    pais_evento: body.pais_evento || 'Argentina',
    notas: body.notas || null,
    solicitado_por: ctx.persona_id ?? null,
    fecha_solicitud: estado === 'solicitud' ? today : null,
  }

  const { data, error } = await supabase
    .from('eventos')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id: data.id })
}
