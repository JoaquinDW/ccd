export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Edit2,
  Calendar,
  Users,
  ArrowLeft,
  Plus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const tipoLabel: Record<string, string> = {
  comunidad: "Comunidad",
  confraternidad: "Confraternidad",
  fraternidad: "Fraternidad",
  casa_retiro: "Casa de Retiro",
  eqt: "EQT",
  otra: "Otra",
}

const estadoEventoLabel: Record<string, string> = {
  borrador: "Borrador",
  solicitado: "Solicitado",
  aprobado: "Aprobado",
  publicado: "Publicado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
}

const tipoEventoLabel: Record<string, string> = {
  convivencia: "Convivencia",
  retiro: "Retiro",
  taller: "Taller",
}

export default async function OrganizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const [
    { data: org, error },
    { data: eventos },
    { data: ministerios },
    { data: miembros },
  ] = await Promise.all([
    supabase
      .from("organizaciones")
      .select(
        "id, nombre, tipo, codigo, estado, pais, provincia, localidad, notas, telefono_1, telefono_2, fecha_baja, parent:organizaciones!parent_id(id, nombre, tipo)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("eventos")
      .select("id, nombre, tipo, estado, fecha_inicio, fecha_fin")
      .eq("organizacion_id", id)
      .order("fecha_inicio", { ascending: false }),
    supabase
      .from("asignaciones_ministerio")
      .select(
        "id, fecha_inicio, persona:personas(id, nombre, apellido), ministerio:ministerios(id, nombre, tipo)",
      )
      .eq("organizacion_id", id)
      .is("fecha_fin", null),
    supabase
      .from("persona_organizacion")
      .select(
        "id, tipo_relacion, fecha_inicio, persona:personas!persona_id(id, nombre, apellido, categoria_persona)",
      )
      .eq("organizacion_id", id)
      .is("fecha_fin", null)
      .order("fecha_inicio", { ascending: true }),
  ])

  if (error || !org) notFound()

  const proximosEventos = (eventos ?? []).filter((e) => e.fecha_inicio >= today)
  const pasadosEventos = (eventos ?? []).filter((e) => e.fecha_inicio < today)
  const parent = org.parent as {
    id: string
    nombre: string
    tipo: string
  } | null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/organizaciones"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Organizaciones
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            {org.nombre}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-muted-foreground">
              {tipoLabel[org.tipo] ?? org.tipo}
            </span>
            {org.codigo && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground font-mono text-sm">
                  {org.codigo}
                </span>
              </>
            )}
            <span className="text-muted-foreground">·</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                org.estado === "activa"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {org.estado}
            </span>
          </div>
        </div>
        <Link href={`/organizaciones/${id}/editar`}>
          <Button variant="outline" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos básicos */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {parent && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depende de</span>
                <Link
                  href={`/organizaciones/${parent.id}`}
                  className="text-primary hover:underline"
                >
                  {parent.nombre}{" "}
                  <span className="text-muted-foreground">
                    ({tipoLabel[parent.tipo] ?? parent.tipo})
                  </span>
                </Link>
              </div>
            )}
            {org.localidad && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Localidad</span>
                <span className="text-foreground">{org.localidad}</span>
              </div>
            )}
            {org.provincia && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provincia</span>
                <span className="text-foreground">{org.provincia}</span>
              </div>
            )}
            {org.pais && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">País</span>
                <span className="text-foreground">{org.pais}</span>
              </div>
            )}
            {org.telefono_1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono</span>
                <span className="text-foreground">{org.telefono_1}</span>
              </div>
            )}
            {org.telefono_2 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono 2</span>
                <span className="text-foreground">{org.telefono_2}</span>
              </div>
            )}
            {org.notas && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground mb-1">Notas</p>
                <p className="text-foreground">{org.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ministerios / Miembros activos */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ministerios Activos
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {(ministerios ?? []).length} asignaciones
            </span>
          </CardHeader>
          <CardContent>
            {ministerios && ministerios.length > 0 ? (
              <ul className="space-y-2">
                {(ministerios as any[]).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <Link
                        href={`/personas/${a.persona.id}`}
                        className="text-foreground font-medium hover:text-primary"
                      >
                        {a.persona.apellido}, {a.persona.nombre}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {a.ministerio.nombre}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      desde{" "}
                      {new Date(a.fecha_inicio).toLocaleDateString("es-AR")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay ministerios asignados actualmente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Miembros (persona_organizacion) */}
      {miembros && miembros.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cecistas
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {miembros.length} personas
            </span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Persona
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Categoría
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Desde
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(miembros as any[]).map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border hover:bg-muted/40"
                    >
                      <td className="py-2 px-3">
                        <Link
                          href={`/personas/${m.persona.id}`}
                          className="text-foreground font-medium hover:text-primary"
                        >
                          {m.persona.apellido}, {m.persona.nombre}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground capitalize">
                        {m.persona.categoria_persona ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {m.fecha_inicio
                          ? new Date(m.fecha_inicio).toLocaleDateString("es-AR")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eventos próximos */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximos Eventos
          </CardTitle>
          <Link href={`/eventos/nuevo?organizacion_id=${id}`}>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Evento
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {proximosEventos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Nombre
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Tipo
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Fecha
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proximosEventos.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border hover:bg-muted/40"
                    >
                      <td className="py-2 px-3">
                        <Link
                          href={`/eventos/${e.id}`}
                          className="text-foreground hover:text-primary font-medium"
                        >
                          {e.nombre}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {tipoEventoLabel[e.tipo] ?? e.tipo}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {new Date(e.fecha_inicio).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                          {estadoEventoLabel[e.estado] ?? e.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay eventos próximos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Eventos pasados */}
      {pasadosEventos.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Eventos Pasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Nombre
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Tipo
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Fecha
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pasadosEventos.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border hover:bg-muted/40"
                    >
                      <td className="py-2 px-3">
                        <Link
                          href={`/eventos/${e.id}`}
                          className="text-foreground hover:text-primary font-medium"
                        >
                          {e.nombre}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {tipoEventoLabel[e.tipo] ?? e.tipo}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {new Date(e.fecha_inicio).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                          {estadoEventoLabel[e.estado] ?? e.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
