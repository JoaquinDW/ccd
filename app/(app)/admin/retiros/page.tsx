export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Plus, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

const estadoClases: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-800",
  solicitado: "bg-yellow-100 text-yellow-800",
  aprobado: "bg-blue-100 text-blue-800",
  publicado: "bg-green-100 text-green-800",
  finalizado: "bg-purple-100 text-purple-800",
  cancelado: "bg-red-100 text-red-800",
}

async function getRetiros() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("eventos")
    .select(`
      id, nombre, estado, fecha_inicio, fecha_fin, cupo_maximo,
      organizacion:organizaciones!organizacion_id(nombre),
      participantes:evento_participantes(id)
    `)
    .eq("tipo", "retiro")
    .order("fecha_inicio", { ascending: false })

  return data || []
}

export default async function AdminRetreatsPage() {
  const retiros = await getRetiros()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Retiros</h1>
          <p className="mt-1 text-muted-foreground">Gestiona todos los retiros</p>
        </div>
        <Link href="/admin/retiros/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Retiro
          </Button>
        </Link>
      </div>

      {retiros.length > 0 ? (
        <div className="grid gap-4">
          {retiros.map((retiro: any) => (
            <Card key={retiro.id} className="border-border">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{retiro.nombre}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoClases[retiro.estado] ?? "bg-gray-100 text-gray-800"}`}>
                      {retiro.estado}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {retiro.fecha_inicio} — {retiro.fecha_fin}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {retiro.participantes?.length ?? 0} / {retiro.cupo_maximo}
                    </span>
                  </div>
                  {retiro.organizacion && (
                    <p className="text-sm text-muted-foreground">{retiro.organizacion.nombre}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/retiros/${retiro.id}`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                  <Link href={`/admin/retiros/${retiro.id}/inscripciones`}>
                    <Button variant="outline" size="sm">Inscripciones</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">Sin retiros</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu primer retiro para comenzar
            </p>
            <Link href="/admin/retiros/nuevo" className="mt-4 inline-block">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Retiro
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
