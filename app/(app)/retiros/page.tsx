export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Calendar, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { createClient } from "@/lib/supabase/server"

async function getRetiros() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("eventos")
    .select(`
      id, nombre, descripcion, fecha_inicio, fecha_fin, precio, cupo_maximo,
      organizacion:organizaciones!organizacion_id(nombre),
      casa_retiro:organizaciones!casa_retiro_id(nombre, localidad)
    `)
    .eq("tipo", "retiro")
    .eq("estado", "publicado")
    .gte("fecha_inicio", new Date().toISOString().split("T")[0])
    .order("fecha_inicio", { ascending: true })

  return data || []
}

export default async function RetirosPage() {
  const retiros = await getRetiros()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-linear-to-b from-primary/5 to-background py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Retiros Disponibles
            </h1>
            <p className="mt-2 text-muted-foreground">
              Encuentra el retiro espiritual perfecto para ti
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            {retiros.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {retiros.map((retiro: any) => (
                  <Card key={retiro.id} className="overflow-hidden border-border bg-card transition-shadow hover:shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {retiro.organizacion?.nombre ?? "Organización"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {retiro.cupo_maximo} cupos
                        </span>
                      </div>
                      <CardTitle className="mt-3 line-clamp-2 text-foreground">
                        {retiro.nombre}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {retiro.descripcion}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(retiro.fecha_inicio).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "long",
                            })} — {new Date(retiro.fecha_fin).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                        {retiro.casa_retiro && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {retiro.casa_retiro.nombre}{retiro.casa_retiro.localidad ? `, ${retiro.casa_retiro.localidad}` : ""}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{retiro.cupo_maximo} cupos</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-semibold text-foreground">
                          {retiro.precio ? `$${Number(retiro.precio).toFixed(2)}` : "Gratis"}
                        </span>
                        <Link href={`/retiros/${retiro.id}`}>
                          <Button>Ver Detalles</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No hay retiros disponibles</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Actualmente no hay retiros programados. Vuelve pronto para ver nuevas experiencias espirituales.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
