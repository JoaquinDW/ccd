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

  const { id } = await params

  if (!canPerform(ctx, 'organization.update', id)) {
    return NextResponse.json(
      { error: 'No tenés permiso para editar esta organización' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    nombre: body.nombre,
    tipo: body.tipo,
    pais: body.pais || 'Argentina',
    estado: body.estado,
    parent_id: body.parent_id || null,
    codigo: body.codigo || null,
    localidad: body.localidad || null,
    provincia: body.provincia || null,
    notas: body.notas || null,
    telefono_1: body.telefono_1 || null,
    telefono_2: body.telefono_2 || null,
  }

  // Soft delete if state changed to inactiva
  if (body.estado === 'inactiva') {
    updateData.fecha_baja = new Date().toISOString()
  } else {
    updateData.fecha_baja = null
  }

  const { error } = await supabase
    .from('organizaciones')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
