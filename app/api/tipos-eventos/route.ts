import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/context'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_eventos')
    .select('id, nombre, categoria, alcance, requiere_discernimiento_confra, requiere_discernimiento_eqt, requisitos')
    .order('nombre')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    nombre: body.nombre,
    categoria: body.categoria,
    alcance: body.alcance,
    requiere_discernimiento_confra: body.requiere_discernimiento_confra ?? false,
    requiere_discernimiento_eqt: body.requiere_discernimiento_eqt ?? false,
  }
  if (body.requisitos) insertData.requisitos = body.requisitos

  const { error } = await supabase.from('tipos_eventos').insert(insertData)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
