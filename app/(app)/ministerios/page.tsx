import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield, UserCheck, ShieldCheck } from 'lucide-react'
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
          Ministerios y Roles
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestión de roles del sistema, permisos y asignaciones de acceso
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/ministerios/roles">
          <Card className="border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Roles del Sistema</CardTitle>
                  <CardDescription>Administra los roles y sus permisos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define qué puede hacer cada rol: crear personas, gestionar eventos, aprobar publicaciones, etc. Los permisos son configurables de forma dinámica.
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
                  <CardTitle className="text-foreground">Asignaciones de Roles</CardTitle>
                  <CardDescription>Asigna y revoca roles a usuarios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Controla qué usuarios tienen acceso a cada función del sistema. Las asignaciones pueden ser globales o limitadas a una organización específica.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
