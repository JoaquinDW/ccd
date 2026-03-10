import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield, UserCheck, ShieldCheck, Briefcase } from 'lucide-react'
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
          Roles y Permisos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Control de acceso técnico al sistema. Los ministerios pastorales se gestionan desde el perfil de cada persona.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/ministerios/roles">
          <Card className="border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Roles de Acceso</CardTitle>
                  <CardDescription>Define los permisos técnicos de cada rol</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define qué puede ver y hacer cada tipo de usuario: crear personas, gestionar eventos, aprobar publicaciones, etc.
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
                  <CardTitle className="text-foreground">Asignaciones de Acceso</CardTitle>
                  <CardDescription>Qué personas tienen qué nivel de acceso</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Listado y gestión de qué personas tienen acceso al sistema y con qué rol. Para asignar el rol al crear una persona, usá el formulario de Personas.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/personas">
          <Card className="border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Cargos Pastorales</CardTitle>
                  <CardDescription>Ministerios institucionales por persona</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Los ministerios pastorales (Coordinador, Asesor Espiritual, etc.) se asignan desde el perfil de edición de cada persona, en la sección &quot;Ministerios y Organización&quot;.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
