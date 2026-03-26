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

  const [{ data: ministeriosRaw }, { data: conteoRaw }] = await Promise.all([
    supabase
      .from("ministerios")
      .select("id, nombre, tipo, nivel, nivel_acceso, activo")
      .order("nivel_acceso", { ascending: false })
      .order("nombre"),
    supabase
      .from("asignaciones_ministerio")
      .select("ministerio_id")
      .eq("estado", "activo"),
  ])

  const conteoPorMinisterio: Record<string, number> = {}
  for (const c of conteoRaw ?? []) {
    conteoPorMinisterio[c.ministerio_id] =
      (conteoPorMinisterio[c.ministerio_id] ?? 0) + 1
  }

  const ministerios = (ministeriosRaw ?? []).map((m: any) => ({
    ...m,
    asignaciones: conteoPorMinisterio[m.id] ?? 0,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          Roles de la Plataforma
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra los roles en ministerios y sus permisos de acceso al
          sistema
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">
              Roles en Ministerios Configurados
            </CardTitle>
            <CardDescription>
              Haz clic en un rol para ver y editar sus permisos
            </CardDescription>
          </div>
          <Link href="/ministerios/catalogo/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Rol en Ministerio
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
                No hay roles en ministerios configurados
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
