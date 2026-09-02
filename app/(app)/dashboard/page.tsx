export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { formatDateShort, formatDateLong } from "@/lib/utils"
import { getUserContext, canPerform } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Users,
  User,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  ArrowRight,
  Globe,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  admin_general: "Administrador General",
  tecnico_confraternidad: "Técnico de Confraternidad",
  responsable_fraternidad: "Responsable de Fraternidad",
  usuario_carga: "Usuario de Carga",
  solo_lectura: "Solo Lectura",
}

const ESTADO_EVENT_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  solicitud:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  discernimiento_confra:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  discernimiento_eqt:
    "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  pendiente_datos_noticias:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  pendiente_aprobacion_final:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  aprobado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  publicado:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  en_curso:
    "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  finalizado: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  rechazado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  suspendido: "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

const ESTADO_LABELS: Record<string, string> = {
  borrador: "Borrador",
  solicitud: "Pend. Disc. Confra",
  discernimiento_confra: "Pend. Disc. EqT",
  discernimiento_eqt: "Disc. EqT",
  pendiente_datos_noticias: "Pend. Datos Noticias",
  pendiente_aprobacion_final: "Pend. Aprobación Final",
  aprobado: "Aprobado",
  publicado: "Publicado",
  en_curso: "En Curso",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
  suspendido: "Suspendido",
}

const MODO_LABELS: Record<string, string> = {
  colaborador: "Colaborador",
  servidor: "Servidor",
  asesor: "Asesor",
  familiar: "Familiar",
  orante: "Orante",
  intercesor: "Intercesor",
}

export default async function DashboardPage() {
  const ctx = await getUserContext()
  if (!ctx) redirect("/auth/login")

  const supabase = await createClient()

  // Determinar la org primaria del usuario: primero buscar su membresía activa
  // en persona_organizacion (donde está inscripto como cecista). Si no tiene
  // persona_id, caer a la primera org de sus roles/ministerios.
  let primaryOrgId: string | null = ctx.org_ids[0] ?? null
  let personaNombre: string | null = null
  let isCecista = false
  if (ctx.persona_id) {
    const [poResult, personaResult] = await Promise.all([
      supabase
        .from("persona_organizacion")
        .select("organizacion_id")
        .eq("persona_id", ctx.persona_id)
        .is("fecha_fin", null)
        .limit(1)
        .single(),
      supabase
        .from("personas")
        .select("nombre, apellido, tipo_persona")
        .eq("id", ctx.persona_id)
        .single(),
    ])
    if (poResult.data?.organizacion_id) primaryOrgId = poResult.data.organizacion_id
    if (personaResult.data) {
      const { nombre, apellido } = personaResult.data
      personaNombre = [nombre, apellido].filter(Boolean).join(" ") || null
      isCecista = personaResult.data.tipo_persona === "cecista"
    }
  }

  const canApprove =
    canPerform(ctx, "event.approve_confra") ||
    canPerform(ctx, "event.approve_eqt")
  const canApproveConfra = canPerform(ctx, "event.approve_confra")
  const canApproveEqt = canPerform(ctx, "event.approve_eqt")
  const canSuspend = canPerform(ctx, "event.suspend")
  const canCreatePerson = canPerform(ctx, "person.create")
  const canCreateOrg = canPerform(ctx, "organization.create")
  const canCreateEvent = canPerform(ctx, "event.create")
  const canManageParticipants = canPerform(ctx, "event.manage_participants")
  const canVerifyPayments = canPerform(ctx, "payment.verify")
  const canViewPublishedEvents = canPerform(ctx, "view.eventos_publicados")
  const hasPersonaId = ctx.persona_id !== null

  // ── Queries paralelas ────────────────────────────────────────────────────────

  const today = new Date().toISOString().split("T")[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]

  const [
    personasCountResult,
    confraternidadesCountResult,
    fraternidadesCountResult,
    eventosCountResult,
    proximosCountResult,
    publishedEventsResult,
    misEventosResult,
    discernimientoContraResult,
    discernimientoEqtResult,
    misRechazadosResult,
    pendienteDatosNoticiasResult,
    pendienteAprobacionFinalResult,
  ] = await Promise.all([
    // 1. Count personas (non-admin count se calcula en el bloque cecistas más abajo)
    ctx.is_admin
      ? supabase
          .from("personas")
          .select("id", { count: "exact", head: true })
          .is("fecha_baja", null)
      : Promise.resolve({ count: 0, error: null }),

    // 2a. Count confraternidades
    ctx.is_admin
      ? supabase
          .from("organizaciones")
          .select("id", { count: "exact", head: true })
          .eq("tipo", "confraternidad")
          .is("fecha_baja", null)
      : Promise.resolve({ count: ctx.org_ids.length, error: null }),

    // 2b. Count fraternidades
    ctx.is_admin
      ? supabase
          .from("organizaciones")
          .select("id", { count: "exact", head: true })
          .eq("tipo", "fraternidad")
          .is("fecha_baja", null)
      : Promise.resolve({ count: 0, error: null }),

    // 3. Count eventos activos (aprobado + publicado)
    (() => {
      let q = supabase
        .from("eventos")
        .select("id", { count: "exact", head: true })
        .in("estado", ["aprobado", "publicado"])
      if (!ctx.is_admin && primaryOrgId)
        q = q.eq("organizacion_id", primaryOrgId)
      return q
    })(),

    // 4. Count próximos eventos (30 días)
    (() => {
      let q = supabase
        .from("eventos")
        .select("id", { count: "exact", head: true })
        .in("estado", ["aprobado", "publicado"])
        .gte("fecha_inicio", today)
        .lte("fecha_inicio", in30)
      if (!ctx.is_admin && primaryOrgId)
        q = q.eq("organizacion_id", primaryOrgId)
      return q
    })(),

    // 5. Eventos publicados. El mismo permiso protege la página
    // /eventos/publicados y determina si este resumen existe en el dashboard.
    canViewPublishedEvents
      ? supabase
          .from("eventos")
          .select(
            "id, nombre, tipo, estado, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)",
          )
          .eq("estado", "publicado")
          .order("fecha_inicio", { ascending: true })
          .limit(3)
      : Promise.resolve({ data: null, error: null }),

    // 8. Mis eventos solicitados (eventos en tránsito que yo solicité)
    canCreateEvent && hasPersonaId
      ? supabase
          .from("eventos")
          .select("id, nombre, estado, tipo, fecha_inicio")
          .eq("solicitado_por", ctx.persona_id!)
          .in("estado", [
            "solicitud",
            "discernimiento_confra",
            "discernimiento_eqt",
            "pendiente_datos_noticias",
            "pendiente_aprobacion_final",
            "aprobado",
            "publicado",
          ])
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null, error: null }),

    // 9. En Discernimiento Confra/Delegado (para quienes pueden aprobar a nivel confra)
    canApproveConfra
      ? (() => {
          let q = supabase
            .from("eventos")
            .select(
              "id, nombre, estado, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)",
            )
            .eq("estado", "discernimiento_confra")
            .order("fecha_solicitud", { ascending: true })
            .limit(5)
          if (!ctx.is_admin && primaryOrgId)
            q = q.eq("organizacion_id", primaryOrgId)
          return q
        })()
      : Promise.resolve({ data: null, error: null }),

    // 10. En Discernimiento EqT (solo admin_general / approve_eqt)
    canApproveEqt
      ? supabase
          .from("eventos")
          .select(
            "id, nombre, estado, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)",
          )
          .eq("estado", "discernimiento_eqt")
          .order("fecha_solicitud", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: null, error: null }),

    // 11. Mis eventos rechazados
    canCreateEvent && hasPersonaId
      ? supabase
          .from("eventos")
          .select("id, nombre, estado, motivo_rechazo, fecha_rechazo")
          .eq("solicitado_por", ctx.persona_id!)
          .eq("estado", "rechazado")
          .order("fecha_rechazo", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null, error: null }),

    // 12. Pendiente Datos Noticias — visible para solicitante, confra approver y EqT
    (() => {
      if (!hasPersonaId && !canApproveConfra && !canApproveEqt) {
        return Promise.resolve({ data: null, error: null })
      }
      const selectSuperior = "id, nombre, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre), solicitado_por_persona:personas!solicitado_por(nombre, apellido)"
      const selectPropio = "id, nombre, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)"
      // EqT ve todos
      if (canApproveEqt) {
        return supabase
          .from("eventos")
          .select(selectSuperior)
          .eq("estado", "pendiente_datos_noticias")
          .order("fecha_aprobacion", { ascending: true })
          .limit(10)
      }
      // Responsable de Confraternidad ve los de su org y todas sus fraternidades hijas
      if (canApproveConfra) {
        let q = supabase
          .from("eventos")
          .select(selectSuperior)
          .eq("estado", "pendiente_datos_noticias")
          .order("fecha_aprobacion", { ascending: true })
          .limit(10)
        if (!ctx.is_admin) {
          if (ctx.org_ids.length > 0) q = q.in("organizacion_id", ctx.org_ids)
          else return Promise.resolve({ data: [], error: null })
        }
        return q
      }
      // Solicitante: solo los propios
      return supabase
        .from("eventos")
        .select(selectPropio)
        .eq("estado", "pendiente_datos_noticias")
        .eq("solicitado_por", ctx.persona_id!)
        .order("fecha_aprobacion", { ascending: true })
        .limit(10)
    })(),

    // 13. Pendiente Aprobación Final (solo EqT)
    canApproveEqt
      ? supabase
          .from("eventos")
          .select(
            "id, nombre, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre), solicitado_por_persona:personas!solicitado_por(nombre, apellido)"
          )
          .eq("estado", "pendiente_aprobacion_final")
          .order("updated_at", { ascending: true })
          .limit(10)
      : Promise.resolve({ data: null, error: null }),
  ])

  let totalPersonas = personasCountResult.count ?? 0
  const totalConfraternidades = confraternidadesCountResult.count ?? 0
  const totalFraternidades = fraternidadesCountResult.count ?? 0
  const totalEventos = eventosCountResult.count ?? 0
  const proximosCount = proximosCountResult.count ?? 0

  // Pendientes: misma lógica que eventos/page.tsx, con filtrado post-fetch por rol
  let pendientes: any[] | null = null
  if (canApprove) {
    const canApproveConfra = canPerform(ctx, "event.approve_confra")
    const canApproveEqt = canPerform(ctx, "event.approve_eqt")
    const pendingStates: string[] = []
    if (canApproveConfra) {
      pendingStates.push("solicitud")
    }
    if (canApproveEqt) {
      pendingStates.push("discernimiento_confra", "discernimiento_eqt")
      if (!pendingStates.includes("solicitud")) pendingStates.push("solicitud")
    }
    const { data: pendingData } = await supabase
      .from("eventos")
      .select(
        "id, nombre, tipo, estado, fecha_inicio, requiere_discernimiento_confra, requiere_discernimiento_eqt, organizacion:organizaciones!organizacion_id(id, nombre)",
      )
      .in("estado", pendingStates)
      .order("fecha_solicitud", { ascending: true })
      .limit(10)
    pendientes = (pendingData ?? []).filter((ev: any) => {
      const confraId = ev.organizacion?.id as string | null
      const requiereConfra = ev.requiere_discernimiento_confra ?? false
      const requiereEqt = ev.requiere_discernimiento_eqt ?? false
      // discernimiento_confra = confra done, EqT needs to act
      if (ev.estado === "discernimiento_confra" && canApproveEqt) return true
      // discernimiento_eqt = legacy state, also EqT's turn
      if (ev.estado === "discernimiento_eqt" && canApproveEqt) return true
      if (ev.estado === "solicitud") {
        // EqT acts directly when no confra step required
        if (!requiereConfra && requiereEqt && canApproveEqt) return true
        // Confra acts on solicitud
        if (requiereConfra && canApproveConfra) {
          if (ctx.is_admin) return true
          return confraId ? ctx.org_ids.includes(confraId) : false
        }
      }
      return false
    })
  }

  // Cecistas: two-step fetch — same pattern as /personas page
  // Also derives totalPersonas for non-admin (consistent with fecha_baja filter)
  let cecistas: any[] | null = null
  if (primaryOrgId) {
    const { data: orgRows } = await supabase
      .from("persona_organizacion")
      .select("persona_id")
      .eq("organizacion_id", primaryOrgId)
      .is("fecha_fin", null)
    const ids = (orgRows ?? []).map((r: any) => r.persona_id)
    if (ids.length > 0) {
      const { data, count } = await supabase
        .from("personas")
        .select("id, nombre, apellido, persona_modos(modo, fecha_fin)", {
          count: "exact",
        })
        .in("id", ids)
        .is("fecha_baja", null)
        .limit(8)
      cecistas = data
      totalPersonas = count ?? 0
    } else {
      cecistas = []
      totalPersonas = 0
    }
  }

  // Solicitudes de suspensión — solo para Timonel
  let solicitudesSuspension: any[] | null = null
  if (canSuspend) {
    const { data: suspData } = await supabase
      .from("eventos")
      .select(
        "id, nombre, tipo, fecha_inicio, solicitud_suspension_notas, solicitud_suspension_fecha, organizacion:organizaciones!organizacion_id(nombre), solicitud_suspension_por_persona:personas!solicitud_suspension_por(nombre, apellido)"
      )
      .not("solicitud_suspension_fecha", "is", null)
      .not("estado", "in", "(suspendido,cancelado,finalizado,rechazado)")
      .order("solicitud_suspension_fecha", { ascending: true })
      .limit(10)
    solicitudesSuspension = suspData ?? []
  }

  // Nuevos Interesados — visible para quienes gestionan participantes
  let nuevosInteresados: any[] | null = null
  if (canManageParticipants) {
    let q = supabase
      .from("evento_participantes")
      .select(
        "id, fecha_inscripcion, persona:personas!inner(id, nombre, apellido, email, telefono, tipo_persona), evento:eventos!inner(id, nombre, fecha_inicio, organizacion_id)"
      )
      .eq("rol_en_evento", "convivente")
      .eq("estado_participacion", "interesado")
      .order("fecha_inscripcion", { ascending: false })
      .limit(10)
    if (!ctx.is_admin && primaryOrgId) {
      q = q.eq("eventos.organizacion_id", primaryOrgId)
    }
    const { data: interesadosData } = await q
    nuevosInteresados = interesadosData ?? []
  }

  // Eventos donde soy Centralizador + interesados de eventos activos — autoscopeado por persona_id
  let misEventosCentralizador: any[] | null = null
  let interesadosCentralizador: any[] | null = null
  if (hasPersonaId) {
    const { data: centralizadorEventos } = await supabase
      .from("eventos")
      .select(
        "id, nombre, estado, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)",
      )
      .or(
        `centralizador_1_persona_id.eq.${ctx.persona_id},centralizador_2_persona_id.eq.${ctx.persona_id},centralizador_3_persona_id.eq.${ctx.persona_id}`,
      )
      .order("fecha_inicio", { ascending: false })
    misEventosCentralizador = centralizadorEventos ?? []

    const activosIds = misEventosCentralizador
      .filter((ev: any) => ["aprobado", "publicado", "en_curso"].includes(ev.estado))
      .map((ev: any) => ev.id)

    if (activosIds.length > 0) {
      const { data: interesadosData } = await supabase
        .from("evento_participantes")
        .select(
          "id, persona:personas!persona_id(id, nombre, apellido, telefono, localidad, provincia), evento:eventos!evento_id(id, nombre)",
        )
        .in("evento_id", activosIds)
        .eq("estado_participacion", "interesado")
        .order("fecha_inscripcion", { ascending: false })
        .limit(10)
      interesadosCentralizador = interesadosData ?? []
    } else {
      interesadosCentralizador = []
    }
  }

  // Pagos por transferencia pendientes de verificación — scopeados a la org del usuario
  let pagosPendientes: any[] | null = null
  let pagosPendientesCount = 0
  if (canVerifyPayments) {
    const { data: pagosData } = await supabase
      .from("pagos")
      .select(
        "id, monto, fecha_pago, participante:evento_participantes!evento_participante_id(persona:personas!persona_id(nombre, apellido), evento:eventos!evento_id(nombre, organizacion_id, fraternidad_id))"
      )
      .eq("medio_pago", "transferencia")
      .eq("estado_pago", "pendiente")
      .not("comprobante_url", "is", null)
      .order("fecha_pago", { ascending: true })
      .limit(100)
    const visibles = (pagosData ?? []).filter((p: any) => {
      if (ctx.is_admin) return true
      const ev = p.participante?.evento
      return (
        (ev?.organizacion_id && ctx.org_ids.includes(ev.organizacion_id)) ||
        (ev?.fraternidad_id && ctx.org_ids.includes(ev.fraternidad_id))
      )
    })
    pagosPendientesCount = visibles.length
    pagosPendientes = visibles.slice(0, 5)
  }

  const publishedEvents = (publishedEventsResult as any).data as any[] | null
  const misEventos = (misEventosResult as any).data as any[] | null
  const discernimientoConfra = (discernimientoContraResult as any).data as
    | any[]
    | null
  const discernimientoEqt = (discernimientoEqtResult as any).data as
    | any[]
    | null
  const misRechazados = (misRechazadosResult as any).data as any[] | null
  const pendienteDatosNoticias = (pendienteDatosNoticiasResult as any).data as any[] | null
  const pendienteAprobacionFinal = (pendienteAprobacionFinalResult as any).data as any[] | null

  const rolesByName = new Map<string, { name: string; accessLevel: number }>()
  const addRole = (name: string, accessLevel: number) => {
    const displayName = ROLE_LABELS[name] ?? name
    const key = displayName.trim().toLocaleLowerCase("es")
    const current = rolesByName.get(key)
    if (!current || accessLevel > current.accessLevel) {
      rolesByName.set(key, { name: displayName, accessLevel })
    }
  }

  if (ctx.ministerios.length > 0) {
    for (const ministerio of ctx.ministerios) {
      addRole(ministerio.nombre, ministerio.nivel_acceso)
    }
  } else {
    // Compatibilidad para cuentas que todavía no fueron migradas al modelo
    // unificado de asignaciones_ministerio.
    for (const role of ctx.roles) {
      addRole(role.rol, role.nivel_acceso)
    }
  }

  const displayRoles = [...rolesByName.values()].sort(
    (a, b) =>
      b.accessLevel - a.accessLevel ||
      Number(a.name === "Cecista") - Number(b.name === "Cecista") ||
      a.name.localeCompare(b.name, "es"),
  )
  const primaryRole = displayRoles[0] ?? null
  const otherRoles = displayRoles.slice(1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            {personaNombre ? `Hola, ${personaNombre}` : "Panel de Inicio"}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Plataforma de gestión para Convivencia con Dios
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 mt-1">
          {primaryRole && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-sm">
                {primaryRole.name}
              </Badge>
              {otherRoles.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`${otherRoles.length} ${otherRoles.length === 1 ? "rol adicional" : "roles adicionales"}: ${otherRoles.map((role) => role.name).join(", ")}`}
                    >
                      <Badge
                        variant="outline"
                        className="cursor-help text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      >
                        +{otherRoles.length}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end" className="max-w-72 py-2.5">
                    <p className="mb-1.5 font-semibold">
                      {otherRoles.length === 1 ? "Otro rol" : "Otros roles"}
                    </p>
                    <ul className="space-y-1">
                      {otherRoles.map((role) => (
                        <li key={role.name}>{role.name}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
          {hasPersonaId && (
            <Link href="/settings?tab=perfil">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent text-xs">
                <User className="h-3.5 w-3.5" />
                Editar mi Perfil
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* CTA Cecista: actualizar datos personales */}
      {isCecista && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <User className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Mantené tus datos al día</p>
                <p className="text-sm text-muted-foreground">
                  Actualizá tu información personal, casa comunitaria, dedicación y votos. Se guarda automáticamente.
                </p>
              </div>
            </div>
            <Link href="/settings?tab=perfil" className="shrink-0">
              <Button className="gap-2">
                <User className="h-4 w-4" />
                Actualizar mis datos personales
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/personas"
          aria-label="Ver lista de personas"
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Card className="h-full cursor-pointer border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                {primaryOrgId ? "Cecistas" : "Personas"}
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalPersonas}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {primaryOrgId
                  ? "En tu Confraternidad / Fraternidad"
                  : "Registradas en el sistema"}
              </p>
            </CardContent>
          </Card>
        </Link>

        {canPerform(ctx, "view.all") && (
          <Link
            href="/organizaciones"
            aria-label="Ver lista de confraternidades y fraternidades"
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Card className="h-full cursor-pointer border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Confraternidades & Fraternidades
                </CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalConfraternidades + totalFraternidades}
                </div>
                {ctx.is_admin ? (
                  <div className="flex gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {totalConfraternidades}
                      </span>{" "}
                      confra
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {totalFraternidades}
                      </span>{" "}
                      frat
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Asignadas a tu perfil
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        )}

        <Link
          href="/eventos"
          aria-label="Ver lista de eventos"
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Card className="h-full cursor-pointer border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Eventos
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalEventos}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aprobados o publicados
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link
          href={`/eventos?fecha_desde=${today}&fecha_hasta=${in30}`}
          aria-label="Ver eventos de los próximos 30 días"
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Card className="h-full cursor-pointer border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Próximos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {proximosCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En los próximos 30 días
              </p>
            </CardContent>
          </Card>
        </Link>

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

        {canVerifyPayments && (
          <Card className="bg-card hover:border-emerald-500/50 transition-colors border-emerald-200 dark:border-emerald-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Pagos pendientes
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {pagosPendientesCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Comprobantes por verificar
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Eventos donde soy Centralizador */}
      {misEventosCentralizador && misEventosCentralizador.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Eventos donde soy Centralizador
            </CardTitle>
            <CardDescription>
              Soy Centralizador en {misEventosCentralizador.length}{" "}
              {misEventosCentralizador.length === 1 ? "evento" : "eventos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {misEventosCentralizador.slice(0, 5).map((evento: any) => (
                <Link
                  key={evento.id}
                  href={`/eventos/${evento.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {evento.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evento.organizacion?.nombre ?? "—"}
                      {evento.fecha_inicio
                        ? ` · ${formatDateShort(evento.fecha_inicio)}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS[evento.estado] ?? ""}`}
                  >
                    {ESTADO_LABELS[evento.estado] ?? evento.estado}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/eventos/centralizador" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver mis eventos y filtrar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Interesados de eventos activos donde soy Centralizador */}
      {misEventosCentralizador && misEventosCentralizador.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-amber-500" />
              Interesados de eventos activos
            </CardTitle>
            <CardDescription>
              Personas interesadas en tus eventos aprobados, publicados o en curso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!interesadosCentralizador || interesadosCentralizador.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay personas interesadas en tus eventos activos por el momento
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Nombre</th>
                      <th className="px-3 py-2 font-medium">Apellido</th>
                      <th className="px-3 py-2 font-medium">Teléfono</th>
                      <th className="px-3 py-2 font-medium">Ciudad</th>
                      <th className="px-3 py-2 font-medium">Provincia</th>
                      <th className="px-3 py-2 font-medium">Evento de Interés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interesadosCentralizador.map((ep: any) => {
                      const persona = ep.persona
                      return (
                        <tr
                          key={ep.id}
                          className="border-b border-border/60 hover:bg-muted/40"
                        >
                          <td className="px-3 py-2 font-medium text-foreground">
                            {persona?.nombre ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-foreground">
                            {persona?.apellido ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {persona?.telefono ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {persona?.localidad ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {persona?.provincia ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {ep.evento?.nombre ?? "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Link href="/eventos/centralizador" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todas las personas de mis eventos
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

      {/* Pendientes de aprobación */}
      {canApprove && pendientes && pendientes.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Solicitudes pendientes de aprobación
            </CardTitle>
            <CardDescription>Eventos que requieren tu revisión</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendientes.map((evento: any) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {evento.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evento.organizacion?.nombre ?? "—"}
                      {evento.fecha_inicio
                        ? ` · ${formatDateShort(evento.fecha_inicio)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${ESTADO_EVENT_COLORS[evento.estado] ?? ""}`}
                    >
                      {ESTADO_LABELS[evento.estado] ?? evento.estado}
                    </span>
                    <Link href={`/eventos/${evento.id}`}>
                      <Button size="sm" className="h-7 text-xs">
                        Discernir
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/eventos?estado=solicitud" className="block mt-4">
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
              Cecistas en mi Confraternidad / Fraternidad.
            </CardTitle>
            <CardDescription>
              Personas activas en tu Confraternidad / Fraternidad ·{" "}
              {totalPersonas} en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cecistas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay personas registradas en tu Confraternidad / Fraternidad
              </p>
            ) : (
              <div className="space-y-2">
                {cecistas.map((persona: any) => {
                  const currentModo = Array.isArray(persona.persona_modos)
                    ? persona.persona_modos.find(
                        (m: any) => m.fecha_fin === null,
                      )
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
            <Link
              href={`/personas?organizacion_id=${primaryOrgId}`}
              className="block mt-4"
            >
              <Button variant="outline" className="w-full bg-transparent">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Mis eventos solicitados */}
      {canCreateEvent &&
        hasPersonaId &&
        misEventos &&
        misEventos.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Mis eventos solicitados
              </CardTitle>
              <CardDescription>
                Eventos que solicitaste y están en proceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {misEventos.map((evento: any) => (
                  <Link
                    key={evento.id}
                    href={`/eventos/${evento.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      {evento.fecha_inicio && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateShort(evento.fecha_inicio)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS[evento.estado] ?? ""}`}
                    >
                      {ESTADO_LABELS[evento.estado] ?? evento.estado}
                    </span>
                  </Link>
                ))}
              </div>
              <Link href="/eventos" className="block mt-4">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver todos mis eventos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      {/* En Discernimiento Confra/Delegado */}
      {canApproveConfra &&
        discernimientoConfra &&
        discernimientoConfra.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                En Discernimiento Confra / Delegado
              </CardTitle>
              <CardDescription>
                Eventos esperando aprobación a nivel confraternidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {discernimientoConfra.map((evento: any) => (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.organizacion?.nombre ?? "—"}
                        {evento.fecha_inicio
                          ? ` · ${formatDateShort(evento.fecha_inicio)}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/eventos/${evento.id}`}
                      className="ml-3 shrink-0"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              <Link
                href="/eventos?estado=discernimiento_confra"
                className="block mt-4"
              >
                <Button variant="outline" className="w-full bg-transparent">
                  Ver todos en discernimiento confra
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      {/* En Discernimiento EqT */}
      {canApproveEqt && discernimientoEqt && discernimientoEqt.length > 0 && (
        <Card className="border-sky-200 dark:border-sky-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-sky-500" />
              En Discernimiento Equipo Timón
            </CardTitle>
            <CardDescription>
              Eventos esperando aprobación del Equipo Timón
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discernimientoEqt.map((evento: any) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {evento.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evento.organizacion?.nombre ?? "—"}
                      {evento.fecha_inicio
                        ? ` · ${formatDateShort(evento.fecha_inicio)}`
                        : ""}
                    </p>
                  </div>
                  <Link
                    href={`/eventos/${evento.id}`}
                    className="ml-3 shrink-0"
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <Link
              href="/eventos?estado=discernimiento_eqt"
              className="block mt-4"
            >
              <Button variant="outline" className="w-full bg-transparent">
                Ver todos en discernimiento EqT
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Aprobación Final EqT */}
      {canApproveEqt && pendienteAprobacionFinal && pendienteAprobacionFinal.length > 0 && (
        <Card className="border-violet-200 dark:border-violet-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-violet-500" />
              Aprobación Final — Equipo Timón
            </CardTitle>
            <CardDescription>
              Eventos con datos completos esperando aprobación final para su publicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendienteAprobacionFinal.map((evento: any) => {
                const solicitante = evento.solicitado_por_persona
                return (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.organizacion?.nombre ?? "—"}
                        {evento.fecha_inicio
                          ? ` · ${formatDateShort(evento.fecha_inicio)}`
                          : ""}
                        {solicitante
                          ? ` · ${solicitante.nombre} ${solicitante.apellido}`
                          : ""}
                      </p>
                    </div>
                    <Link href={`/eventos/${evento.id}`} className="ml-3 shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        Revisar y publicar
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
            <Link
              href="/eventos?estado=pendiente_aprobacion_final"
              className="block mt-4"
            >
              <Button variant="outline" className="w-full bg-transparent">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pendiente Datos Noticias */}
      {pendienteDatosNoticias && pendienteDatosNoticias.length > 0 && (
        <Card className="border-indigo-200 dark:border-indigo-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-indigo-500" />
              Pendiente de Datos para Noticias
            </CardTitle>
            <CardDescription>
              Eventos aprobados que esperan carga de centralizadores y datos de publicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendienteDatosNoticias.map((evento: any) => {
                const solicitante = evento.solicitado_por_persona
                return (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.organizacion?.nombre ?? "—"}
                        {evento.fecha_inicio
                          ? ` · ${formatDateShort(evento.fecha_inicio)}`
                          : ""}
                        {solicitante
                          ? ` · Solicitado por ${solicitante.nombre} ${solicitante.apellido}`
                          : ""}
                      </p>
                    </div>
                    <Link href={`/eventos/${evento.id}`} className="ml-3 shrink-0">
                      <Button size="sm" className="h-7 text-xs">
                        Cargar datos
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
            <Link href="/eventos?estado=pendiente_datos_noticias" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Solicitudes de Suspensión — solo Timonel */}
      {canSuspend && solicitudesSuspension && solicitudesSuspension.length > 0 && (
        <Card className="border-orange-300 dark:border-orange-700 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Solicitudes de Suspensión
            </CardTitle>
            <CardDescription>
              Eventos con solicitud de suspensión pendiente de revisión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {solicitudesSuspension.map((evento: any) => {
                const solicitante = evento.solicitud_suspension_por_persona
                return (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.organizacion?.nombre ?? "—"}
                        {evento.solicitud_suspension_fecha
                          ? ` · Solicitado el ${formatDateShort(evento.solicitud_suspension_fecha)}`
                          : ""}
                        {solicitante
                          ? ` por ${solicitante.nombre} ${solicitante.apellido}`
                          : ""}
                      </p>
                      {evento.solicitud_suspension_notas && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Motivo: {evento.solicitud_suspension_notas}
                        </p>
                      )}
                    </div>
                    <Link href={`/eventos/${evento.id}`} className="ml-3 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400">
                        Revisar
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
            <Link href="/eventos?solicitud_suspension=1" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pagos por verificar */}
      {canVerifyPayments && pagosPendientes && pagosPendientes.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Pagos por verificar
            </CardTitle>
            <CardDescription>
              Comprobantes de transferencia de tu Confraternidad / Fraternidad esperando aprobación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pagosPendientes.map((pago: any) => {
                const persona = pago.participante?.persona
                const evento = pago.participante?.evento
                return (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {persona ? `${persona.apellido}, ${persona.nombre}` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {evento?.nombre ?? "—"}
                        {pago.fecha_pago ? ` · ${formatDateShort(pago.fecha_pago)}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      ${Number(pago.monto).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
            <Link href="/pagos" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Verificar pagos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Nuevos Interesados */}
      {canManageParticipants && nuevosInteresados && nuevosInteresados.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-amber-500" />
              Nuevos Interesados
            </CardTitle>
            <CardDescription>
              Personas que manifestaron interés en participar en un evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nuevosInteresados.map((ep: any) => {
                const persona = ep.persona
                const evento = ep.evento
                return (
                  <div
                    key={ep.id}
                    className="flex items-start justify-between rounded-lg border border-border p-3 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {persona?.nombre} {persona?.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[persona?.email, persona?.telefono].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Interesado en:{" "}
                        <span className="font-medium text-foreground">
                          {evento?.nombre}
                        </span>
                        {evento?.fecha_inicio
                          ? ` · ${formatDateShort(evento.fecha_inicio)}`
                          : ""}
                      </p>
                    </div>
                    {persona?.id && (
                      <Link href={`/personas/${persona.id}`} className="shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs bg-transparent border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                        >
                          Ver
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
            <Link href="/admin/inscripciones" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todos los interesados
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Mis eventos rechazados */}
      {canCreateEvent &&
        hasPersonaId &&
        misRechazados &&
        misRechazados.length > 0 && (
          <Card className="border-red-200 dark:border-red-900 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Mis eventos rechazados
              </CardTitle>
              <CardDescription>
                Eventos que fueron rechazados y requieren tu atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {misRechazados.map((evento: any) => (
                  <Link
                    key={evento.id}
                    href={`/eventos/${evento.id}`}
                    className="flex items-start justify-between rounded-lg border border-border p-3 hover:border-red-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      {evento.motivo_rechazo && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          Motivo: {evento.motivo_rechazo}
                        </p>
                      )}
                      {evento.fecha_rechazo && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateShort(evento.fecha_rechazo)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS.rechazado}`}
                    >
                      Rechazado
                    </span>
                  </Link>
                ))}
              </div>
              <Link href="/eventos?estado=rechazado" className="block mt-4">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver todos los rechazados
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      {/* Eventos publicados */}
      {canViewPublishedEvents && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              Eventos publicados
            </CardTitle>
            <CardDescription>
              Disponibles para toda la comunidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!publishedEvents || publishedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay eventos publicados actualmente
              </p>
            ) : (
              <div className="space-y-3">
                {publishedEvents.map((evento: any) => (
                  <Link
                    key={evento.id}
                    href={`/eventos/${evento.id}`}
                    className="flex items-start justify-between rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.fecha_inicio
                          ? formatDateLong(evento.fecha_inicio)
                          : "Fecha por definir"}
                        {evento.organizacion?.nombre
                          ? ` · ${evento.organizacion.nombre}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS[evento.estado] ?? ""}`}
                    >
                      {ESTADO_LABELS[evento.estado] ?? evento.estado}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/eventos/publicados" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todos los eventos publicados
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Estado del sistema */}
      {/* <Card className="border-border bg-card">
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
      </Card> */}
    </div>
  )
}
