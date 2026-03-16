import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (!canPerform(ctx, 'person.update')) {
    return NextResponse.json(
      { error: 'No tenés permiso para editar personas' },
      { status: 403 }
    )
  }

  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  // Scope check: si no es admin y tiene orgs asignadas, la persona debe pertenecer
  // a al menos una de ellas (via asignaciones_ministerio activas)
  if (!ctx.is_admin && ctx.org_ids.length > 0) {
    const { data: asignaciones } = await supabase
      .from('asignaciones_ministerio')
      .select('organizacion_id')
      .eq('persona_id', id)
      .eq('estado', 'activo')
      .in('organizacion_id', ctx.org_ids)
      .limit(1)

    if (!asignaciones || asignaciones.length === 0) {
      return NextResponse.json(
        { error: 'No tenés permiso para editar esta persona' },
        { status: 403 }
      )
    }
  }

  const updateData: Record<string, unknown> = {
    nombre: body.nombre,
    apellido: body.apellido,
    acepta_comunicaciones: body.acepta_comunicaciones ?? true,
  }
  if (body.email !== undefined) updateData.email = body.email || null
  if (body.telefono !== undefined) updateData.telefono = body.telefono || null
  if (body.tipo_documento !== undefined) updateData.tipo_documento = body.tipo_documento || null
  if (body.documento !== undefined) updateData.documento = body.documento || null
  if (body.fecha_nacimiento !== undefined) updateData.fecha_nacimiento = body.fecha_nacimiento || null
  if (body.direccion !== undefined) updateData.direccion = body.direccion || null
  if (body.localidad !== undefined) updateData.localidad = body.localidad || null
  if (body.provincia !== undefined) updateData.provincia = body.provincia || null
  if (body.pais !== undefined) updateData.pais = body.pais || null
  if (body.notas !== undefined) updateData.notas = body.notas || null
  if (body.estado_eclesial !== undefined) updateData.estado_eclesial = body.estado_eclesial || 'laico'
  if (body.diocesis !== undefined) updateData.diocesis = body.diocesis || null
  if (body.categoria_persona !== undefined) updateData.categoria_persona = body.categoria_persona || null
  if (body.parroquia !== undefined) updateData.parroquia = body.parroquia || null
  if (body.socio_asociacion !== undefined) updateData.socio_asociacion = body.socio_asociacion
  if (body.referente_comunidad !== undefined) updateData.referente_comunidad = body.referente_comunidad
  if (body.cecista_dedicado !== undefined) updateData.cecista_dedicado = body.cecista_dedicado
  if (body.email_ccd !== undefined) updateData.email_ccd = body.email_ccd || null
  if (body.direccion_nro !== undefined) updateData.direccion_nro = body.direccion_nro || null
  if (body.codigo_postal !== undefined) updateData.codigo_postal = body.codigo_postal || null
  if (body.estado_vida !== undefined) updateData.estado_vida = body.estado_vida || null
  if (body.intercesor_dies_natalis !== undefined) updateData.intercesor_dies_natalis = body.intercesor_dies_natalis || null

  const { error } = await supabase
    .from('personas')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
