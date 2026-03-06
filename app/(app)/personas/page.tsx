import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const [{ q }, ctx] = await Promise.all([searchParams, getUserContext()])
  const canCreate = ctx ? canPerform(ctx, 'person.create') : false
  const canUpdate = ctx ? canPerform(ctx, 'person.update') : false
  const supabase = await createClient()

  let query = supabase
    .from('personas')
    .select('id, nombre, apellido, email, telefono, localidad, estado')
    .is('fecha_baja', null)
    .order('apellido', { ascending: true })

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: personas } = await query

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
          {/* Search */}
          <form method="GET" className="relative">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, apellido o email..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Table */}
          {personas && personas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Teléfono</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Localidad</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {personas.map((persona) => (
                    <tr key={persona.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {persona.apellido}, {persona.nombre}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{persona.email ?? '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{persona.telefono ?? '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{persona.localidad ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          persona.estado === 'activo'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {persona.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canUpdate && (
                          <Link href={`/personas/${persona.id}/editar`}>
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
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {q ? 'No se encontraron personas' : 'No hay personas registradas'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {q ? `Sin resultados para "${q}"` : 'Comienza agregando la primera persona al sistema'}
              </p>
              {!q && canCreate && (
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
