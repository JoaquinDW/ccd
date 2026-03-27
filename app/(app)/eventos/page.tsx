export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus, Eye, Edit2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { formatDateAR } from '@/lib/utils'

const estadoClases: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  solicitud: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  discernimiento_confra: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  discernimiento_eqt: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  aprobado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  publicado: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  rechazado: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  finalizado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  cancelado: 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const estadoLabel: Record<string, string> = {
  borrador: 'Borrador',
  solicitud: 'Solicitud',
  discernimiento_confra: 'Disc. Confra/Delegado',
  discernimiento_eqt: 'Disc. Equipo Timón',
  aprobado: 'Aprobado',
  publicado: 'Publicado',
  rechazado: 'Rechazado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const tipoLabel: Record<string, string> = {
  convivencia: 'Convivencia',
  retiro: 'Retiro',
  taller: 'Taller',
}

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'solicitud', label: 'Solicitudes' },
  { value: 'discernimiento_confra', label: 'Disc. Confra' },
  { value: 'discernimiento_eqt', label: 'Disc. EqT' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'publicado', label: 'Publicados' },
]

type EventoRow = {
  id: string
  nombre: string
  tipo: string
  estado: string
  fecha_inicio: string
  fecha_fin: string
  organizacion: { nombre: string } | null
}

function EventoItem({ evento }: { evento: EventoRow }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-medium text-foreground truncate">{evento.nombre}</h3>
          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoClases[evento.estado] ?? estadoClases.borrador}`}>
            {estadoLabel[evento.estado] ?? evento.estado}
          </span>
        </div>
        <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
          <span>{tipoLabel[evento.tipo] ?? evento.tipo}</span>
          <span>{formatDateAR(evento.fecha_inicio)} — {formatDateAR(evento.fecha_fin)}</span>
          {evento.organizacion && <span>{evento.organizacion.nombre}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
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
  )
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>
}) {
  const { q, estado: estadoFiltro } = await searchParams
  const [supabase, ctx] = await Promise.all([createClient(), getUserContext()])
  const canCreate = ctx && (ctx.is_admin || ctx.nivel_max >= 50)

  // Build main query
  let query = supabase
    .from('eventos')
    .select('id, nombre, tipo, estado, fecha_inicio, fecha_fin, organizacion:organizaciones!organizacion_id(nombre)')
    .order('fecha_inicio', { ascending: false })

  if (q) query = query.ilike('nombre', `%${q}%`)
  if (estadoFiltro) query = query.eq('estado', estadoFiltro)

  const { data: eventos } = await query

  // Pendientes section: events pending the user's approval
  let pendientes: EventoRow[] = []
  if (ctx) {
    const canApproveConfra = canPerform(ctx, 'event.approve_confra')
    const canApproveTimon = canPerform(ctx, 'event.approve_eqt')

    if (canApproveConfra || canApproveTimon) {
      const pendingStates: string[] = []
      if (canApproveConfra) {
        pendingStates.push('solicitud', 'discernimiento_confra')
      }
      if (canApproveTimon) {
        pendingStates.push('discernimiento_eqt')
        if (!pendingStates.includes('solicitud')) pendingStates.push('solicitud')
      }

      const { data: pendingData } = await supabase
        .from('eventos')
        .select('id, nombre, tipo, estado, fecha_inicio, fecha_fin, requiere_discernimiento_confra, organizacion:organizaciones!organizacion_id(nombre, id)')
        .in('estado', pendingStates)
        .order('fecha_solicitud', { ascending: true })

      // Filter: only show events this user can actually act on
      pendientes = (pendingData ?? []).filter((ev: any) => {
        const confraId = ev.organizacion?.id as string | null
        const requiereConfra = ev.requiere_discernimiento_confra ?? false

        if (ev.estado === 'discernimiento_eqt' && canApproveTimon) return true

        if (ev.estado === 'solicitud') {
          if (!requiereConfra && canApproveTimon) return true
          if (requiereConfra && canApproveConfra) {
            if (ctx.is_admin) return true
            return confraId ? ctx.org_ids.includes(confraId) : false
          }
        }

        if (ev.estado === 'discernimiento_confra' && canApproveConfra) {
          if (ctx.is_admin) return true
          return confraId ? ctx.org_ids.includes(confraId) : false
        }

        return false
      }).map((ev: any) => ({
        ...ev,
        organizacion: ev.organizacion ? { nombre: ev.organizacion.nombre } : null,
      }))
    }
  }

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

      {/* Pendientes de aprobación */}
      {pendientes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pendientes de tu aprobación
            </CardTitle>
            <CardDescription>
              Estos eventos están esperando tu discernimiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendientes.map(ev => (
              <EventoItem key={ev.id} evento={ev} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main list */}
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
          {/* Search and filter */}
          <form method="GET" className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <select
              name="estado"
              defaultValue={estadoFiltro ?? ''}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {FILTROS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Filtrar
            </button>
          </form>

          {eventos && eventos.length > 0 ? (
            <div className="space-y-3">
              {(eventos as EventoRow[]).map(evento => (
                <EventoItem key={evento.id} evento={evento} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {q || estadoFiltro ? 'No se encontraron eventos' : 'No hay eventos registrados'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {q ? `Sin resultados para "${q}"` : estadoFiltro ? `No hay eventos con estado "${estadoLabel[estadoFiltro] ?? estadoFiltro}"` : 'Comienza agregando el primer evento al sistema'}
              </p>
              {!q && !estadoFiltro && canCreate && (
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
