export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Briefcase, UserCheck, ShieldCheck, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserContext, canPerform } from '@/lib/auth/context'

export default async function MinisteriosPage() {
  const ctx = await getUserContext()
  if (!ctx) redirect('/auth/login')
  if (!canPerform(ctx, 'roles.assign')) redirect('/dashboard')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Ministerios y Acceso
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestión unificada de ministerios pastorales y permisos de acceso al sistema.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/ministerios/catalogo">
          <Card className="border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Catálogo de Ministerios</CardTitle>
                  <CardDescription>Define ministerios y sus permisos de sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Crea y configura ministerios pastorales y técnicos. Cada ministerio puede tener permisos de acceso al sistema configurables.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ministerios/asignaciones">
          <Card className="border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Asignaciones</CardTitle>
                  <CardDescription>Qué personas tienen qué ministerios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Asigna ministerios a personas. Los permisos de sistema del ministerio se activan automáticamente al hacer login.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/personas">
          <Card className="border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Personas</CardTitle>
                  <CardDescription>Ver perfil y ministerios de cada persona</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Accedé al perfil de cada persona para ver su historial de ministerios y asignaciones desde el formulario de edición.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
