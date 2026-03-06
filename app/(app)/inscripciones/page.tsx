import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const estadoClases: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmado: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  lista_espera: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
}

export default async function InscripcionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('evento_participantes')
    .select(`
      id, rol_en_evento, estado_inscripcion, fecha_inscripcion,
      persona:personas!persona_id(nombre, apellido),
      evento:eventos!evento_id(nombre, fecha_inicio)
    `)
    .order('fecha_inscripcion', { ascending: false })

  if (estado && estado !== 'todos') {
    query = query.eq('estado_inscripcion', estado)
  }

  const { data: inscripciones } = await query

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Gestión de Inscripciones
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra las inscripciones a eventos
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Inscripciones</CardTitle>
            <CardDescription>Todas las inscripciones a eventos en el sistema</CardDescription>
          </div>
          <Link href="/inscripciones/nueva">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Inscripción
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter */}
          <form method="GET">
            <select
              name="estado"
              defaultValue={estado ?? 'todos'}
              onChange={e => e.currentTarget.form?.requestSubmit()}
              className="rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Cancelados</option>
              <option value="lista_espera">Lista de Espera</option>
            </select>
          </form>

          {inscripciones && inscripciones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Persona</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Evento</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Rol</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha Inscripción</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripciones.map((insc: any) => (
                    <tr key={insc.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">
                        {insc.persona ? `${insc.persona.apellido}, ${insc.persona.nombre}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {insc.evento ? `${insc.evento.nombre} (${insc.evento.fecha_inicio})` : '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{insc.rol_en_evento}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(insc.fecha_inscripcion).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoClases[insc.estado_inscripcion] ?? ''}`}>
                          {insc.estado_inscripcion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay inscripciones</h3>
              <p className="mt-2 text-muted-foreground">Aún no hay personas inscritas a eventos</p>
              <Link href="/inscripciones/nueva" className="mt-4 inline-block">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Inscripción
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
