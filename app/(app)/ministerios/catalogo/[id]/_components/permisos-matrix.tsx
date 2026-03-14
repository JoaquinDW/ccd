'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Permiso {
  id: string
  clave: string
  nombre: string
  descripcion: string | null
  categoria: string
}

interface Props {
  ministerioId: string
  permisosPorCategoria: Record<string, Permiso[]>
  categoriaLabel: Record<string, string>
  permisosActivosIds: string[]
  totalPermisos: number
  isAdmin: boolean
  onNivelChange: (nivel: number) => void
}

export function PermisosMatrix({
  ministerioId,
  permisosPorCategoria,
  categoriaLabel,
  permisosActivosIds,
  totalPermisos,
  isAdmin,
  onNivelChange,
}: Props) {
  const supabase = createClient()
  const [activos, setActivos] = useState<Set<string>>(new Set(permisosActivosIds))
  const [cargando, setCargando] = useState<Set<string>>(new Set())
  const [errores, setErrores] = useState<Record<string, string>>({})

  const calcularNivel = (activosSet: Set<string>) => {
    if (totalPermisos === 0) return 0
    return Math.round((activosSet.size / totalPermisos) * 100)
  }

  const togglePermiso = async (permisoId: string, isChecked: boolean) => {
    // Actualización optimista
    const newActivos = new Set(activos)
    if (isChecked) newActivos.add(permisoId)
    else newActivos.delete(permisoId)

    setActivos(newActivos)
    setCargando(prev => new Set(prev).add(permisoId))
    setErrores(prev => { const e = { ...prev }; delete e[permisoId]; return e })

    const nuevoNivel = calcularNivel(newActivos)

    let error: any = null

    if (isChecked) {
      const res = await supabase
        .from('ministerio_permisos')
        .insert({ ministerio_id: ministerioId, permiso_id: permisoId })
      error = res.error
    } else {
      const res = await supabase
        .from('ministerio_permisos')
        .delete()
        .eq('ministerio_id', ministerioId)
        .eq('permiso_id', permisoId)
      error = res.error
    }

    if (error) {
      // Revertir estado optimista
      setActivos(activos)
      setErrores(prev => ({ ...prev, [permisoId]: 'Error al guardar. Intenta de nuevo.' }))
    } else if (!isAdmin) {
      // Actualizar nivel_acceso automáticamente (solo si no es admin_general, cuyo nivel es fijo en 100)
      await supabase
        .from('ministerios')
        .update({ nivel_acceso: nuevoNivel })
        .eq('id', ministerioId)
      onNivelChange(nuevoNivel)
    }

    setCargando(prev => {
      const next = new Set(prev)
      next.delete(permisoId)
      return next
    })
  }

  const categorias = Object.keys(permisosPorCategoria)

  if (categorias.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay permisos definidos. Ejecuta la migración 005.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {categorias.map(categoria => (
        <div key={categoria}>
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            {categoriaLabel[categoria] ?? categoria}
          </h3>
          <div className="space-y-2">
            {permisosPorCategoria[categoria].map((permiso: Permiso) => {
              const isActive = activos.has(permiso.id)
              const isLoading = cargando.has(permiso.id)
              const errorMsg = errores[permiso.id]

              return (
                <div key={permiso.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <input
                        type="checkbox"
                        id={`perm-${permiso.id}`}
                        checked={isActive}
                        onChange={e => togglePermiso(permiso.id, e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`perm-${permiso.id}`}
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {permiso.nombre}
                    </label>
                    {permiso.descripcion && (
                      <p className="text-xs text-muted-foreground mt-0.5">{permiso.descripcion}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">{permiso.clave}</p>
                    {errorMsg && (
                      <p className="text-xs text-destructive mt-1">{errorMsg}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
