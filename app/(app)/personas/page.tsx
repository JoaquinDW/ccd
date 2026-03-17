export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import PersonasTable from './_components/personas-table'
import PersonasFilters from './_components/personas-filters'

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    estado?: string
    estado_eclesial?: string
    provincia?: string
    modo?: string
    ministerio_id?: string
    persona?: string
    sortBy?: string
    sortDir?: string
  }>
}) {
  const [params, ctx] = await Promise.all([searchParams, getUserContext()])
  const q = params.q ?? ''
  const estado = params.estado ?? ''
  const estado_eclesial = params.estado_eclesial ?? ''
  const provincia = params.provincia ?? ''
  const modo = params.modo ?? ''
  const ministerio_id = params.ministerio_id ?? ''
  const initialPersonaId = params.persona ?? null
  const sortBy = params.sortBy ?? ''
  const sortDir = (params.sortDir === 'asc' || params.sortDir === 'desc') ? params.sortDir : 'asc'

  const canCreate = ctx ? canPerform(ctx, 'person.create') : false
  const canUpdate = ctx ? canPerform(ctx, 'person.update') : false
  const supabase = await createClient()

  // Load ministerios for the filter select
  const { data: ministerios } = await supabase
    .from('ministerios')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')

  // Relational filters: get persona ids matching modo/ministerio
  let modoIds: string[] | null = null
  if (modo) {
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

  // Intersect relational filters
  let filterIds: string[] | null = null
  if (modoIds !== null && ministerioIds !== null) {
    filterIds = modoIds.filter(id => ministerioIds!.includes(id))
  } else {
    filterIds = modoIds ?? ministerioIds
  }

  // If relational filter was set but no matches found, short-circuit
  const noResults = filterIds !== null && filterIds.length === 0

  let personas: { id: string; nombre: string; apellido: string; email: string | null; telefono: string | null; localidad: string | null; estado: string | null; estado_eclesial: string | null }[] = []

  const SORTABLE_PERSONAS = ['apellido', 'email', 'localidad', 'estado_eclesial', 'estado']
  const sortCol = (sortBy && SORTABLE_PERSONAS.includes(sortBy)) ? sortBy : 'apellido'
  const sortAsc = sortBy ? sortDir === 'asc' : true

  if (!noResults) {
    let query = supabase
      .from('personas')
      .select('id, nombre, apellido, email, telefono, localidad, estado, estado_eclesial')
      .is('fecha_baja', null)
      .order(sortCol, { ascending: sortAsc })

    if (q) {
      query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,email.ilike.%${q}%`)
    }
    if (estado) query = query.eq('estado', estado)
    if (estado_eclesial) query = query.eq('estado_eclesial', estado_eclesial)
    if (provincia) query = query.ilike('provincia', `%${provincia}%`)
    if (filterIds !== null) query = query.in('id', filterIds)

    const { data } = await query
    personas = data ?? []
  }

  const hasFilters = !!(q || estado || estado_eclesial || provincia || modo || ministerio_id)

  // Build search string for export button
  const exportParams = new URLSearchParams()
  if (q) exportParams.set('q', q)
  if (estado) exportParams.set('estado', estado)
  if (estado_eclesial) exportParams.set('estado_eclesial', estado_eclesial)
  if (provincia) exportParams.set('provincia', provincia)
  if (modo) exportParams.set('modo', modo)
  if (ministerio_id) exportParams.set('ministerio_id', ministerio_id)
  const exportSearch = exportParams.size > 0 ? `?${exportParams.toString()}` : ''

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Gestión de Personas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra los datos de todas las personas en el sistema
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
            defaults={{ q, estado, estado_eclesial, provincia, modo, ministerio_id }}
          />

          {/* Table — always rendered so ?persona=id deep-links work even with active filters */}
          <PersonasTable
            personas={personas}
            canCreate={canCreate}
            canUpdate={canUpdate}
            exportSearch={exportSearch}
            initialPersonaId={initialPersonaId}
            sortBy={sortBy}
            sortDir={sortDir}
          />
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
