export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUserContext, canPerform } from "@/lib/auth/context"

function formatDate(date: string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const estadoVidaLabel: Record<string, string> = {
  soltero: "Soltero/a",
  casado: "Casado/a",
  viudo: "Viudo/a",
  separado: "Separado/a",
  consagrado: "Consagrado/a",
}

const categoriaNoCecistaLabel: Record<string, string> = {
  voluntario: "Voluntario",
  convivente: "Convivente",
  cooperador: "Cooperador",
  contacto_casa_retiro: "Contacto Casa Retiro",
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground text-sm">{value || "—"}</dd>
    </div>
  )
}

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, ctx] = await Promise.all([createClient(), getUserContext()])

  const [
    { data: persona, error },
    { data: modos },
    { data: asignaciones },
    { data: categoriasNoCecista },
    { data: personaOrgs },
  ] = await Promise.all([
    supabase
      .from("personas")
      .select(
        "id, nombre, apellido, email, email_ccd, telefono, tipo_documento, documento, fecha_nacimiento, direccion, direccion_nro, localidad, codigo_postal, provincia, pais, notas, estado, created_at, acepta_comunicaciones, estado_eclesial, estado_vida, diocesis, categoria_persona, parroquia, socio_asociacion, referente_comunidad, cecista_dedicado, intercesor_dies_natalis",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("persona_modos")
      .select("modo, fecha_inicio, fecha_fin, estado, motivo_fin")
      .eq("persona_id", id)
      .order("fecha_inicio", { ascending: false }),
    supabase
      .from("asignaciones_ministerio")
      .select(
        "fecha_inicio, fecha_fin, estado, ministerio:ministerios!ministerio_id(nombre), organizacion:organizaciones!organizacion_id(nombre)",
      )
      .eq("persona_id", id)
      .order("fecha_inicio", { ascending: false }),
    supabase
      .from("persona_categoria_no_cecista")
      .select("categoria")
      .eq("persona_id", id),
    supabase
      .from("persona_organizacion")
      .select("tipo_relacion, organizacion:organizaciones!organizacion_id(nombre)")
      .eq("persona_id", id)
      .is("fecha_fin", null),
  ])

  if (error || !persona) notFound()

  const canUpdate = ctx ? canPerform(ctx, "person.update") : false
  const confraternidad = (personaOrgs as any[])?.find(
    (o) => o.tipo_relacion === "confraternidad",
  )?.organizacion?.nombre
  const fraternidad = (personaOrgs as any[])?.find(
    (o) => o.tipo_relacion === "fraternidad",
  )?.organizacion?.nombre

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/personas"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Personas
        </Link>
        {canUpdate && (
          <Link href={`/personas/${id}/editar`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Nombre y estado */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {persona.apellido}, {persona.nombre}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              persona.estado === "activo"
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {persona.estado}
          </span>
        </div>
      </div>

      {/* Datos Personales */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Teléfono" value={persona.telefono} />
            <Field label="Fecha de nacimiento" value={formatDate(persona.fecha_nacimiento)} />
            <Field label="Mail Personal" value={persona.email} />
            <Field label="Mail CcD" value={persona.email_ccd} />
            {persona.tipo_documento && (
              <Field
                label="Documento"
                value={`${persona.tipo_documento.toUpperCase()} ${persona.documento ?? ""}`}
              />
            )}
            {(persona.direccion || persona.direccion_nro) && (
              <div className="col-span-2">
                <Field
                  label="Dirección"
                  value={[persona.direccion, persona.direccion_nro].filter(Boolean).join(" ")}
                />
              </div>
            )}
            <Field label="Ciudad" value={persona.localidad} />
            <Field label="CP" value={persona.codigo_postal} />
            {persona.diocesis && <Field label="Diócesis" value={persona.diocesis} />}
            <Field label="Provincia" value={persona.provincia} />
            <Field label="País" value={persona.pais} />
            {persona.estado_eclesial && (
              <Field label="Estado eclesiástico" value={persona.estado_eclesial} />
            )}
            {persona.parroquia && <Field label="Parroquia" value={persona.parroquia} />}
            {persona.estado_vida && (
              <Field
                label="Estado de vida"
                value={estadoVidaLabel[persona.estado_vida] ?? persona.estado_vida}
              />
            )}
            <Field label="Fecha de registro" value={formatDate(persona.created_at)} />
            <Field
              label="Comunicaciones"
              value={persona.acepta_comunicaciones ? "Acepta" : "No acepta"}
            />
            {persona.notas && (
              <div className="col-span-2">
                <dt className="text-muted-foreground text-sm">Notas</dt>
                <dd className="text-foreground text-sm whitespace-pre-wrap">{persona.notas}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Relación con CcD */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Relación con CcD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {persona.categoria_persona && (
              <Field
                label="Categoría"
                value={persona.categoria_persona === "no_cecista" ? "No Cecista" : "Cecista"}
              />
            )}
            {(persona.socio_asociacion || persona.referente_comunidad || persona.cecista_dedicado) && (
              <div className="col-span-2">
                <dt className="text-muted-foreground text-sm mb-1">Características</dt>
                <dd className="flex gap-2 flex-wrap">
                  {persona.referente_comunidad && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Referente de Comunidad</span>
                  )}
                  {persona.socio_asociacion && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Socio Activo</span>
                  )}
                  {persona.cecista_dedicado && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Dedicado</span>
                  )}
                </dd>
              </div>
            )}
            {persona.categoria_persona === "no_cecista" && (categoriasNoCecista ?? []).length > 0 && (
              <div className="col-span-2">
                <dt className="text-muted-foreground text-sm mb-1">Si es No Cecista</dt>
                <dd className="flex gap-2 flex-wrap">
                  {(categoriasNoCecista ?? []).map((c) => (
                    <span key={c.categoria} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {categoriaNoCecistaLabel[c.categoria] ?? c.categoria}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <Field label="Confraternidad" value={confraternidad} />
            <Field label="Fraternidad" value={fraternidad} />
            {persona.intercesor_dies_natalis && (
              <Field
                label="Intercesor Dies Natalis"
                value={formatDate(persona.intercesor_dies_natalis)}
              />
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Modo de Participación */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Modo de Participación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(modos ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin historial de modos registrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Modo</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Desde</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Hasta</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(modos ?? []).map((m, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border/50 last:border-0 ${
                      !m.fecha_fin ? "bg-green-50 dark:bg-green-900/10" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 text-foreground capitalize">{m.modo}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDate(m.fecha_inicio)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {m.fecha_fin ? (
                        formatDate(m.fecha_fin)
                      ) : (
                        <span className="text-green-700 dark:text-green-400 font-medium">actual</span>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground capitalize">{m.estado ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Asignaciones de Ministerio */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Asignaciones de Ministerio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(asignaciones ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin asignaciones de ministerio registradas.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Ministerio</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Organización</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Desde</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Hasta</th>
                </tr>
              </thead>
              <tbody>
                {(asignaciones as any[]).map((a, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border/50 last:border-0 ${
                      !a.fecha_fin ? "bg-green-50 dark:bg-green-900/10" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 text-foreground">{a.ministerio?.nombre ?? "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.organizacion?.nombre ?? "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDate(a.fecha_inicio)}</td>
                    <td className="py-2 text-muted-foreground">
                      {a.fecha_fin ? (
                        formatDate(a.fecha_fin)
                      ) : (
                        <span className="text-green-700 dark:text-green-400 font-medium">actual</span>
                      )}
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
