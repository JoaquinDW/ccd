import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

const TIPO_PERSONA_LABELS: Record<string, string> = {
  interesado: 'Interesado/a',
  inscripto: 'Inscripto/a',
  convivente: 'Convivente',
  no_cecista: 'Convivente',
  cecista: 'Cecista',
  otro: 'Otro',
}

function tipoPersonaLabel(tipo: string | null | undefined): string {
  return tipo ? (TIPO_PERSONA_LABELS[tipo] ?? tipo) : ''
}

export async function GET(req: NextRequest) {
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (
    !canPerform(ctx, 'personas.export') ||
    !canPerform(ctx, 'person.create') ||
    !canPerform(ctx, 'person.update')
  ) {
    return NextResponse.json({ error: 'Sin permiso para exportar personas' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const estado = searchParams.get('estado') ?? ''
  const estado_eclesial = searchParams.get('estado_eclesial') ?? ''
  const provincia = searchParams.get('provincia') ?? ''
  const localidad = searchParams.get('localidad') ?? ''
  const modo = searchParams.get('modo') ?? ''
  const ministerio_id = searchParams.get('ministerio_id') ?? ''

  const supabase = await createClient()

  // Relational filters: get matching persona ids
  let modoIds: string[] | null = null
  if (modo && modo !== 'convivente' && modo !== 'otro') {
    const { data } = await supabase
      .from('persona_modos')
      .select('persona_id')
      .eq('modo', modo)
      .is('fecha_fin', null)
    modoIds = data?.map(r => r.persona_id) ?? []
  }

  let ministerioIds: string[] | null = null
  if (ministerio_id) {
    const { data } = await supabase
      .from('asignaciones_ministerio')
      .select('persona_id')
      .eq('ministerio_id', ministerio_id)
      .is('fecha_fin', null)
    ministerioIds = data?.map(r => r.persona_id) ?? []
  }

  let filterIds: string[] | null = null
  if (modoIds !== null && ministerioIds !== null) {
    filterIds = modoIds.filter(id => ministerioIds!.includes(id))
  } else {
    filterIds = modoIds ?? ministerioIds
  }

  if (filterIds !== null && filterIds.length === 0) {
    return NextResponse.json([])
  }

  // Main personas query (no nested joins)
  let query = supabase
    .from('personas')
    .select(`
      id, apellido, nombre, email, telefono,
      tipo_documento, documento,
      localidad, provincia, pais,
      estado, estado_eclesial, diocesis,
      tipo_persona, parroquia,
      socio_asociacion, referente_comunidad, cecista_dedicado,
      fecha_nacimiento, fecha_alta, acepta_comunicaciones
    `)
    .is('fecha_baja', null)
    .order('apellido', { ascending: true })

  if (q) query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,email.ilike.%${q}%`)
  if (estado) query = query.eq('estado', estado)
  if (estado_eclesial) query = query.eq('estado_eclesial', estado_eclesial)
  if (provincia) query = query.ilike('provincia', provincia)
  if (localidad) query = query.ilike('localidad', localidad)
  if (modo === 'convivente') query = query.in('tipo_persona', ['convivente', 'no_cecista'])
  if (modo === 'otro') query = query.eq('tipo_persona', 'otro')
  if (filterIds !== null) query = query.in('id', filterIds)

  const { data: personas, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!personas || personas.length === 0) {
    return NextResponse.json([])
  }

  const ids = personas.map(p => p.id)

  // Fetch current modos for all returned personas
  const { data: modos } = await supabase
    .from('persona_modos')
    .select('persona_id, modo')
    .in('persona_id', ids)
    .is('fecha_fin', null)

  // Fetch current ministry assignments with ministerio name
  const { data: asignaciones } = await supabase
    .from('asignaciones_ministerio')
    .select('persona_id, ministerio_id')
    .in('persona_id', ids)
    .is('fecha_fin', null)

  // Fetch ministerio names
  const ministerioIdsNeeded = [...new Set((asignaciones ?? []).map(a => a.ministerio_id))]
  let ministerioNombres: Record<string, string> = {}
  if (ministerioIdsNeeded.length > 0) {
    const { data: mins } = await supabase
      .from('ministerios')
      .select('id, nombre')
      .in('id', ministerioIdsNeeded)
    ministerioNombres = Object.fromEntries((mins ?? []).map(m => [m.id, m.nombre]))
  }

  // Index by persona_id for fast lookup
  const modoByPersona = Object.fromEntries((modos ?? []).map(m => [m.persona_id, m.modo]))
  const ministerioByPersona = Object.fromEntries(
    (asignaciones ?? []).map(a => [a.persona_id, ministerioNombres[a.ministerio_id] ?? ''])
  )

  const rows = personas.map(p => ({
    Apellido: p.apellido,
    Nombre: p.nombre,
    Email: p.email ?? '',
    Teléfono: p.telefono ?? '',
    'Tipo documento': p.tipo_documento ?? '',
    Documento: p.documento ?? '',
    Localidad: p.localidad ?? '',
    Provincia: p.provincia ?? '',
    País: p.pais ?? '',
    Estado: p.estado ?? '',
    'Estado eclesiástico': p.estado_eclesial ?? '',
    Diócesis: p.diocesis ?? '',
    'Fecha nacimiento': p.fecha_nacimiento ?? '',
    'Fecha alta': p.fecha_alta ?? '',
    'Acepta comunicaciones': p.acepta_comunicaciones ? 'Sí' : 'No',
    Tipo: tipoPersonaLabel(p.tipo_persona),
    Parroquia: p.parroquia ?? '',
    'Socio asociación': p.socio_asociacion ? 'Sí' : 'No',
    'Referente comunidad': p.referente_comunidad ? 'Sí' : 'No',
    'Cecista dedicado': p.cecista_dedicado ? 'Sí' : 'No',
    'Modo actual': p.tipo_persona === 'otro'
      ? 'otro'
      : p.tipo_persona === 'convivente' || p.tipo_persona === 'no_cecista'
        ? 'convivente'
        : modoByPersona[p.id] ?? '',
    'Ministerio actual': ministerioByPersona[p.id] ?? '',
  }))

  return NextResponse.json(rows)
}
