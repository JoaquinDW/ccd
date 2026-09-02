export const dynamic = "force-dynamic"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, Plus, Edit2, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUserContext, canPerform } from "@/lib/auth/context"
import OrgExportButton from "./_components/org-export-button"
import SortableHeader from "@/components/ui/sortable-header"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const PAGE_SIZE = 20

export default async function OrganizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    tipo?: string
    estado?: string
    provincia?: string
    localidad?: string
    sortBy?: string
    sortDir?: string
    page?: string
  }>
}) {
  const [params, ctx] = await Promise.all([searchParams, getUserContext()])
  const q = params.q ?? ""
  const tipo = params.tipo ?? ""
  const estado = params.estado ?? ""
  const provincia = params.provincia ?? ""
  const localidad = params.localidad ?? ""
  const sortBy = params.sortBy ?? ""
  const sortDir =
    params.sortDir === "asc" || params.sortDir === "desc"
      ? params.sortDir
      : "asc"
  const pageNum = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)

  const canCreate = ctx ? canPerform(ctx, "organization.create") : false
  const canExport = ctx ? canPerform(ctx, "organizaciones.export") : false
  const canManage = ctx ? canPerform(ctx, "organization.update") : false
  // canUpdate se evalúa por org en la tabla (ver uso abajo)
  const canUpdateOrg = (orgId: string) =>
    ctx ? canPerform(ctx, "organization.update", orgId) : false
  const supabase = await createClient()

  const SORTABLE_ORGS = canManage
    ? ["nombre", "tipo", "localidad", "estado"]
    : ["nombre"]
  const sortCol =
    canManage && sortBy && SORTABLE_ORGS.includes(sortBy) ? sortBy : "nombre"
  const sortAsc = canManage && sortBy ? sortDir === "asc" : true

  let query = supabase
    .from("organizaciones")
    .select(
      "id, codigo, nombre, tipo, localidad, provincia, estado, parent_id",
      { count: "exact" },
    )
    .is("fecha_baja", null)
    .order(sortCol, { ascending: sortAsc })

  if (canManage) {
    if (q) query = query.ilike("nombre", `%${q}%`)
    if (tipo) query = query.eq("tipo", tipo)
    if (estado) query = query.eq("estado", estado)
    if (provincia) query = query.ilike("provincia", `%${provincia}%`)
    if (localidad) query = query.ilike("localidad", `%${localidad}%`)
  } else {
    // Vista restringida: solo confraternidades (incluye el nodo agrupador
    // "Fraternidades Dependientes del Equipo Timón", que también es tipo='confraternidad')
    query = query.eq("tipo", "confraternidad")
    if (q) query = query.ilike("nombre", `%${q}%`)
  }

  const from = (pageNum - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data: organizaciones, count } = await query.range(from, to)

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Nota: no se usa el embed `organizaciones!parent_id(...)` porque, al ser
  // organizaciones auto-referenciada, PostgREST resuelve el hint de forma
  // ambigua y trae la relación inversa (hijos) en vez del padre. Se busca
  // aparte, en lote, solo para las orgs de esta página.
  const parentNames: Record<string, string> = {}
  if (canManage) {
    const parentIds = [
      ...new Set(
        (organizaciones ?? [])
          .map((o: any) => o.parent_id)
          .filter((id: string | null): id is string => !!id),
      ),
    ]
    if (parentIds.length > 0) {
      const { data: parents } = await supabase
        .from("organizaciones")
        .select("id, nombre")
        .in("id", parentIds)
      for (const p of parents ?? []) parentNames[p.id] = p.nombre
    }
  }

  // Build a URL for a given page preserving current filters/sort
  const buildPageHref = (target: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set("q", q)
    if (tipo) sp.set("tipo", tipo)
    if (estado) sp.set("estado", estado)
    if (provincia) sp.set("provincia", provincia)
    if (localidad) sp.set("localidad", localidad)
    if (sortBy) sp.set("sortBy", sortBy)
    if (sortBy) sp.set("sortDir", sortDir)
    if (target > 1) sp.set("page", String(target))
    const qs = sp.toString()
    return qs ? `/organizaciones?${qs}` : "/organizaciones"
  }

  const tipoLabel: Record<string, string> = {
    comunidad: "Comunidad",
    confraternidad: "Confraternidad",
    fraternidad: "Fraternidad",
    // casa_retiro: 'Casa de Retiro',
    // eqt: 'EQT',
    otra: "Otra",
  }

  const hasFilters = canManage
    ? !!(q || tipo || estado || provincia || localidad)
    : !!q

  const exportParams = new URLSearchParams()
  if (q) exportParams.set("q", q)
  if (tipo) exportParams.set("tipo", tipo)
  if (estado) exportParams.set("estado", estado)
  if (provincia) exportParams.set("provincia", provincia)
  if (localidad) exportParams.set("localidad", localidad)
  const exportSearch =
    exportParams.size > 0 ? `?${exportParams.toString()}` : ""

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Comunidad Convivencia con Dios
        </h1>
        <p className="mt-2 text-muted-foreground">
          {canManage
            ? "Administra las confraternidades, fraternidades y su jerarquía"
            : "Consultá las confraternidades y su jerarquía"}
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">
              {canManage
                ? "Confraternidades y Fraternidades de Comunidad Convivencia con Dios"
                : "Confraternidades de Comunidad Convivencia con Dios"}
            </CardTitle>
            <CardDescription>
              {canManage
                ? "Lista completa de confraternidades y fraternidades en el sistema"
                : "Listado de confraternidades"}
            </CardDescription>
          </div>
          {canCreate && (
            <Link href="/organizaciones/nueva">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Confraternidad / Fraternidad
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <form method="GET" className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-50 flex-1">
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 pl-8 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {canManage && (
              <>
                <select
                  name="tipo"
                  defaultValue={tipo}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Todos los tipos</option>
                  <option value="comunidad">Comunidad</option>
                  <option value="confraternidad">Confraternidad</option>
                  <option value="fraternidad">Fraternidad</option>
                  <option value="otra">Otra</option>
                </select>

                <select
                  name="estado"
                  defaultValue={estado}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Todos los estados</option>
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                </select>

                <input
                  name="provincia"
                  defaultValue={provincia}
                  placeholder="Provincia..."
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground w-32"
                />

                <input
                  name="localidad"
                  defaultValue={localidad}
                  placeholder="Localidad..."
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground w-32"
                />
              </>
            )}

            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Filtrar
            </button>

            {hasFilters && (
              <Link
                href="/organizaciones"
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Limpiar
              </Link>
            )}
          </form>

          {/* Table */}
          {organizaciones && organizaciones.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {canManage
                    ? total === 1
                      ? "1 confraternidad / fraternidad"
                      : `${total} confraternidades / fraternidades`
                    : total === 1
                      ? "1 confraternidad"
                      : `${total} confraternidades`}
                  {total > PAGE_SIZE && (
                    <>
                      {" · "}
                      {from + 1}–{Math.min(from + PAGE_SIZE, total)}
                    </>
                  )}
                </span>
                {canExport && <OrgExportButton searchString={exportSearch} />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {canManage && (
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Código
                        </th>
                      )}
                      <SortableHeader
                        column="nombre"
                        label="Nombre"
                        currentSort={sortBy}
                        currentDir={sortDir}
                      />
                      {canManage && (
                        <>
                          <SortableHeader
                            column="tipo"
                            label="Tipo"
                            currentSort={sortBy}
                            currentDir={sortDir}
                          />
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            Relación
                          </th>
                          <SortableHeader
                            column="localidad"
                            label="Localidad"
                            currentSort={sortBy}
                            currentDir={sortDir}
                          />
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            Provincia
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">
                            Acciones
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {organizaciones.map((org: any) => (
                      <tr
                        key={org.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        {canManage && (
                          <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                            {org.codigo ?? "—"}
                          </td>
                        )}
                        <td className="py-3 px-4 font-medium">
                          <Link
                            href={`/organizaciones/${org.id}`}
                            className="text-foreground hover:text-primary"
                          >
                            {org.nombre}
                          </Link>
                        </td>
                        {canManage && (
                          <>
                            <td className="py-3 px-4 text-muted-foreground">
                              {tipoLabel[org.tipo] ?? org.tipo}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {(org.parent_id && parentNames[org.parent_id]) ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {org.localidad ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {org.provincia ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {canUpdateOrg(org.id) && (
                                <Link href={`/organizaciones/${org.id}/editar`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={buildPageHref(Math.max(1, pageNum - 1))}
                        aria-disabled={pageNum <= 1}
                        className={
                          pageNum <= 1
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - pageNum) <= 1,
                      )
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1]
                        const gap = prev && p - prev > 1
                        return (
                          <span key={p} className="flex items-center">
                            {gap && (
                              <span className="px-2 text-muted-foreground">
                                …
                              </span>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href={buildPageHref(p)}
                                isActive={p === pageNum}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          </span>
                        )
                      })}

                    <PaginationItem>
                      <PaginationNext
                        href={buildPageHref(Math.min(totalPages, pageNum + 1))}
                        aria-disabled={pageNum >= totalPages}
                        className={
                          pageNum >= totalPages
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {hasFilters
                  ? "No se encontraron confraternidades / fraternidades"
                  : "No hay confraternidades / fraternidades registradas"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {hasFilters
                  ? "Probá con otros filtros"
                  : "Comienza agregando la primera confraternidad o fraternidad al sistema"}
              </p>
              {!hasFilters && canCreate && (
                <Link
                  href="/organizaciones/nueva"
                  className="mt-4 inline-block"
                >
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Confraternidad / Fraternidad
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
