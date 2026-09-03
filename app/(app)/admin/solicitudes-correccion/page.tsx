export const dynamic = 'force-dynamic'

import { MessageSquareWarning } from "lucide-react"
import { formatDateLong } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { ResolutionActions } from "./resolution-actions"

const estadoClases: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  resuelta: "bg-green-100 text-green-800",
}

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  resuelta: "Resuelta",
}

async function getSolicitudes() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("solicitudes_correccion")
    .select(`
      id, campo, descripcion, estado, fecha_creacion, fecha_resolucion, respuesta,
      persona:personas!persona_id(nombre, apellido, email)
    `)
    .order("estado", { ascending: true })
    .order("fecha_creacion", { ascending: false })

  return data || []
}

export default async function SolicitudesCorreccionPage() {
  const solicitudes = await getSolicitudes()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Correcciones de datos</h1>
        <p className="mt-1 text-muted-foreground">
          Solicitudes de cecistas reportando datos bloqueados que están mal cargados
        </p>
      </div>

      {solicitudes.length > 0 ? (
        <div className="space-y-4">
          {solicitudes.map((sol: any) => (
            <Card key={sol.id} className="border-border">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {sol.persona ? `${sol.persona.apellido}, ${sol.persona.nombre}` : "—"}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoClases[sol.estado] ?? ""}`}>
                        {estadoLabels[sol.estado] ?? sol.estado}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {sol.campo}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {sol.persona?.email && <p>{sol.persona.email}</p>}
                    </div>

                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground">Descripción:</p>
                      <p className="text-sm text-foreground">{sol.descripcion}</p>
                    </div>

                    {sol.respuesta && (
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs font-medium text-muted-foreground">Respuesta:</p>
                        <p className="text-sm text-foreground">{sol.respuesta}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Reportado: {formatDateLong(sol.fecha_creacion)}
                      {sol.fecha_resolucion && ` · Resuelto: ${formatDateLong(sol.fecha_resolucion)}`}
                    </p>
                  </div>

                  <ResolutionActions solicitudId={sol.id} currentStatus={sol.estado} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <MessageSquareWarning className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">Sin solicitudes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Nadie reportó datos incorrectos todavía
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
