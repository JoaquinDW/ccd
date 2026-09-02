"use client"

import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"

type Ministerio = { id: string; nombre: string }
type Organizacion = { id: string; nombre: string; tipo: string }
/** Par provincia + localidad presente entre las personas (deduplicado en el server component). */
export type Ubicacion = { provincia: string; localidad: string | null }

/** Minúsculas y sin tildes, para comparar variantes de la misma provincia/localidad. */
function normalizar(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

const tipoLabel: Record<string, string> = {
  confraternidad: 'Confraternidad',
  fraternidad: 'Fraternidad',
}

type Props = {
  ministerios: Ministerio[]
  organizaciones: Organizacion[]
  ubicaciones: Ubicacion[]
  canManage: boolean
  defaults: {
    q: string
    estado: string
    estado_eclesial: string
    provincia: string
    localidad: string
    modo: string
    ministerio_id: string
    organizacion_id: string
  }
}

const selectClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
// Iguala la altura y el padding de los <select> vecinos (el Button del Combobox es h-9 px-4).
const comboboxClass = "h-[38px] border-border px-3 text-sm shadow-none"

export default function PersonasFilters({ ministerios, organizaciones, ubicaciones, canManage, defaults }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [provincia, setProvincia] = useState(defaults.provincia)
  const [localidad, setLocalidad] = useState(defaults.localidad)

  const provinciaOptions = useMemo<ComboboxOption[]>(() => {
    const vistas = new Map<string, string>()
    for (const u of ubicaciones) {
      const key = normalizar(u.provincia)
      if (key && !vistas.has(key)) vistas.set(key, u.provincia)
    }
    // Conserva un valor que venga de la URL aunque ya no exista entre las personas visibles.
    if (defaults.provincia && !vistas.has(normalizar(defaults.provincia))) {
      vistas.set(normalizar(defaults.provincia), defaults.provincia)
    }
    return [...vistas.values()]
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((n) => ({ label: n, value: n }))
  }, [ubicaciones, defaults.provincia])

  const localidadOptions = useMemo<ComboboxOption[]>(() => {
    const provKey = normalizar(provincia)
    const vistas = new Map<string, string>()
    for (const u of ubicaciones) {
      if (!u.localidad) continue
      if (provKey && normalizar(u.provincia) !== provKey) continue
      const key = normalizar(u.localidad)
      if (key && !vistas.has(key)) vistas.set(key, u.localidad)
    }
    if (defaults.localidad && !vistas.has(normalizar(defaults.localidad))) {
      vistas.set(normalizar(defaults.localidad), defaults.localidad)
    }
    return [...vistas.values()]
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((n) => ({ label: n, value: n }))
  }, [ubicaciones, provincia, defaults.localidad])

  function handleProvinciaChange(val: string) {
    setProvincia(val)
    // Si la ciudad elegida no pertenece a la nueva provincia, se descarta.
    if (!localidad) return
    const sigueValiendo = ubicaciones.some(
      (u) =>
        u.localidad &&
        normalizar(u.localidad) === normalizar(localidad) &&
        (!val || normalizar(u.provincia) === normalizar(val))
    )
    if (!sigueValiendo) setLocalidad("")
  }

  function handleClear() {
    setProvincia("")
    setLocalidad("")
    router.push("/personas")
  }

  const hasActiveFilters = Object.values(defaults).some((v) => v !== "") || provincia !== "" || localidad !== ""

  return (
    <form ref={formRef} method="GET" className="space-y-3">
      {/* Búsqueda — fila completa */}
      <div className="relative">
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

      {/* Grid de filtros */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {canManage && (
          <select name="estado" defaultValue={defaults.estado} className={selectClass}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        )}

        <select name="modo" defaultValue={defaults.modo} className={selectClass}>
          <option value="">Modo de participación</option>
          <option value="convivente">Convivente</option>
          <option value="colaborador">Colaborador</option>
          <option value="servidor">Servidor</option>
          <option value="asesor">Asesor</option>
          <option value="familiar">Familiar</option>
          <option value="orante">Orante</option>
          <option value="intercesor">Intercesor</option>
          <option value="otro">Otro</option>
        </select>

        {canManage && (
          <select name="estado_eclesial" defaultValue={defaults.estado_eclesial} className={selectClass}>
            <option value="">Estado eclesiástico</option>
            <option value="laico">Laico</option>
            <option value="religioso">Religioso/a</option>
            <option value="diacono">Diácono</option>
            <option value="sacerdote">Sacerdote</option>
            <option value="obispo">Obispo</option>
            <option value="cardenal">Cardenal</option>
          </select>
        )}

        <div>
          <input type="hidden" name="provincia" value={provincia} />
          <Combobox
            value={provincia}
            onSelect={handleProvinciaChange}
            options={provinciaOptions}
            placeholder="Provincia"
            searchPlaceholder="Buscar provincia..."
            emptyText="Sin provincias cargadas."
            className={comboboxClass}
          />
        </div>

        <div>
          <input type="hidden" name="localidad" value={localidad} />
          <Combobox
            value={localidad}
            onSelect={setLocalidad}
            options={localidadOptions}
            placeholder="Ciudad / Localidad"
            searchPlaceholder="Buscar ciudad..."
            emptyText={provincia ? "Sin ciudades en esa provincia." : "Sin ciudades cargadas."}
            className={comboboxClass}
          />
        </div>

        {organizaciones.length > 0 && (
          <select name="organizacion_id" defaultValue={defaults.organizacion_id} className={selectClass}>
            <option value="">Confraternidad / Fraternidad</option>
            {organizaciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre} ({tipoLabel[o.tipo] ?? o.tipo})
              </option>
            ))}
          </select>
        )}

        {canManage && ministerios.length > 0 && (
          <select name="ministerio_id" defaultValue={defaults.ministerio_id} className={selectClass}>
            <option value="">Rol asignado</option>
            {ministerios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-2">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Limpiar filtros
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filtrar
        </button>
      </div>
    </form>
  )
}
