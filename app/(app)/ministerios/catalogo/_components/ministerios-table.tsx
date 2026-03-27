'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Ministerio {
  id: string
  nombre: string
  tipo: string
  nivel: string
  nivel_acceso: number
  activo: boolean
  asignaciones: number
}

const tipoLabel: Record<string, string> = {
  conduccion: 'Conducción',
  pastoral: 'Pastoral',
  servicio: 'Servicio',
  sistema: 'Sistema',
}

const tipoColor: Record<string, string> = {
  conduccion: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  pastoral: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  servicio: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  sistema: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
}

const nivelLabel: Record<number, { label: string; color: string }> = {
  100: { label: 'Máximo', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  80: { label: 'Alto', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
  60: { label: 'Medio', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  50: { label: 'Básico', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  10: { label: 'Solo lectura', color: 'bg-muted text-muted-foreground' },
}

type SortKey = 'nombre' | 'tipo' | 'nivel' | 'nivel_acceso' | 'asignaciones' | 'activo'
type SortDir = 'asc' | 'desc' | ''

function sortMinisterios(list: Ministerio[], key: SortKey, dir: SortDir): Ministerio[] {
  if (!dir) return list
  return [...list].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    let cmp = 0
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else if (typeof av === 'boolean' && typeof bv === 'boolean') {
      cmp = (av === bv ? 0 : av ? -1 : 1)
    } else {
      cmp = String(av).localeCompare(String(bv))
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

export function MinisteriosTable({ ministerios: initial }: { ministerios: Ministerio[] }) {
  const supabase = createClient()
  const [ministerios, setMinisterios] = useState(initial)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey | ''>('')
  const [sortDir, setSortDir] = useState<SortDir>('')

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey('')
      setSortDir('')
    }
  }

  function ColHeader({ col, label }: { col: SortKey; label: string }) {
    const isActive = sortKey === col
    const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
    return (
      <th className="text-left py-3 px-4 font-semibold text-foreground">
        <button
          type="button"
          onClick={() => handleSort(col)}
          className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          {label}
          <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/50')} />
        </button>
      </th>
    )
  }

  const displayed = sortKey && sortDir ? sortMinisterios(ministerios, sortKey, sortDir) : ministerios

  const allIds = ministerios.map(m => m.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    // Verificar que ninguno tenga asignaciones activas
    const conAsignaciones = ministerios.filter(m => selected.has(m.id) && m.asignaciones > 0)
    if (conAsignaciones.length > 0) {
      setError(
        `No se pueden desactivar roles en ministerios con asignaciones activas: ${conAsignaciones.map(m => m.nombre).join(', ')}`
      )
      return
    }

    // Proteger admin_general
    const protegidos = ministerios.filter(m => selected.has(m.id) && m.nombre === 'admin_general')
    if (protegidos.length > 0) {
      setError('El rol admin_general no se puede desactivar porque es requerido por el sistema de autenticación.')
      return
    }

    setDeleting(true)
    setError(null)

    const ids = [...selected]

    // Soft delete: marcar como inactivo (preserva historial y FK constraints)
    const { error: err } = await supabase
      .from('ministerios')
      .update({ activo: false })
      .in('id', ids)

    if (err) {
      setError(`Error al desactivar: [${err.code}] ${err.message}`)
    } else {
      setMinisterios(prev => prev.map(m =>
        selected.has(m.id) ? { ...m, activo: false } : m
      ))
      setSelected(new Set())
    }

    setDeleting(false)
  }

  const handleDeactivateOne = async (m: Ministerio) => {
    if (m.asignaciones > 0) {
      setError(`No se puede desactivar "${m.nombre}" porque tiene ${m.asignaciones} asignación${m.asignaciones !== 1 ? 'es' : ''} activa${m.asignaciones !== 1 ? 's' : ''}.`)
      return
    }
    if (m.nombre === 'admin_general') {
      setError('El rol admin_general no se puede desactivar porque es requerido por el sistema de autenticación.')
      return
    }
    setDeletingId(m.id)
    setError(null)
    const { error: err } = await supabase
      .from('ministerios')
      .update({ activo: false })
      .eq('id', m.id)
    if (err) {
      setError(`Error al desactivar: [${err.code}] ${err.message}`)
    } else {
      setMinisterios(prev => prev.map(r => r.id === m.id ? { ...r, activo: false } : r))
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-3">
      {/* Barra de acciones bulk */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            variant="destructive"
            className="gap-2 ml-auto"
            disabled={deleting}
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Desactivando...' : 'Desactivar seleccionados'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            disabled={deleting}
          >
            Cancelar
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
              </th>
              <ColHeader col="nombre" label="Nombre" />
              <ColHeader col="tipo" label="Tipo" />
              <ColHeader col="nivel" label="Nivel" />
              <ColHeader col="nivel_acceso" label="Acceso al Sistema" />
              <ColHeader col="asignaciones" label="Asignaciones Activas" />
              <ColHeader col="activo" label="Estado" />
              <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((m) => {
              const nivel = nivelLabel[m.nivel_acceso] ?? (
                m.nivel_acceso > 0
                  ? { label: `Nivel ${m.nivel_acceso}`, color: 'bg-muted text-muted-foreground' }
                  : null
              )
              const isSelected = selected.has(m.id)
              return (
                <tr
                  key={m.id}
                  className={`border-b border-border transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(m.id)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">
                    <Link href={`/ministerios/catalogo/${m.id}`} className="text-foreground hover:text-primary">
                      {m.nombre}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tipoColor[m.tipo] ?? 'bg-muted text-muted-foreground'}`}>
                      {tipoLabel[m.tipo] ?? m.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                    {m.nivel}
                  </td>
                  <td className="py-3 px-4">
                    {nivel ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${nivel.color}`}>
                        {nivel.label} ({m.nivel_acceso})
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin acceso técnico</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {m.asignaciones}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.activo
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <Link href={`/ministerios/catalogo/${m.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={!m.activo || deletingId === m.id}
                        onClick={() => handleDeactivateOne(m)}
                        title={!m.activo ? 'Ya está inactivo' : 'Desactivar rol'}
                      >
                        {deletingId === m.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
