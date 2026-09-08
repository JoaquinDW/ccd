import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/** Trío país + provincia + localidad presente entre las personas activas. */
export type Ubicacion = { pais: string | null; provincia: string; localidad: string | null }

export type UbicacionesCargadas = {
  /** Combinaciones deduplicadas, para alimentar los combobox del filtro. */
  ubicaciones: Ubicacion[]
  /** Normalizado → valores tal cual están guardados (variantes de tildes/mayúsculas/espacios). */
  variantesProvincia: Record<string, string[]>
  variantesLocalidad: Record<string, string[]>
}

/** Normaliza a minúsculas sin tildes, para deduplicar variantes de la misma provincia/localidad. */
export function normalizarUbicacion(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/**
 * Ubicaciones cargadas entre las personas activas (RLS aplica acá también).
 *
 * Los combobox del filtro ofrecen el catálogo completo (provincias de `lib/geo/subdivisiones`,
 * localidades de Georef), así que esto cumple dos funciones: sumar los valores realmente
 * cargados que no figuran en el catálogo, y registrar cómo está escrito cada uno en la base
 * para poder filtrar aunque el usuario elija la variante canónica ("Córdoba" vs "Cordoba").
 */
export async function fetchUbicaciones(supabase: SupabaseServerClient): Promise<UbicacionesCargadas> {
  const CHUNK = 1000
  const MAX_CHUNKS = 20
  const vistos = new Set<string>()
  const ubicaciones: Ubicacion[] = []
  const variantesProvincia: Record<string, string[]> = {}
  const variantesLocalidad: Record<string, string[]> = {}

  const registrarVariante = (destino: Record<string, string[]>, valor: string | null) => {
    if (valor === null || valor === '') return
    const key = normalizarUbicacion(valor)
    if (!key) return
    const lista = destino[key] ?? (destino[key] = [])
    if (!lista.includes(valor)) lista.push(valor)
  }

  for (let i = 0; i < MAX_CHUNKS; i++) {
    const { data, error } = await supabase
      .from('personas')
      .select('pais, provincia, localidad')
      .is('fecha_baja', null)
      .order('id')
      .range(i * CHUNK, i * CHUNK + CHUNK - 1)

    if (error || !data) break

    for (const row of data) {
      // Las variantes se guardan sin recortar: son el valor exacto contra el que se consulta.
      registrarVariante(variantesProvincia, row.provincia)
      registrarVariante(variantesLocalidad, row.localidad)

      const pais = (row.pais ?? '').trim()
      const prov = (row.provincia ?? '').trim()
      const loc = (row.localidad ?? '').trim()
      const key = `${normalizarUbicacion(pais)}|${normalizarUbicacion(prov)}|${normalizarUbicacion(loc)}`
      if (vistos.has(key)) continue
      vistos.add(key)
      ubicaciones.push({ pais: pais || null, provincia: prov, localidad: loc || null })
    }

    if (data.length < CHUNK) break
  }

  return { ubicaciones, variantesProvincia, variantesLocalidad }
}

/**
 * Valores guardados equivalentes al elegido en el filtro. Vacío si nadie tiene esa
 * provincia/localidad cargada (el listado debe devolver cero resultados, no todos).
 */
export function variantesDe(valor: string, variantes: Record<string, string[]>): string[] {
  return variantes[normalizarUbicacion(valor)] ?? []
}
