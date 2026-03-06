import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus, Eye, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/context'

const estadoClases: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  solicitado: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  aprobado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  publicado: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  finalizado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

const tipoLabel: Record<string, string> = {
  convivencia: 'Convivencia',
  retiro: 'Retiro',
  taller: 'Taller',
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const [supabase, ctx] = await Promise.all([createClient(), getUserContext()])
  const canCreate = ctx && (ctx.is_admin || ctx.nivel_max >= 50)

  let query = supabase
    .from('eventos')
    .select('id, nombre, tipo, estado, fecha_inicio, fecha_fin, organizacion:organizaciones!organizacion_id(nombre)')
    .order('fecha_inicio', { ascending: false })

  if (q) {
    query = query.ilike('nombre', `%${q}%`)
  }

  const { data: eventos } = await query

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          Gestión de Eventos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Crea y administra eventos espirituales
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Eventos Registrados</CardTitle>
            <CardDescription>Lista completa de eventos en el sistema</CardDescription>
          </div>
          {canCreate && (
            <Link href="/eventos/nuevo">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Evento
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
              placeholder="Buscar por nombre del evento..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {eventos && eventos.length > 0 ? (
            <div className="space-y-3">
              {eventos.map((evento: any) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground">{evento.nombre}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoClases[evento.estado] ?? estadoClases.borrador}`}>
                        {evento.estado}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{tipoLabel[evento.tipo] ?? evento.tipo}</span>
                      <span>{evento.fecha_inicio} — {evento.fecha_fin}</span>
                      {evento.organizacion && <span>{evento.organizacion.nombre}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/eventos/${evento.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/eventos/${evento.id}/editar`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {q ? 'No se encontraron eventos' : 'No hay eventos registrados'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {q ? `Sin resultados para "${q}"` : 'Comienza agregando el primer evento al sistema'}
              </p>
              {!q && canCreate && (
                <Link href="/eventos/nuevo" className="mt-4 inline-block">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Evento
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
