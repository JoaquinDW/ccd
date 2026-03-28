export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const tipoLabel: Record<string, string> = {
  comunidad: "Comunidad",
  confraternidad: "Confraternidad",
  fraternidad: "Fraternidad",
  casa_retiro: "Casa de Retiro",
  eqt: "EQT",
  otra: "Otra",
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 items-start">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  )
}

export default async function OrganizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: org, error },
    { data: orgsDependientes },
    { data: asignaciones },
  ] = await Promise.all([
    supabase
      .from("organizaciones")
      .select(
        "id, nombre, tipo, codigo, estado, mail_org, sede_fisica, direccion_calle, direccion_nro, ciudad, cp, diocesis, localidad, provincia, pais, notas, telefono_1, telefono_2, parent:organizaciones!parent_id(id, nombre, tipo)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("organizaciones")
      .select("id, nombre, tipo")
      .eq("parent_id", id)
      .is("fecha_baja", null)
      .order("nombre"),
    supabase
      .from("asignaciones_ministerio")
      .select(
        "id, persona_id, estado, fecha_inicio, fecha_fin, persona:personas!persona_id(nombre, apellido), ministerio:ministerios!ministerio_id(nombre), evento:eventos!evento_id(nombre)",
      )
      .eq("organizacion_id", id)
      .eq("estado", "activo")
      .order("fecha_inicio"),
  ])

  if (error || !org) notFound()

  const parent = Array.isArray(org.parent) ? null : (org.parent as { id: string; nombre: string; tipo: string } | null)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/organizaciones"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Organizaciones
        </Link>
        <Link href={`/organizaciones/${id}/editar`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Main data card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Pantalla Organización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre + Código */}
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <Field label="Nombre" value={`${org.nombre}${org.nombre ? " (50 caracteres)" : ""}`} />
            <div className="grid grid-cols-[160px_1fr] gap-2 items-start">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
                Código Interno
              </span>
              <span className="text-sm font-mono text-foreground">{org.codigo || "—"}</span>
            </div>
          </div>

          {/* Tipo */}
          <Field label="Tipo" value={tipoLabel[org.tipo] ?? org.tipo} />

          {/* Org. Padre */}
          <div className="grid grid-cols-[160px_1fr] gap-2 items-start">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
              Org. Padre
            </span>
            {parent ? (
              <Link href={`/organizaciones/${parent.id}`} className="text-sm text-primary hover:underline">
                {parent.nombre}{" "}
                <span className="text-muted-foreground">({tipoLabel[parent.tipo] ?? parent.tipo})</span>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          {/* Estado + Mail */}
          <div className="grid grid-cols-2 gap-6">
            <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
                Estado
              </span>
              <span
                className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  org.estado === "activa"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {org.estado === "activa" ? "Activa" : "Inactiva"}
              </span>
            </div>
            <Field label="Mail Organización" value={org.mail_org} />
          </div>

          {/* Sede Física */}
          <div className="flex items-center gap-2">
            <div
              className={`h-4 w-4 rounded border border-border flex items-center justify-center ${
                org.sede_fisica ? "bg-primary border-primary" : "bg-background"
              }`}
            >
              {org.sede_fisica && (
                <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-foreground">Sede Física</span>
          </div>

          {/* Dirección (si sede_fisica) */}
          {org.sede_fisica && (
            <div className="space-y-3 rounded-md border border-border p-4">
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <Field label="Dirección Calle" value={org.direccion_calle} />
                <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
                    Nro.
                  </span>
                  <span className="text-sm text-foreground">{org.direccion_nro || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ciudad" value={org.ciudad} />
                <Field label="CP" value={org.cp} />
              </div>
              <Field label="Diócesis" value={org.diocesis} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Provincia" value={org.provincia} />
                <Field label="País" value={org.pais} />
              </div>
            </div>
          )}

          {/* Localidad / Provincia / País (si no hay sede) */}
          {!org.sede_fisica && (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Localidad" value={org.localidad} />
              <Field label="Provincia" value={org.provincia} />
              <Field label="País" value={org.pais} />
            </div>
          )}

          {/* Teléfonos */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono" value={org.telefono_1} />
            <Field label="Teléfono 2" value={org.telefono_2} />
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notas</span>
            <p className="text-sm text-foreground min-h-12 rounded-md border border-border bg-muted/30 p-2">
              {org.notas || ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Organizaciones Dependientes */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Confraternidades o Fraternidades Relacionadas (Org. Dependientes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(orgsDependientes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin organizaciones dependientes</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Organización</th>
                </tr>
              </thead>
              <tbody>
                {(orgsDependientes ?? []).map((dep) => (
                  <tr key={dep.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2">
                      <Link href={`/organizaciones/${dep.id}`} className="text-primary hover:underline">
                        {dep.nombre}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Roles y Ministerios */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Roles y Ministerios de la Organización
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(asignaciones ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin asignaciones activas</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Persona</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Evento</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Inicio</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Fin</th>
                </tr>
              </thead>
              <tbody>
                {(asignaciones as any[]).map((asig) => (
                  <tr key={asig.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 px-3 font-medium">
                      {asig.persona ? (
                        <Link href={`/personas/${asig.persona_id}`} className="text-primary hover:underline">
                          {asig.persona.apellido}, {asig.persona.nombre}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="py-2 px-3">{asig.ministerio?.nombre ?? "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground">{asig.evento?.nombre ?? "—"}</td>
                    <td className="py-2 px-3 capitalize">{asig.estado}</td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {asig.fecha_inicio
                        ? new Date(asig.fecha_inicio).toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {asig.fecha_fin
                        ? new Date(asig.fecha_fin).toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
