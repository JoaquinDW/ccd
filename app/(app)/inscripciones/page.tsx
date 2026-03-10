export const dynamic = 'force-dynamic'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users } from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

export default async function InscripcionesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Gestión de Inscripciones
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra las inscripciones a eventos
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Inscripciones</CardTitle>
          <CardDescription>
            Esta funcionalidad estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Próximamente</EmptyTitle>
              <EmptyDescription>
                Estamos trabajando para traer esta funcionalidad.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </div>
  )
}
