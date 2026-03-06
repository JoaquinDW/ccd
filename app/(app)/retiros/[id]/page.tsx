import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { createClient } from "@/lib/supabase/server"

async function getRetiro(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("eventos")
    .select(`
      id, nombre, descripcion, fecha_inicio, fecha_fin, precio, cupo_maximo, estado,
      organizacion:organizaciones!organizacion_id(nombre, notas),
      casa_retiro:organizaciones!casa_retiro_id(nombre, localidad, provincia)
    `)
    .eq("id", id)
    .eq("tipo", "retiro")
    .single()

  return data
}

async function getParticipantCount(eventoId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from("evento_participantes")
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .in("estado_inscripcion", ["pendiente", "confirmado"])

  return count ?? 0
}

export default async function RetiroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [retiro, participantes] = await Promise.all([
    getRetiro(id),
    getParticipantCount(id),
  ])

  if (!retiro) {
    notFound()
  }

  const cuposDisponibles = retiro.cupo_maximo - participantes
  const agotado = cuposDisponibles <= 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-linear-to-b from-primary/5 to-background py-8">
          <div className="container mx-auto px-4">
            <Link href="/retiros" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Volver a Retiros
            </Link>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <div>
                    {retiro.organizacion && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {retiro.organizacion.nombre}
                      </span>
                    )}
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                      {retiro.nombre}
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
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
                        <MapPin className="h-5 w-5" />
                        <span>
                          {retiro.casa_retiro.nombre}
                          {retiro.casa_retiro.localidad ? `, ${retiro.casa_retiro.localidad}` : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>{participantes} / {retiro.cupo_maximo} participantes</span>
                    </div>
                  </div>

                  {retiro.descripcion && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground">Descripción</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {retiro.descripcion}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {retiro.organizacion?.notas && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground">Sobre la Organización</CardTitle>
                        <CardDescription>{retiro.organizacion.nombre}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{retiro.organizacion.notas}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-border">
                  <CardHeader>
                    <CardTitle className="text-2xl text-foreground">
                      {retiro.precio ? `$${Number(retiro.precio).toFixed(2)}` : "Gratis"}
                    </CardTitle>
                    <CardDescription>Por persona</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cupos disponibles</span>
                        <span className="font-medium text-foreground">
                          {agotado ? "Agotado" : `${cuposDisponibles} cupos`}
                        </span>
                      </div>
                    </div>

                    <Link href={agotado ? "#" : `/retiros/${retiro.id}/inscripcion`} className="block">
                      <Button className="w-full" size="lg" disabled={agotado}>
                        {agotado ? "Cupos Agotados" : "Inscribirme Ahora"}
                      </Button>
                    </Link>

                    {!agotado && cuposDisponibles <= 5 && (
                      <p className="text-center text-sm text-amber-600 dark:text-amber-400">
                        ¡Solo quedan {cuposDisponibles} cupos!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
