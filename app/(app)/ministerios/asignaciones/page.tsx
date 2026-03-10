import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserCheck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export default async function AsignacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string }>
}) {
  const [{ q, rol: rolFiltro }, ctx] = await Promise.all([searchParams, getUserContext()])
  if (!ctx) redirect('/auth/login')
  if (!canPerform(ctx, 'roles.assign')) redirect('/dashboard')

  const supabase = await createClient()

  // Cargar roles para el filtro
  const { data: roles } = await supabase
    .from('roles_sistema')
    .select('id, nombre')
    .eq('activo', true)
    .order('nivel_acceso', { ascending: false })

  // Paso 1: cargar asignaciones activas
  let query = supabase
    .from('usuario_roles')
    .select(`
      id,
      fecha_inicio,
      persona_id,
      organizacion:organizaciones!organizacion_id(nombre),
      rol_sistema:roles_sistema!rol_sistema_id(nombre, nivel_acceso)
    `)
    .eq('activo', true)
    .order('fecha_inicio', { ascending: false })

  if (rolFiltro) {
    query = query.eq('rol_sistema_id', rolFiltro)
  }

  const { data: asignaciones } = await query

  // Paso 2: cargar datos de personas por sus IDs
  const personaIds = [...new Set(
    (asignaciones ?? []).map((a: any) => a.persona_id).filter(Boolean)
  )]

  const personasPorId: Record<string, { nombre: string; apellido: string; email: string | null }> = {}
  if (personaIds.length > 0) {
    const { data: personasData } = await supabase
      .from('personas')
      .select('id, nombre, apellido, email')
      .in('id', personaIds)
    for (const p of personasData ?? []) {
      personasPorId[p.id] = p
    }
  }

  // Filtrar por nombre si hay búsqueda
  const asignacionesFiltradas = (asignaciones ?? []).filter((a: any) => {
    if (!q) return true
    const persona = personasPorId[a.persona_id]
    if (!persona) return false
    const nombre = `${persona.nombre} ${persona.apellido}`.toLowerCase()
    const email = (persona.email ?? '').toLowerCase()
    return nombre.includes(q.toLowerCase()) || email.includes(q.toLowerCase())
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="h-8 w-8 text-primary" />
          Asignaciones de Roles
        </h1>
        <p className="mt-2 text-muted-foreground">
          Usuarios con roles del sistema asignados
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Asignaciones Activas</CardTitle>
            <CardDescription>Gestiona el acceso de los usuarios al sistema</CardDescription>
          </div>
          <Link href="/ministerios/asignaciones/nueva">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Asignación
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre o email..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <select
              name="rol"
              defaultValue={rolFiltro ?? ''}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos los roles</option>
              {(roles ?? []).map((r: any) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
          </form>

          {/* Tabla */}
          {asignacionesFiltradas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Usuario</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Rol</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Organización</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Desde</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignacionesFiltradas.map((a: any) => {
                    const persona = personasPorId[a.persona_id]
                    const nombreCompleto = persona
                      ? `${persona.nombre} ${persona.apellido}`
                      : 'Persona no encontrada'
                    return (
                      <tr key={a.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{nombreCompleto}</div>
                          {persona?.email && (
                            <div className="text-xs text-muted-foreground">{persona.email}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                            {a.rol_sistema?.nombre ?? '—'}
                          </span>
                          {a.rol_sistema?.nivel_acceso && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (nivel {a.rol_sistema.nivel_acceso})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {a.organizacion?.nombre ?? <span className="italic">Global</span>}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {a.fecha_inicio ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/ministerios/asignaciones/${a.id}/revocar`}>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              Revocar
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {q || rolFiltro ? 'No se encontraron asignaciones' : 'No hay asignaciones activas'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {q || rolFiltro
                  ? 'Ajusta los filtros de búsqueda'
                  : 'Asigna un rol a un usuario para comenzar'}
              </p>
              {!q && !rolFiltro && (
                <Link href="/ministerios/asignaciones/nueva" className="mt-4 inline-block">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Asignación
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
