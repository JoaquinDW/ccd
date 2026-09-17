import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getUserContext, canPerform } from "@/lib/auth/context"
import { OrganizacionFilter } from "./_components/organizacion-filter"

const votoLabel: Record<string, string> = {
  tender_union_dios: "Tender a la unión con Dios",
  caridad_fraterna: "Caridad fraterna",
  irradiacion: "Irradiación",
  castidad: "Castidad",
  pobreza: "Pobreza",
  obediencia: "Obediencia",
  tender_union_dios_matrimonios: "Tender a la unión con Dios (matrimonios)",
  otros_familiares: "Solo familiares — otros votos",
}

const votoOrden = Object.keys(votoLabel)

type VotoRow = {
  tipo_voto: string
  anio: number | null
  perpetuo: boolean
  temporal_cant_anios: number | null
}

// Vigencia del voto al día de la fecha.
function vigencia(v: VotoRow): { estado: "vigente" | "vencido" | "sin_dato"; detalle: string } {
  if (v.perpetuo) return { estado: "vigente", detalle: "Perpetuo" }
  if (v.anio && v.temporal_cant_anios) {
    const vence = v.anio + v.temporal_cant_anios
    const anioActual = new Date().getFullYear()
    return {
      estado: vence >= anioActual ? "vigente" : "vencido",
      detalle: `Temporal · ${v.anio}–${vence}`,
    }
  }
  if (v.anio) return { estado: "sin_dato", detalle: `Desde ${v.anio}` }
  return { estado: "sin_dato", detalle: "Sin datos" }
}

const badgeClass: Record<string, string> = {
  vigente: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  vencido: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  sin_dato: "bg-muted text-muted-foreground",
}

export default async function VotosListadoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; organizacion_id?: string }>
}) {
  const [params, ctx] = await Promise.all([searchParams, getUserContext()])
  if (!ctx) redirect("/auth/login")

  const canView = canPerform(ctx, "votos.list") || canPerform(ctx, "votos.edit")
  if (!canView) redirect("/dashboard")

  const canEdit = canPerform(ctx, "votos.edit")
  const q = (params.q ?? "").trim()
  const organizacion_id = params.organizacion_id ?? ""

  const supabase = await createClient()

  // Confraternidades/fraternidades para el filtro
  const { data: orgs } = await supabase
    .from("organizaciones")
    .select("id, nombre, tipo")
    .in("tipo", ["confraternidad", "fraternidad"])
    .is("fecha_baja", null)
    .order("tipo")
    .order("nombre")

  // Filtro por organización → persona_ids
  let orgPersonaIds: string[] | null = null
  if (organizacion_id) {
    const { data } = await supabase
      .from("persona_organizacion")
      .select("persona_id")
      .eq("organizacion_id", organizacion_id)
      .is("fecha_fin", null)
    orgPersonaIds = data?.map(r => r.persona_id) ?? []
  }

  // Todos los votos cargados, con la persona (inner join)
  let votosByPersona: Record<
    string,
    { nombre: string; apellido: string; votos: VotoRow[] }
  > = {}

  if (!(orgPersonaIds !== null && orgPersonaIds.length === 0)) {
    let query = supabase
      .from("persona_votos")
      .select(
        "tipo_voto, anio, perpetuo, temporal_cant_anios, persona:personas!inner(id, nombre, apellido, tipo_persona, fecha_baja)",
      )
      .is("persona.fecha_baja", null)

    if (orgPersonaIds !== null) query = query.in("persona_id", orgPersonaIds)

    const { data } = await query
    for (const row of (data ?? []) as any[]) {
      const p = row.persona
      if (!p) continue
      if (q) {
        const full = `${p.nombre ?? ""} ${p.apellido ?? ""}`.toLowerCase()
        if (!full.includes(q.toLowerCase())) continue
      }
      if (!votosByPersona[p.id]) {
        votosByPersona[p.id] = { nombre: p.nombre, apellido: p.apellido, votos: [] }
      }
      votosByPersona[p.id].votos.push({
        tipo_voto: row.tipo_voto,
        anio: row.anio,
        perpetuo: row.perpetuo,
        temporal_cant_anios: row.temporal_cant_anios,
      })
    }
  }

  const personas = Object.entries(votosByPersona)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Votos de Dedicados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Listado de votos vigentes de los hermanos.
          {canEdit ? " Ingresá al detalle de una persona para editar sus votos." : " Solo lectura."}
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Buscar por nombre</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Nombre o apellido"
                className="h-9 w-56 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <OrganizacionFilter orgs={orgs ?? []} defaultValue={organizacion_id} />
            <Button type="submit" size="sm">
              Filtrar
            </Button>
            {(q || organizacion_id) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/votos">Limpiar</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {personas.length} {personas.length === 1 ? "hermano" : "hermanos"} con votos cargados
      </p>

      <div className="space-y-3">
        {personas.map(p => (
          <Card key={p.id} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base text-foreground">
                <Link href={`/personas/${p.id}`} className="hover:underline">
                  {p.apellido}, {p.nombre}
                </Link>
              </CardTitle>
              {canEdit && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/personas/${p.id}`}>Editar votos</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {p.votos
                  .slice()
                  .sort((a, b) => votoOrden.indexOf(a.tipo_voto) - votoOrden.indexOf(b.tipo_voto))
                  .map((v, i) => {
                    const vg = vigencia(v)
                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${badgeClass[vg.estado]}`}
                      >
                        <span className="font-medium">{votoLabel[v.tipo_voto] ?? v.tipo_voto}</span>
                        <span className="opacity-75">· {vg.detalle}</span>
                      </span>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        ))}

        {personas.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No hay hermanos con votos cargados para este filtro.
          </p>
        )}
      </div>
    </div>
  )
}
