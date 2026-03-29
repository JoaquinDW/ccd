export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Activity,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  admin_general: 'Administrador General',
  tecnico_confraternidad: 'Técnico de Confraternidad',
  responsable_fraternidad: 'Responsable de Fraternidad',
  usuario_carga: 'Usuario de Carga',
  solo_lectura: 'Solo Lectura',
}

const ESTADO_EVENT_COLORS: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  solicitado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  aprobado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  publicado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  finalizado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const MODO_LABELS: Record<string, string> = {
  colaborador: 'Colaborador',
  servidor: 'Servidor',
  asesor: 'Asesor',
  familiar: 'Familiar',
  orante: 'Orante',
  intercesor: 'Intercesor',
}

export default async function DashboardPage() {
  const ctx = await getUserContext()
  if (!ctx) redirect('/auth/login')

  const supabase = await createClient()
  const primaryOrgId = ctx.org_ids[0] ?? null

  const canApprove =
    canPerform(ctx, 'event.approve_confra') || canPerform(ctx, 'event.approve_eqt')
  const canCreatePerson = canPerform(ctx, 'person.create')
  const canCreateOrg = canPerform(ctx, 'organization.create')
  const canCreateEvent = canPerform(ctx, 'event.create')

  // ── Queries paralelas ────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [
    personasCountResult,
    organizacionesCountResult,
    eventosCountResult,
    proximosCountResult,
    pendientesResult,
    cecistasResult,
    proximosEventosResult,
  ] = await Promise.all([
    // 1. Count personas
    ctx.is_admin
      ? supabase
          .from('personas')
          .select('id', { count: 'exact', head: true })
          .is('fecha_baja', null)
      : primaryOrgId
        ? supabase
            .from('persona_organizacion')
            .select('persona_id', { count: 'exact', head: true })
            .eq('organizacion_id', primaryOrgId)
            .is('fecha_fin', null)
        : Promise.resolve({ count: 0, error: null }),

    // 2. Count organizaciones
    ctx.is_admin
      ? supabase
          .from('organizaciones')
          .select('id', { count: 'exact', head: true })
          .is('fecha_baja', null)
      : Promise.resolve({ count: ctx.org_ids.length, error: null }),

    // 3. Count eventos activos (aprobado + publicado)
    (() => {
      let q = supabase
        .from('eventos')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['aprobado', 'publicado'])
      if (!ctx.is_admin && primaryOrgId) q = q.eq('organizacion_id', primaryOrgId)
      return q
    })(),

    // 4. Count próximos eventos (30 días)
    (() => {
      let q = supabase
        .from('eventos')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['aprobado', 'publicado'])
        .gte('fecha_inicio', today)
        .lte('fecha_inicio', in30)
      if (!ctx.is_admin && primaryOrgId) q = q.eq('organizacion_id', primaryOrgId)
      return q
    })(),

    // 5. Pendientes de aprobación (solo si puede aprobar)
    canApprove
      ? (() => {
          const pendingStates: string[] = []
          if (canPerform(ctx, 'event.approve_confra')) {
            pendingStates.push('solicitado')
          }
          if (canPerform(ctx, 'event.approve_eqt')) {
            pendingStates.push('solicitado')
          }
          const uniqueStates = [...new Set(pendingStates)]
          let q = supabase
            .from('eventos')
            .select('id, nombre, estado, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)')
            .in('estado', uniqueStates)
            .order('created_at', { ascending: true })
            .limit(5)
          if (!ctx.is_admin && primaryOrgId) q = q.eq('organizacion_id', primaryOrgId)
          return q
        })()
      : Promise.resolve({ data: null, error: null }),

    // 6. Cecistas de mi org (solo si hay org primaria)
    primaryOrgId
      ? supabase
          .from('persona_organizacion')
          .select(`
            persona_id,
            personas!persona_id(
              id,
              nombre,
              apellido,
              persona_modos(modo, fecha_fin)
            )
          `)
          .eq('organizacion_id', primaryOrgId)
          .is('fecha_fin', null)
          .limit(8)
      : Promise.resolve({ data: null, error: null }),

    // 7. Próximos eventos lista (reemplaza mock)
    (() => {
      let q = supabase
        .from('eventos')
        .select('id, nombre, tipo, estado, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)')
        .in('estado', ['aprobado', 'publicado'])
        .gte('fecha_inicio', today)
        .order('fecha_inicio', { ascending: true })
        .limit(5)
      if (!ctx.is_admin && primaryOrgId) q = q.eq('organizacion_id', primaryOrgId)
      return q
    })(),
  ])

  const totalPersonas = personasCountResult.count ?? 0
  const totalOrganizaciones = organizacionesCountResult.count ?? 0
  const totalEventos = eventosCountResult.count ?? 0
  const proximosCount = proximosCountResult.count ?? 0
  const pendientes = (pendientesResult as any).data as any[] | null
  const cecistas = (cecistasResult as any).data as any[] | null
  const proximosEventos = (proximosEventosResult as any).data as any[] | null

  const primaryRole = ctx.roles[0]?.rol ?? null
  const roleName = primaryRole ? (ROLE_LABELS[primaryRole] ?? primaryRole) : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Panel de Inicio</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Plataforma de gestión para Convivencia con Dios
          </p>
        </div>
        {roleName && (
          <Badge variant="secondary" className="text-sm mt-1">
            {roleName}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              {primaryOrgId ? 'Cecistas en mi org' : 'Personas'}
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalPersonas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {primaryOrgId ? 'En tu organización' : 'Registradas en el sistema'}
            </p>
          </CardContent>
        </Card>

        {canPerform(ctx, 'view.all') && (
          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Organizaciones
              </CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalOrganizaciones}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {ctx.is_admin ? 'En la plataforma' : 'Asignadas a tu perfil'}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalEventos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aprobados o publicados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Próximos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{proximosCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En los próximos 30 días
            </p>
          </CardContent>
        </Card>

        {canApprove && (
          <Card className="bg-card hover:border-amber-500/50 transition-colors border-amber-200 dark:border-amber-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Pendientes
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {pendientes?.length ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Eventos por aprobar
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pendientes de aprobación */}
      {canApprove && pendientes && pendientes.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Solicitudes pendientes de aprobación
            </CardTitle>
            <CardDescription>
              Eventos que requieren tu revisión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendientes.map((evento: any) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{evento.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {evento.organizacion?.nombre ?? '—'}
                      {evento.fecha_inicio ? ` · ${new Date(evento.fecha_inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${ESTADO_EVENT_COLORS[evento.estado] ?? ''}`}>
                      {evento.estado}
                    </span>
                    <Link href={`/eventos/${evento.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/eventos?estado=solicitado" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todas las solicitudes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Cecistas de mi organización */}
      {primaryOrgId && cecistas && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Cecistas de mi organización
            </CardTitle>
            <CardDescription>
              Personas activas en tu organización · {totalPersonas} en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cecistas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay personas registradas en tu organización
              </p>
            ) : (
              <div className="space-y-2">
                {cecistas.map((row: any) => {
                  const persona = row.personas
                  if (!persona) return null
                  const currentModo = Array.isArray(persona.persona_modos)
                    ? persona.persona_modos.find((m: any) => m.fecha_fin === null)
                    : null
                  return (
                    <Link
                      key={persona.id}
                      href={`/personas/${persona.id}`}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:border-primary/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {persona.apellido}, {persona.nombre}
                      </p>
                      {currentModo && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {MODO_LABELS[currentModo.modo] ?? currentModo.modo}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
            <Link href={`/personas?organizacion_id=${primaryOrgId}`} className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Acciones rápidas */}
      {(canCreatePerson || canCreateOrg || canCreateEvent) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {canCreatePerson && (
                <Link href="/personas/nueva">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Users className="h-4 w-4 text-blue-500" />
                    Nueva Persona
                  </Button>
                </Link>
              )}
              {canCreateOrg && (
                <Link href="/organizaciones/nueva">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Building2 className="h-4 w-4 text-green-500" />
                    Nueva Organización
                  </Button>
                </Link>
              )}
              {canCreateEvent && (
                <Link href="/eventos/nuevo">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    Solicitar Evento
                  </Button>
                </Link>
              )}
              <Link href="/pagos/nuevo">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  Registrar Pago
                </Button>
              </Link>
              <Link href="/documentos/nuevo">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <FileText className="h-4 w-4 text-red-500" />
                  Agregar Documento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos Eventos */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Próximos Eventos
          </CardTitle>
          <CardDescription>
            Eventos programados en los próximos días
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!proximosEventos || proximosEventos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay eventos próximos programados
            </p>
          ) : (
            <div className="space-y-3">
              {proximosEventos.map((evento: any) => (
                <Link
                  key={evento.id}
                  href={`/eventos/${evento.id}`}
                  className="flex items-start justify-between rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{evento.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {evento.fecha_inicio
                        ? new Date(evento.fecha_inicio).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Fecha por definir'}
                      {evento.organizacion?.nombre ? ` · ${evento.organizacion.nombre}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS[evento.estado] ?? ''}`}>
                    {evento.estado}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/eventos" className="block mt-4">
            <Button variant="outline" className="w-full bg-transparent">
              Ver todos los eventos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Estado del sistema */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Información del Sistema</CardTitle>
          <CardDescription>Estado actual de la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sistema Operativo</p>
                <p className="text-xs text-muted-foreground">
                  La plataforma está lista para usar
                </p>
              </div>
            </div>
            <div className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded">
              Activo
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
