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

  const { error } = await supabase
    .from('personas')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
