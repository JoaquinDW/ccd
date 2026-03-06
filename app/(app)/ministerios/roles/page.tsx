import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export default async function RolesPage() {
  const ctx = await getUserContext()
  if (!ctx) redirect('/auth/login')
  if (!canPerform(ctx, 'roles.assign')) redirect('/dashboard')

  const supabase = await createClient()

  // Cargar roles con conteo de asignaciones activas
  const { data: roles } = await supabase
    .from('roles_sistema')
    .select('id, nombre, descripcion, nivel_acceso, activo')
    .order('nivel_acceso', { ascending: false })

  // Cargar conteo de asignaciones por rol
  const { data: conteos } = await supabase
    .from('usuario_roles')
    .select('rol_sistema_id')
    .eq('activo', true)

  const conteoPorRol: Record<string, number> = {}
  for (const c of conteos ?? []) {
    conteoPorRol[c.rol_sistema_id] = (conteoPorRol[c.rol_sistema_id] ?? 0) + 1
  }

  const nivelLabel: Record<number, { label: string; color: string }> = {
    100: { label: 'Máximo', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    80: { label: 'Alto', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
    60: { label: 'Medio', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    50: { label: 'Básico', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    10: { label: 'Solo lectura', color: 'bg-muted text-muted-foreground' },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Roles del Sistema
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra los roles técnicos y sus permisos de acceso
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Roles Configurados</CardTitle>
            <CardDescription>Haz clic en un rol para ver y editar sus permisos</CardDescription>
          </div>
          <Link href="/ministerios/roles/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {roles && roles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Descripción</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nivel de Acceso</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Usuarios Activos</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((rol: any) => {
                    const nivel = nivelLabel[rol.nivel_acceso] ?? {
                      label: `Nivel ${rol.nivel_acceso}`,
                      color: 'bg-muted text-muted-foreground',
                    }
                    return (
                      <tr key={rol.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">
                          <Link href={`/ministerios/roles/${rol.id}`} className="text-foreground hover:text-primary">
                            {rol.nombre}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {rol.descripcion ?? '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${nivel.color}`}>
                            {nivel.label} ({rol.nivel_acceso})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {conteoPorRol[rol.id] ?? 0}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            rol.activo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {rol.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/ministerios/roles/${rol.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay roles configurados</h3>
              <p className="mt-2 text-muted-foreground">
                Ejecuta la migración 005 para cargar los roles del sistema
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
