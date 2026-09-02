export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import PersonasTable from './_components/personas-table'
import PersonasFilters, { type Ubicacion } from './_components/personas-filters'
import DataPagination from '@/components/data-pagination'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/** Normaliza a minúsculas sin tildes, para deduplicar variantes de la misma provincia/localidad. */
function normalizarUbicacion(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/**
 * Pares provincia + localidad existentes entre las personas activas, deduplicados.
 * Alimenta los combobox de Provincia y Ciudad del filtro: solo se ofrecen valores
 * que realmente están cargados (y que el usuario puede ver, porque RLS aplica acá también).
 */
async function fetchUbicaciones(supabase: SupabaseServerClient): Promise<Ubicacion[]> {
  const CHUNK = 1000
  const MAX_CHUNKS = 20
  const vistos = new Set<string>()
  const ubicaciones: Ubicacion[] = []

  for (let i = 0; i < MAX_CHUNKS; i++) {
    const { data, error } = await supabase
      .from('personas')
      .select('provincia, localidad')
      .is('fecha_baja', null)
      .not('provincia', 'is', null)
      .order('id')
      .range(i * CHUNK, i * CHUNK + CHUNK - 1)

    if (error || !data) break

    for (const row of data) {
      const prov = (row.provincia ?? '').trim()
      if (!prov) continue
      const loc = (row.localidad ?? '').trim()
      const key = `${normalizarUbicacion(prov)}|${normalizarUbicacion(loc)}`
      if (vistos.has(key)) continue
      vistos.add(key)
      ubicaciones.push({ provincia: prov, localidad: loc || null })
    }

    if (data.length < CHUNK) break
  }

  return ubicaciones
}

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    estado?: string
    estado_eclesial?: string
    provincia?: string
    localidad?: string
    modo?: string
    ministerio_id?: string
    organizacion_id?: string
    persona?: string
    sortBy?: string
    sortDir?: string
    page?: string
  }>
}) {
  const [params, ctx] = await Promise.all([searchParams, getUserContext()])
  const q = params.q ?? ''
  const estado = params.estado ?? ''
  const estado_eclesial = params.estado_eclesial ?? ''
  const provincia = params.provincia ?? ''
  const localidad = params.localidad ?? ''
  const modo = params.modo ?? ''
  const ministerio_id = params.ministerio_id ?? ''
  const organizacion_id = params.organizacion_id ?? ''
  const initialPersonaId = params.persona ?? null
  const sortBy = params.sortBy ?? ''
  const sortDir = (params.sortDir === 'asc' || params.sortDir === 'desc') ? params.sortDir : 'asc'

  const PAGE_SIZE = 25
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const canCreate = ctx ? canPerform(ctx, 'person.create') : false
  const canUpdate = ctx ? canPerform(ctx, 'person.update') : false
  const canManage = canCreate && canUpdate
  const canExport = ctx ? canPerform(ctx, 'personas.export') : false
  const supabase = await createClient()

  // Load ministerios for the filter select
  const [{ data: ministerios }, { data: organizaciones }] = await Promise.all([
    canManage
      ? supabase.from('ministerios').select('id, nombre').eq('activo', true).order('nombre')
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    supabase.from('organizaciones').select('id, nombre, tipo').in('tipo', ['confraternidad', 'fraternidad']).is('fecha_baja', null).order('tipo').order('nombre'),
  ])

  // Ubicaciones existentes (provincia + localidad) para los combobox de filtro.
  // Supabase no expone DISTINCT, así que se traen las columnas en tandas y se deduplican acá.
  const ubicaciones = await fetchUbicaciones(supabase)

  // Relational filters: get persona ids matching modo/ministerio
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
  if (canManage && ministerio_id) {
    const { data } = await supabase
      .from('asignaciones_ministerio')
      .select('persona_id')
      .eq('ministerio_id', ministerio_id)
      .is('fecha_fin', null)
    ministerioIds = data?.map(r => r.persona_id) ?? []
  }

  let orgIds: string[] | null = null
  if (organizacion_id) {
    const { data } = await supabase
      .from('persona_organizacion')
      .select('persona_id')
      .eq('organizacion_id', organizacion_id)
      .is('fecha_fin', null)
    orgIds = data?.map(r => r.persona_id) ?? []
  }

  // Intersect all relational filters
  let filterIds: string[] | null = null
  const relIds = [modoIds, ministerioIds, orgIds].filter(arr => arr !== null) as string[][]
  if (relIds.length > 0) {
    filterIds = relIds.reduce((acc, arr) => acc.filter(id => arr.includes(id)))
  }

  // If relational filter was set but no matches found, short-circuit
  const noResults = filterIds !== null && filterIds.length === 0

  type PersonaRow = {
    id: string
    nombre: string
    apellido: string
    email: string | null
    telefono: string | null
    localidad?: string | null
    estado?: string | null
    estado_eclesial?: string | null
    confraternidad: string | null
    fraternidad: string | null
    modo_participacion: string | null
  }

  let personas: PersonaRow[] = []
  let totalCount = 0

  const SORTABLE_PERSONAS = canManage
    ? ['apellido', 'email', 'localidad', 'estado_eclesial', 'estado']
    : ['apellido', 'email']
  const sortCol = (sortBy && SORTABLE_PERSONAS.includes(sortBy)) ? sortBy : 'apellido'
  const sortAsc = sortBy ? sortDir === 'asc' : true

  if (!noResults) {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('personas')
      .select('id, nombre, apellido, email, telefono, localidad, estado, estado_eclesial, tipo_persona', { count: 'exact' })
      .is('fecha_baja', null)
      .order(sortCol, { ascending: sortAsc })
      .range(from, to)

    if (q) {
      query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,email.ilike.%${q}%`)
    }
    if (canManage && estado) query = query.eq('estado', estado)
    if (canManage && estado_eclesial) query = query.eq('estado_eclesial', estado_eclesial)
    if (provincia) query = query.ilike('provincia', provincia)
    if (localidad) query = query.ilike('localidad', localidad)
    // Convivente y Otro son categorías de persona, pero se presentan junto a los
    // modos institucionales para que el filtro coincida con el lenguaje de la lista.
    if (modo === 'convivente') query = query.in('tipo_persona', ['convivente', 'no_cecista'])
    if (modo === 'otro') query = query.eq('tipo_persona', 'otro')
    if (filterIds !== null) query = query.in('id', filterIds)

    const { data, count } = await query
    totalCount = count ?? 0

    const personaRows = data ?? []
    const personaIds = personaRows.map(persona => persona.id)

    let modosActuales: { persona_id: string; modo: string }[] = []
    let organizacionesActuales: {
      persona_id: string
      tipo_relacion: string
      organizacion: { nombre: string } | null
    }[] = []

    if (personaIds.length > 0) {
      const [{ data: modosData }, { data: organizacionesData }] = await Promise.all([
        supabase
          .from('persona_modos')
          .select('persona_id, modo')
          .in('persona_id', personaIds)
          .is('fecha_fin', null),
        supabase
          .from('persona_organizacion')
          .select('persona_id, tipo_relacion, organizacion:organizaciones!organizacion_id(nombre)')
          .in('persona_id', personaIds)
          .is('fecha_fin', null),
      ])

      modosActuales = modosData ?? []
      organizacionesActuales = (organizacionesData ?? []) as unknown as typeof organizacionesActuales
    }

    const modoPorPersona = new Map(modosActuales.map(row => [row.persona_id, row.modo]))
    const organizacionesPorPersona = new Map<string, { confraternidad: string | null; fraternidad: string | null }>()

    for (const row of organizacionesActuales) {
      const actual = organizacionesPorPersona.get(row.persona_id) ?? { confraternidad: null, fraternidad: null }
      if (row.tipo_relacion === 'confraternidad') actual.confraternidad = row.organizacion?.nombre ?? null
      if (row.tipo_relacion === 'fraternidad') actual.fraternidad = row.organizacion?.nombre ?? null
      organizacionesPorPersona.set(row.persona_id, actual)
    }

    personas = personaRows.map(persona => {
      const organizacion = organizacionesPorPersona.get(persona.id)
      const modoParticipacion = persona.tipo_persona === 'otro'
        ? 'otro'
        : persona.tipo_persona === 'convivente' || persona.tipo_persona === 'no_cecista'
          ? 'convivente'
          : modoPorPersona.get(persona.id) ?? null

      return {
        id: persona.id,
        nombre: persona.nombre,
        apellido: persona.apellido,
        email: persona.email,
        telefono: persona.telefono,
        ...(canManage
          ? {
              localidad: persona.localidad,
              estado: persona.estado,
              estado_eclesial: persona.estado_eclesial,
            }
          : {}),
        confraternidad: organizacion?.confraternidad ?? null,
        fraternidad: organizacion?.fraternidad ?? null,
        modo_participacion: modoParticipacion,
      }
    })
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const hasFilters = !!(
    q || provincia || localidad || modo || organizacion_id ||
    (canManage && (estado || estado_eclesial || ministerio_id))
  )

  // Build search string for export button
  const exportParams = new URLSearchParams()
  if (q) exportParams.set('q', q)
  if (canManage && estado) exportParams.set('estado', estado)
  if (canManage && estado_eclesial) exportParams.set('estado_eclesial', estado_eclesial)
  if (provincia) exportParams.set('provincia', provincia)
  if (localidad) exportParams.set('localidad', localidad)
  if (modo) exportParams.set('modo', modo)
  if (canManage && ministerio_id) exportParams.set('ministerio_id', ministerio_id)
  if (organizacion_id) exportParams.set('organizacion_id', organizacion_id)
  const exportSearch = exportParams.size > 0 ? `?${exportParams.toString()}` : ''

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Gestión de Personas
        </h1>
        <p className="mt-2 text-muted-foreground">
          {canManage
            ? 'Administra los datos de todas las personas en el sistema'
            : 'Consulta la información de contacto y participación de las personas'}
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Personas Registradas</CardTitle>
            <CardDescription>Lista completa de personas en el sistema</CardDescription>
          </div>
          {canCreate && (
            <Link href="/personas/nueva">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Persona
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <PersonasFilters
            ministerios={ministerios ?? []}
            organizaciones={organizaciones ?? []}
            ubicaciones={ubicaciones}
            canManage={canManage}
            defaults={{
              q,
              estado: canManage ? estado : '',
              estado_eclesial: canManage ? estado_eclesial : '',
              provincia,
              localidad,
              modo,
              ministerio_id: canManage ? ministerio_id : '',
              organizacion_id,
            }}
          />

          {/* Table — always rendered so ?persona=id deep-links work even with active filters */}
          <PersonasTable
            personas={personas}
            canUpdate={canUpdate}
            canViewDetails={canManage}
            canExport={canManage && canExport}
            exportSearch={exportSearch}
            initialPersonaId={canManage ? initialPersonaId : null}
            sortBy={sortBy}
            sortDir={sortDir}
            totalCount={totalCount}
          />
          {totalCount > 0 && (
            <DataPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
            />
          )}
          {personas.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {hasFilters ? 'No se encontraron personas' : 'No hay personas registradas'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {hasFilters ? 'Probá con otros filtros' : 'Comienza agregando la primera persona al sistema'}
              </p>
              {!hasFilters && canCreate && (
                <Link href="/personas/nueva" className="mt-4 inline-block">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Persona
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
