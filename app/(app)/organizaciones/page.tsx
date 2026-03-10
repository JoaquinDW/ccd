import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, Edit2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import OrgExportButton from './_components/org-export-button'

export default async function OrganizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    tipo?: string
    estado?: string
    provincia?: string
  }>
}) {
  const [params, ctx] = await Promise.all([searchParams, getUserContext()])
  const q = params.q ?? ''
  const tipo = params.tipo ?? ''
  const estado = params.estado ?? ''
  const provincia = params.provincia ?? ''

  const canCreate = ctx ? canPerform(ctx, 'organization.create') : false
  const canUpdate = ctx ? canPerform(ctx, 'organization.update') : false
  const supabase = await createClient()

  let query = supabase
    .from('organizaciones')
    .select('id, nombre, tipo, localidad, provincia, estado, parent:organizaciones!parent_id(nombre)')
    .is('fecha_baja', null)
    .order('nombre', { ascending: true })

  if (q) query = query.ilike('nombre', `%${q}%`)
  if (tipo) query = query.eq('tipo', tipo)
  if (estado) query = query.eq('estado', estado)
  if (provincia) query = query.ilike('provincia', `%${provincia}%`)

  const { data: organizaciones } = await query

  const tipoLabel: Record<string, string> = {
    comunidad: 'Comunidad',
    confraternidad: 'Confraternidad',
    fraternidad: 'Fraternidad',
    casa_retiro: 'Casa de Retiro',
    eqt: 'EQT',
    otra: 'Otra',
  }

  const hasFilters = !!(q || tipo || estado || provincia)

  const exportParams = new URLSearchParams()
  if (q) exportParams.set('q', q)
  if (tipo) exportParams.set('tipo', tipo)
  if (estado) exportParams.set('estado', estado)
  if (provincia) exportParams.set('provincia', provincia)
  const exportSearch = exportParams.size > 0 ? `?${exportParams.toString()}` : ''

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Gestión de Organizaciones
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra las organizaciones y su jerarquía
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Organizaciones Registradas</CardTitle>
            <CardDescription>Lista completa de organizaciones en el sistema</CardDescription>
          </div>
          {canCreate && (
            <Link href="/organizaciones/nueva">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Organización
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <form method="GET" className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-50 flex-1">
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 pl-8 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              name="tipo"
              defaultValue={tipo}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos los tipos</option>
              <option value="comunidad">Comunidad</option>
              <option value="confraternidad">Confraternidad</option>
              <option value="fraternidad">Fraternidad</option>
              <option value="casa_retiro">Casa de Retiro</option>
              <option value="eqt">EQT</option>
              <option value="otra">Otra</option>
            </select>

            <select
              name="estado"
              defaultValue={estado}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos los estados</option>
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>

            <input
              name="provincia"
              defaultValue={provincia}
              placeholder="Provincia..."
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground w-32"
            />

            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Filtrar
            </button>

            {hasFilters && (
              <Link href="/organizaciones" className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                Limpiar
              </Link>
            )}
          </form>

          {/* Table */}
          {organizaciones && organizaciones.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{organizaciones.length} organización{organizaciones.length !== 1 ? 'es' : ''}</span>
                <OrgExportButton searchString={exportSearch} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Depende de</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Localidad</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizaciones.map((org: any) => (
                      <tr key={org.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">
                          <Link href={`/organizaciones/${org.id}`} className="text-foreground hover:text-primary">
                            {org.nombre}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{tipoLabel[org.tipo] ?? org.tipo}</td>
                        <td className="py-3 px-4 text-muted-foreground">{org.parent?.nombre ?? '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{org.localidad ?? '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            org.estado === 'activa'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {org.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {canUpdate && (
                            <Link href={`/organizaciones/${org.id}/editar`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {hasFilters ? 'No se encontraron organizaciones' : 'No hay organizaciones registradas'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {hasFilters ? 'Probá con otros filtros' : 'Comienza agregando la primera organización al sistema'}
              </p>
              {!hasFilters && canCreate && (
                <Link href="/organizaciones/nueva" className="mt-4 inline-block">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Organización
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
