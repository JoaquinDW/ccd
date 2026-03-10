export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Calendar, Users, Building2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

async function getStats() {
  const supabase = await createClient()

  const [retirosResult, inscripcionesResult, confraternidadesResult] = await Promise.all([
    supabase.from("eventos").select("id", { count: "exact", head: true }).eq("tipo", "retiro"),
    supabase.from("evento_participantes").select("id", { count: "exact", head: true }),
    supabase
      .from("organizaciones")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "confraternidad"),
  ])

  const { data: recentInscripciones } = await supabase
    .from("evento_participantes")
    .select(`
      id, estado_inscripcion, fecha_inscripcion,
      persona:personas!persona_id(nombre, apellido),
      evento:eventos!evento_id(nombre)
    `)
    .order("fecha_inscripcion", { ascending: false })
    .limit(5)

  return {
    retirosCount: retirosResult.count ?? 0,
    inscripcionesCount: inscripcionesResult.count ?? 0,
    confraternidadesCount: confraternidadesResult.count ?? 0,
    recentInscripciones: recentInscripciones ?? [],
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Panel de Administración</h1>
        <p className="mt-1 text-muted-foreground">Gestiona retiros, inscripciones y confraternidades</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Retiros</CardDescription>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.retirosCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Inscripciones</CardDescription>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.inscripcionesCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Confraternidades</CardDescription>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.confraternidadesCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Inscripciones Recientes</CardTitle>
              <CardDescription>Últimas solicitudes recibidas</CardDescription>
            </div>
            <Link href="/admin/inscripciones">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentInscripciones.length > 0 ? (
              <div className="space-y-4">
                {stats.recentInscripciones.map((insc: any) => (
                  <div key={insc.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {insc.persona
                          ? `${insc.persona.apellido}, ${insc.persona.nombre}`
                          : "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">{insc.evento?.nombre}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(insc.fecha_inscripcion).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No hay inscripciones recientes</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
            <CardDescription>Gestión de contenido</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/admin/retiros/nuevo">
              <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                <Calendar className="h-4 w-4" />
                Crear Nuevo Retiro
              </Button>
            </Link>
            <Link href="/admin/cofradias/nueva">
              <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                <Building2 className="h-4 w-4" />
                Agregar Confraternidad
              </Button>
            </Link>
            <Link href="/admin/inscripciones">
              <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                <Users className="h-4 w-4" />
                Gestionar Inscripciones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
