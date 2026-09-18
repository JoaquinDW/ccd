'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'

type PersonaOpt = { id: string; nombre: string; apellido: string }

const OTRO = '__otro__'

type Props = {
  /** Valor actual: id de persona (mode="id") o "Nombre Apellido" en texto libre (mode="nombre"). */
  value: string
  onChange: (value: string) => void
  /** Personas con el ministerio "Coordinador" activo — opciones del desplegable principal. */
  coordinadoresRol: PersonaOpt[]
  /** Servidores y familiares activos — opciones del buscador que aparece al elegir "Otro". */
  serviciosBusqueda: PersonaOpt[]
  mode: 'id' | 'nombre'
  /** Lista completa opcional, solo para resolver el label de un valor ya guardado que no está en serviciosBusqueda. */
  personasFallback?: PersonaOpt[]
  className?: string
}

function nombreCompleto(p: PersonaOpt): string {
  return `${p.nombre} ${p.apellido}`
}

export function CoordinadorSelector({
  value,
  onChange,
  coordinadoresRol,
  serviciosBusqueda,
  mode,
  personasFallback,
  className,
}: Props) {
  const matched = useMemo(() => {
    if (!value) return undefined
    if (mode === 'id') return coordinadoresRol.find(p => p.id === value)
    const v = value.trim().toLowerCase()
    return coordinadoresRol.find(p => nombreCompleto(p).toLowerCase() === v)
  }, [value, mode, coordinadoresRol])

  const [otroForzado, setOtroForzado] = useState(false)
  const mostrarOtro = otroForzado || (!!value && !matched)

  const selectValue = matched ? matched.id : (mostrarOtro ? OTRO : '')

  function handleSelectRol(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value
    if (v === OTRO) {
      setOtroForzado(true)
      onChange('')
      return
    }
    setOtroForzado(false)
    if (!v) {
      onChange('')
      return
    }
    const p = coordinadoresRol.find(x => x.id === v)
    if (!p) return
    onChange(mode === 'id' ? p.id : nombreCompleto(p))
  }

  const searchOptions = useMemo<ComboboxOption[]>(() => {
    const opts = serviciosBusqueda.map(p => ({
      label: `${p.apellido}, ${p.nombre}`,
      value: mode === 'id' ? p.id : nombreCompleto(p),
    }))
    if (mostrarOtro && value && !opts.some(o => o.value === value)) {
      const fallback = mode === 'id' ? personasFallback?.find(p => p.id === value) : undefined
      opts.unshift({ label: fallback ? `${fallback.apellido}, ${fallback.nombre}` : value, value })
    }
    return opts
  }, [serviciosBusqueda, mode, mostrarOtro, value, personasFallback])

  return (
    <div className={className}>
      <select
        className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        value={selectValue}
        onChange={handleSelectRol}
      >
        <option value="">— Sin asignar —</option>
        {coordinadoresRol.map(p => (
          <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
        ))}
        <option value={OTRO}>Otro…</option>
      </select>
      {mostrarOtro && (
        <div className="mt-2">
          <Combobox
            value={value}
            onSelect={onChange}
            options={searchOptions}
            placeholder="Buscar servidor o familiar..."
            searchPlaceholder="Buscar por apellido o nombre..."
            emptyText="No se encontraron servidores ni familiares."
          />
        </div>
      )}
    </div>
  )
}
