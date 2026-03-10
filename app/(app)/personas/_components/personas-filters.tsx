'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'

type Ministerio = { id: string; nombre: string }

type Props = {
  ministerios: Ministerio[]
  defaults: {
    q: string
    estado: string
    estado_eclesial: string
    provincia: string
    modo: string
    ministerio_id: string
  }
}

export default function PersonasFilters({ ministerios, defaults }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)

  function handleClear() {
    router.push('/personas')
  }

  const hasActiveFilters = Object.values(defaults).some(v => v !== '')

  return (
    <form
      ref={formRef}
      method="GET"
      className="flex flex-wrap items-end gap-2"
    >
      {/* Búsqueda texto */}
      <div className="relative min-w-[200px] flex-1">
        <input
          name="q"
          defaultValue={defaults.q}
          placeholder="Buscar por nombre, apellido o email..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 pl-8 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Estado */}
      <select
        name="estado"
        defaultValue={defaults.estado}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>

      {/* Estado eclesiástico */}
      <select
        name="estado_eclesial"
        defaultValue={defaults.estado_eclesial}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">Estado ecl.</option>
        <option value="laico">Laico</option>
        <option value="religioso">Religioso/a</option>
        <option value="diacono">Diácono</option>
        <option value="sacerdote">Sacerdote</option>
        <option value="obispo">Obispo</option>
        <option value="cardenal">Cardenal</option>
      </select>

      {/* Provincia */}
      <input
        name="provincia"
        defaultValue={defaults.provincia}
        placeholder="Provincia..."
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground w-32"
      />

      {/* Modo de participación */}
      <select
        name="modo"
        defaultValue={defaults.modo}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">Modo de participación</option>
        <option value="colaborador">Colaborador</option>
        <option value="servidor">Servidor</option>
        <option value="asesor">Asesor</option>
        <option value="familiar">Familiar</option>
        <option value="orante">Orante</option>
        <option value="intercesor">Intercesor</option>
      </select>

      {/* Ministerio */}
      {ministerios.length > 0 && (
        <select
          name="ministerio_id"
          defaultValue={defaults.ministerio_id}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">Ministerio asignado</option>
          {ministerios.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      )}

      {/* Botones */}
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Filtrar
      </button>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          Limpiar
        </button>
      )}
    </form>
  )
}
