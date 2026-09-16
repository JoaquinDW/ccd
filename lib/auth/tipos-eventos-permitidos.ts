import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserContext } from './context'

/**
 * Resuelve, de un conjunto de tipo_evento_id, cuáles puede solicitar el usuario.
 *
 * Regla (tabla tipo_evento_roles_solicitantes, ministerio_id ↔ tipo_evento_id):
 * - admin_general: todos.
 * - Un tipo_evento sin ninguna fila configurada en tipo_evento_roles_solicitantes
 *   queda abierto (no reduce el acceso de tipos que nunca fueron restringidos).
 * - Un tipo_evento con filas configuradas requiere que al menos uno de los
 *   ministerios activos del usuario esté en esa lista (OR entre ministerios).
 */
export async function getTiposEventoPermitidos(
  supabase: SupabaseClient,
  ctx: UserContext,
  tipoEventoIds: string[]
): Promise<Set<string>> {
  const ids = [...new Set(tipoEventoIds.filter(Boolean))]
  if (ids.length === 0) return new Set()
  if (ctx.is_admin) return new Set(ids)

  const { data: filas } = await supabase
    .from('tipo_evento_roles_solicitantes')
    .select('tipo_evento_id, ministerio_id')
    .in('tipo_evento_id', ids)

  const configurados = new Map<string, Set<string>>()
  for (const fila of filas ?? []) {
    const set = configurados.get(fila.tipo_evento_id) ?? new Set<string>()
    set.add(fila.ministerio_id)
    configurados.set(fila.tipo_evento_id, set)
  }

  const permitidos = new Set<string>()
  for (const id of ids) {
    const ministeriosPermitidos = configurados.get(id)
    if (!ministeriosPermitidos) {
      // No configurado para este tipo de evento: no restringe.
      permitidos.add(id)
      continue
    }
    if (ctx.ministerio_ids.some(mid => ministeriosPermitidos.has(mid))) {
      permitidos.add(id)
    }
  }
  return permitidos
}

/** Variante para un único tipo_evento_id (chequeo de enforcement en el POST). */
export async function puedeSolicitarTipoEvento(
  supabase: SupabaseClient,
  ctx: UserContext,
  tipoEventoId: string
): Promise<boolean> {
  const permitidos = await getTiposEventoPermitidos(supabase, ctx, [tipoEventoId])
  return permitidos.has(tipoEventoId)
}
