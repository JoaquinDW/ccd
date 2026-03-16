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
  if (body.email_ccd) insertData.email_ccd = body.email_ccd
  if (body.telefono) insertData.telefono = body.telefono
  if (body.tipo_documento) insertData.tipo_documento = body.tipo_documento
  if (body.documento) insertData.documento = body.documento
  if (body.fecha_nacimiento) insertData.fecha_nacimiento = body.fecha_nacimiento
  if (body.direccion) insertData.direccion = body.direccion
  if (body.direccion_nro) insertData.direccion_nro = body.direccion_nro
  if (body.localidad) insertData.localidad = body.localidad
  if (body.codigo_postal) insertData.codigo_postal = body.codigo_postal
  if (body.provincia) insertData.provincia = body.provincia
  if (body.pais) insertData.pais = body.pais
  if (body.estado_eclesial) insertData.estado_eclesial = body.estado_eclesial
  if (body.estado_vida) insertData.estado_vida = body.estado_vida
  if (body.diocesis) insertData.diocesis = body.diocesis
  if (body.categoria_persona) insertData.categoria_persona = body.categoria_persona
  if (body.parroquia) insertData.parroquia = body.parroquia
  if (body.socio_asociacion !== undefined) insertData.socio_asociacion = body.socio_asociacion
  if (body.referente_comunidad !== undefined) insertData.referente_comunidad = body.referente_comunidad
  if (body.cecista_dedicado !== undefined) insertData.cecista_dedicado = body.cecista_dedicado
  if (body.intercesor_dies_natalis) insertData.intercesor_dies_natalis = body.intercesor_dies_natalis

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

  if (Array.isArray(body.categorias_no_cecista) && body.categorias_no_cecista.length > 0 && persona) {
    const rows = body.categorias_no_cecista.map((categoria: string) => ({
      persona_id: persona.id,
      categoria,
    }))
    const { error: catError } = await supabase.from('persona_categoria_no_cecista').insert(rows)
    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: persona.id })
}
