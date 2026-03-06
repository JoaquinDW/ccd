import type { UserContext } from './context'

// ─── Roles del sistema (deben coincidir con roles_sistema.nombre en DB) ───────

export type SystemRole =
  | 'admin_general'
  | 'tecnico_confraternidad'
  | 'responsable_fraternidad'
  | 'usuario_carga'
  | 'solo_lectura'

// ─── Permisos técnicos ────────────────────────────────────────────────────────

export type Permission =
  | 'person.create'
  | 'person.update'
  | 'person.delete'       // soft delete — solo admin
  | 'person.merge'        // fusión de duplicados — solo admin
  | 'event.create'
  | 'event.approve'       // cambiar estado a aprobado/publicado — solo admin
  | 'event.update'
  | 'event.manage_participants'
  | 'organization.create' // solo admin
  | 'organization.update'
  | 'ministry.assign'
  | 'roles.assign'        // asignar roles de sistema — solo admin
  | 'roles.view'          // ver sección ministerios y roles
  | 'view.all'

// ─── Mapa de permisos por rol ─────────────────────────────────────────────────
//
// IMPORTANTE: Los roles funcionales (coordinador, asesor, centralizador, etc.)
// viven en evento_participantes.rol_en_evento y NO deben mezclarse con esto.
// Solo los roles tipo = sistema controlan acceso técnico.

export const rolePermissions: Record<SystemRole, Permission[]> = {
  admin_general: [
    'person.create',
    'person.update',
    'person.delete',
    'person.merge',
    'event.create',
    'event.approve',
    'event.update',
    'event.manage_participants',
    'organization.create',
    'organization.update',
    'ministry.assign',
    'roles.assign',
    'view.all',
  ],

  tecnico_confraternidad: [
    'person.create',
    'person.update',
    'event.create',
    'event.update',
    'event.manage_participants',
    'organization.update',
    'ministry.assign',
    'roles.view',
    'view.all',
  ],

  responsable_fraternidad: [
    'person.create',
    'person.update',
    'event.create',
    'event.update',
    'event.manage_participants',
    'roles.view',
    'view.all',
  ],

  usuario_carga: [
    'person.create',
    'person.update',
    'event.create',    // estado forzado a 'borrador' en el servidor
    'event.update',
    'event.manage_participants',
    'view.all',
  ],

  solo_lectura: [
    'view.all',
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifica si alguno de los roles dados tiene el permiso requerido.
 * Uso puro (sin contexto de usuario), útil para tests unitarios.
 */
export function hasPermission(roles: SystemRole[], permission: Permission): boolean {
  return roles.some(role => rolePermissions[role]?.includes(permission))
}

/**
 * Verifica si el usuario puede realizar una acción, considerando:
 * 1. Si tiene el permiso en alguno de sus roles
 * 2. Si la acción es sobre una organización específica, si tiene scope sobre ella
 *
 * @param ctx       Contexto del usuario (de getUserContext())
 * @param permission Permiso requerido
 * @param organizacion_id  Organización sobre la que se opera (null = acción global)
 */
export function canPerform(
  ctx: UserContext,
  permission: Permission,
  organizacion_id?: string | null
): boolean {
  // admin_general puede todo, siempre
  if (ctx.is_admin) return true

  // DB-first: usar permisos cargados desde rol_permisos si están disponibles.
  // Fallback al mapa hardcodeado si aún no hay datos en DB (durante migración).
  const hasPerm = ctx.db_permissions.length > 0
    ? ctx.db_permissions.includes(permission)
    : hasPermission(ctx.roles.map(r => r.rol) as SystemRole[], permission)

  if (!hasPerm) return false

  // Si no hay org específica, el permiso aplica globalmente
  if (!organizacion_id) return true

  // Para acciones con scope: verificar que tenga la org asignada
  return ctx.org_ids.includes(organizacion_id)
}

/**
 * Para event.create con usuario_carga: el estado debe forzarse a 'borrador'.
 * Llama esto en el servidor antes de insertar.
 */
export function enforceEventoEstado(ctx: UserContext, estado: string): string {
  if (ctx.is_admin || ctx.nivel_max >= 80) return estado
  return 'borrador'
}
