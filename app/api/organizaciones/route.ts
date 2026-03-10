import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function POST(request: Request) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (!canPerform(ctx, 'organization.create')) {
    return NextResponse.json(
      { error: 'No tenés permiso para crear organizaciones' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    nombre: body.nombre,
    tipo: body.tipo,
    pais: body.pais || 'Argentina',
  }
  if (body.codigo) insertData.codigo = body.codigo
  if (body.parent_id) insertData.parent_id = body.parent_id
  if (body.localidad) insertData.localidad = body.localidad
  if (body.provincia) insertData.provincia = body.provincia
  if (body.notas) insertData.notas = body.notas
  if (body.telefono_1) insertData.telefono_1 = body.telefono_1
  if (body.telefono_2) insertData.telefono_2 = body.telefono_2

  const { error } = await supabase.from('organizaciones').insert(insertData)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
