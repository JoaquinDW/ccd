import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * IDs de eventos donde la persona es el coordinador asignado o uno de los
 * (hasta 3) centralizadores — mismo criterio que `esCoordinador` /
 * `esCentralizadorDeEvento` en lib/eventos/cierre.ts, pero resuelto contra
 * la base en vez de un evento ya cargado en memoria. "Centralizador" y
 * "Coordinador" son roles scoped a un evento puntual (columnas en
 * `eventos`, no un ministerio institucional), por eso no hay un permiso de
 * catálogo para esto — se determina directamente por esas columnas.
 */
export async function eventoIdsComoCoordinadorOCentralizador(
  supabase: SupabaseServerClient,
  personaId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('eventos')
    .select('id')
    .or(
      `coordinador_asignado_id.eq.${personaId},centralizador_1_persona_id.eq.${personaId},centralizador_2_persona_id.eq.${personaId},centralizador_3_persona_id.eq.${personaId}`,
    )
  return (data ?? []).map((e) => e.id as string)
}
