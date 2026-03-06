import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function POST(request: Request) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (!canPerform(ctx, 'person.create')) {
    return NextResponse.json(
      { error: 'No tenés permiso para crear personas' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    nombre: body.nombre,
    apellido: body.apellido,
    acepta_comunicaciones: body.acepta_comunicaciones ?? true,
  }
  if (body.email) insertData.email = body.email
  if (body.telefono) insertData.telefono = body.telefono
  if (body.tipo_documento) insertData.tipo_documento = body.tipo_documento
  if (body.documento) insertData.documento = body.documento
  if (body.fecha_nacimiento) insertData.fecha_nacimiento = body.fecha_nacimiento
  if (body.direccion) insertData.direccion = body.direccion
  if (body.localidad) insertData.localidad = body.localidad
  if (body.provincia) insertData.provincia = body.provincia
  if (body.pais) insertData.pais = body.pais

  const { data: persona, error: personaError } = await supabase
    .from('personas')
    .insert(insertData)
    .select('id')
    .single()

  if (personaError) {
    return NextResponse.json({ error: personaError.message }, { status: 400 })
  }

  if (body.modo_inicial && persona) {
    const today = new Date().toISOString().split('T')[0]
    const { error: modoError } = await supabase
      .from('persona_modos')
      .insert({
        persona_id: persona.id,
        modo: body.modo_inicial,
        fecha_inicio: today,
      })
    if (modoError) {
      return NextResponse.json({ error: modoError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: persona.id })
}
