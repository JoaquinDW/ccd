import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform, enforceEventoEstado } from '@/lib/auth/context'

export async function POST(request: Request) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { organizacion_id } = body

  if (!canPerform(ctx, 'event.create', organizacion_id ?? null)) {
    return NextResponse.json(
      { error: 'No tenés permiso para crear eventos en esta organización' },
      { status: 403 }
    )
  }

  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    nombre: body.nombre,
    tipo: body.tipo,
    fecha_inicio: body.fecha_inicio,
    fecha_fin: body.fecha_fin,
    audiencia: body.audiencia,
    modalidad: body.modalidad,
    estado: enforceEventoEstado(ctx, body.estado ?? 'borrador'),
    organizacion_id: organizacion_id || null,
    casa_retiro_id: body.casa_retiro_id || null,
    cupo_maximo: body.cupo_maximo ? parseInt(body.cupo_maximo) : null,
    precio: body.precio ? parseFloat(body.precio) : null,
    descripcion: body.descripcion || null,
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
