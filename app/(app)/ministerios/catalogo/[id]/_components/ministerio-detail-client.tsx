'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditMinisterioForm } from './edit-ministerio-form'
import { PermisosMatrix } from './permisos-matrix'

interface Permiso {
  id: string
  clave: string
  nombre: string
  descripcion: string | null
  categoria: string
}

interface Ministerio {
  id: string
  nombre: string
  tipo: string
  nivel: string
  nivel_acceso: number
  activo: boolean
}

interface Props {
  ministerio: Ministerio
  permisosPorCategoria: Record<string, Permiso[]>
  categoriaLabel: Record<string, string>
  permisosActivosIds: string[]
  totalPermisos: number
}

export function MinisterioDetailClient({
  ministerio,
  permisosPorCategoria,
  categoriaLabel,
  permisosActivosIds,
  totalPermisos,
}: Props) {
  const [nivelCalculado, setNivelCalculado] = useState(ministerio.nivel_acceso)
  const isAdmin = ministerio.nombre === 'admin_general'

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div>
        <EditMinisterioForm ministerio={ministerio} nivelCalculado={nivelCalculado} />
      </div>
      <div className="lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Permisos del Ministerio</CardTitle>
            <CardDescription>
              Activa o desactiva permisos. El nivel de acceso se recalcula automáticamente.
              {isAdmin && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  admin_general siempre tiene nivel 100 independientemente de los permisos.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermisosMatrix
              ministerioId={ministerio.id}
              permisosPorCategoria={permisosPorCategoria}
              categoriaLabel={categoriaLabel}
              permisosActivosIds={permisosActivosIds}
              totalPermisos={totalPermisos}
              isAdmin={isAdmin}
              onNivelChange={setNivelCalculado}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
