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
  rolId: string
  permisosPorCategoria: Record<string, Permiso[]>
  categoriaLabel: Record<string, string>
  permisosActivosIds: string[]
}

export function PermisosMatrix({ rolId, permisosPorCategoria, categoriaLabel, permisosActivosIds }: Props) {
  const supabase = createClient()
  const [activos, setActivos] = useState<Set<string>>(new Set(permisosActivosIds))
  const [cargando, setCargando] = useState<Set<string>>(new Set())
  const [errores, setErrores] = useState<Record<string, string>>({})

  const togglePermiso = async (permisoId: string, isChecked: boolean) => {
    // Actualización optimista
    setActivos(prev => {
      const next = new Set(prev)
      if (isChecked) next.add(permisoId)
      else next.delete(permisoId)
      return next
    })
    setCargando(prev => new Set(prev).add(permisoId))
    setErrores(prev => { const e = { ...prev }; delete e[permisoId]; return e })

    let error: any = null

    if (isChecked) {
      const res = await supabase
        .from('rol_permisos')
        .insert({ rol_sistema_id: rolId, permiso_id: permisoId })
      error = res.error
    } else {
      const res = await supabase
        .from('rol_permisos')
        .delete()
        .eq('rol_sistema_id', rolId)
        .eq('permiso_id', permisoId)
      error = res.error
    }

    if (error) {
      // Revertir estado optimista
      setActivos(prev => {
        const next = new Set(prev)
        if (isChecked) next.delete(permisoId)
        else next.add(permisoId)
        return next
      })
      setErrores(prev => ({ ...prev, [permisoId]: 'Error al guardar. Intenta de nuevo.' }))
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
                  <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 flex-shrink-0">
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
