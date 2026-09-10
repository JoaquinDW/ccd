import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { fetchUbicaciones, variantesDe } from '@/lib/personas/ubicaciones'

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
      localidad, provincia, pais,
      estado_eclesial, diocesis,
      tipo_persona,
      fecha_nacimiento
    `)
    .is('fecha_baja', null)
    .order('apellido', { ascending: true })

  if (q) query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,email.ilike.%${q}%`)
  if (estado) query = query.eq('estado', estado)
  if (estado_eclesial) query = query.eq('estado_eclesial', estado_eclesial)
  // Mismo criterio que el listado: se buscan las variantes tal cual están guardadas.
  if (provincia || localidad) {
    const { variantesProvincia, variantesLocalidad } = await fetchUbicaciones(supabase)
    if (provincia) {
      const variantes = variantesDe(provincia, variantesProvincia)
      query = variantes.length ? query.in('provincia', variantes) : query.ilike('provincia', provincia)
    }
    if (localidad) {
      const variantes = variantesDe(localidad, variantesLocalidad)
      query = variantes.length ? query.in('localidad', variantes) : query.ilike('localidad', localidad)
    }
  }
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

  // Fetch current confraternidad/fraternidad membership
  const { data: organizaciones } = await supabase
    .from('persona_organizacion')
    .select('persona_id, tipo_relacion, organizacion:organizaciones!organizacion_id(nombre)')
    .in('persona_id', ids)
    .is('fecha_fin', null)

  // Index by persona_id for fast lookup
  const modoByPersona = Object.fromEntries((modos ?? []).map(m => [m.persona_id, m.modo]))
  const organizacionByPersona = new Map<string, { confraternidad: string | null; fraternidad: string | null }>()
  for (const row of (organizaciones ?? []) as unknown as {
    persona_id: string
    tipo_relacion: string
    organizacion: { nombre: string } | null
  }[]) {
    const actual = organizacionByPersona.get(row.persona_id) ?? { confraternidad: null, fraternidad: null }
    if (row.tipo_relacion === 'confraternidad') actual.confraternidad = row.organizacion?.nombre ?? null
    if (row.tipo_relacion === 'fraternidad') actual.fraternidad = row.organizacion?.nombre ?? null
    organizacionByPersona.set(row.persona_id, actual)
  }

  const rows = personas.map(p => ({
    Apellido: p.apellido,
    Nombre: p.nombre,
    Email: p.email ?? '',
    Teléfono: p.telefono ?? '',
    Localidad: p.localidad ?? '',
    Provincia: p.provincia ?? '',
    País: p.pais ?? '',
    Confraternidad: organizacionByPersona.get(p.id)?.confraternidad ?? '',
    Fraternidad: organizacionByPersona.get(p.id)?.fraternidad ?? '',
    'Estado eclesiástico': p.estado_eclesial ?? '',
    Diócesis: p.diocesis ?? '',
    'Fecha nacimiento': p.fecha_nacimiento ?? '',
    'Modo actual': p.tipo_persona === 'otro'
      ? 'otro'
      : p.tipo_persona === 'convivente' || p.tipo_persona === 'no_cecista'
        ? 'convivente'
        : modoByPersona[p.id] ?? '',
  }))

  return NextResponse.json(rows)
}
