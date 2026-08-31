export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { Briefcase, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { getUserContext, canPerform } from "@/lib/auth/context"
import { MinisteriosTable } from "./_components/ministerios-table"

export default async function CatalogoMinisteriosPage() {
  const ctx = await getUserContext()
  if (!ctx) redirect("/auth/login")
  if (!canPerform(ctx, "roles.assign")) redirect("/dashboard")

  const supabase = await createClient()

  const { data: ministeriosRaw } = await supabase
    .from("ministerios")
    .select("id, nombre, codigo_interno, tipo, nivel, nivel_acceso, activo")
    .order("nivel_acceso", { ascending: false })
    .order("nombre")

  // Un conteo exacto por ministerio, en vez de traer todas las asignaciones y
  // contarlas acá: PostgREST corta las respuestas en 1000 filas, y con más de
  // 2000 asignaciones activas ese conteo en JS quedaba truncado (roles con
  // cientos de asignaciones aparecían en 0). `head: true` no trae filas, y la
  // cantidad de requests está acotada por el número de roles, no por el de
  // asignaciones. Se apoya en el índice (ministerio_id, estado) de la 007.
  const conteos = await Promise.all(
    (ministeriosRaw ?? []).map(async (m: any) => {
      const { count } = await supabase
        .from("asignaciones_ministerio")
        .select("id", { count: "exact", head: true })
        .eq("estado", "activo")
        .eq("ministerio_id", m.id)
      return [m.id, count ?? 0] as const
    }),
  )
  const conteoPorMinisterio = Object.fromEntries(conteos) as Record<string, number>

  const ministerios = (ministeriosRaw ?? []).map((m: any) => ({
    ...m,
    asignaciones: conteoPorMinisterio[m.id] ?? 0,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          Roles en la Plataforma Convivencia con Dios
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra los roles y sus permisos de acceso al sistema
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">
              Roles Configurados
            </CardTitle>
            <CardDescription>
              Haz clic en un rol para ver y editar sus permisos
            </CardDescription>
          </div>
          <Link href="/ministerios/catalogo/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {ministerios.length > 0 ? (
            <MinisteriosTable ministerios={ministerios} />
          ) : (
            <div className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No hay roles configurados
              </h3>
              <p className="mt-2 text-muted-foreground">
                Ejecuta la migración 007 para cargar los roles del sistema
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
