import { createClient } from '@/lib/supabase/server'

// Re-export from permissions so callers only need one import
export { canPerform, hasPermission, enforceEventoEstado } from './permissions'
export type { Permission, SystemRole } from './permissions'

export type RolSistema =
  | 'admin_general'
  | 'tecnico_confraternidad'
  | 'responsable_fraternidad'
  | 'usuario_carga'
  | 'solo_lectura'

export type UserRole = {
  rol: RolSistema
  nivel_acceso: number
  organizacion_id: string | null
}

export type UserContext = {
  auth_user_id: string
  persona_id: string | null
  roles: UserRole[]
  /** IDs de organizaciones donde tiene permiso explícito */
  org_ids: string[]
  /** true si tiene admin_general (acceso global) */
  is_admin: boolean
  /** Nivel máximo de acceso del usuario */
  nivel_max: number
  /** Claves de permisos cargadas desde rol_permisos en DB.
   *  Vacío si la migración 005 no ha sido ejecutada (fallback a rolePermissions). */
  db_permissions: string[]
}

/**
 * Obtiene el contexto completo de permisos del usuario autenticado.
 * Usar en Server Components y Route Handlers.
 * Devuelve null si no hay sesión.
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Obtener perfil del usuario (necesario para buscar roles por persona_id)
  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('persona_id')
    .eq('id', user.id)
    .single()

  const hoy = new Date().toISOString().split('T')[0]

  // Buscar roles activos: por usuario_id (cuenta activa) O por persona_id
  // (roles pre-asignados antes de que la persona tuviera cuenta)
  let rolesQuery = supabase
    .from('usuario_roles')
    .select('rol_sistema_id, organizacion_id, rol_sistema:roles_sistema(nombre, nivel_acceso)')
    .eq('activo', true)
    .or(`fecha_fin.is.null,fecha_fin.gt.${hoy}`)

  if (perfil?.persona_id) {
    rolesQuery = rolesQuery.or(`usuario_id.eq.${user.id},persona_id.eq.${perfil.persona_id}`)
  } else {
    rolesQuery = rolesQuery.eq('usuario_id', user.id)
  }

  const { data: roles } = await rolesQuery

  const userRoles: UserRole[] = (roles ?? []).map((r: any) => ({
    rol: r.rol_sistema?.nombre as RolSistema,
    nivel_acceso: r.rol_sistema?.nivel_acceso ?? 0,
    organizacion_id: r.organizacion_id ?? null,
  }))

  const nivel_max = userRoles.reduce((max, r) => Math.max(max, r.nivel_acceso), 0)
  const is_admin = userRoles.some(r => r.rol === 'admin_general')
  const org_ids = userRoles
    .filter(r => r.organizacion_id !== null)
    .map(r => r.organizacion_id as string)

  // Cargar permisos desde rol_permisos (migración 005).
  // Si la tabla no existe o está vacía, db_permissions queda [] y canPerform()
  // usará el mapa hardcodeado como fallback.
  const rolSistemaIds = (roles ?? [])
    .map((r: any) => r.rol_sistema_id)
    .filter(Boolean) as string[]

  let db_permissions: string[] = []
  if (rolSistemaIds.length > 0) {
    const { data: permsData } = await supabase
      .from('rol_permisos')
      .select('permiso:permisos!permiso_id(clave)')
      .in('rol_sistema_id', rolSistemaIds)
      .eq('activo', true)

    db_permissions = (permsData ?? [])
      .map((p: any) => p.permiso?.clave)
      .filter(Boolean) as string[]
  }

  return {
    auth_user_id: user.id,
    persona_id: perfil?.persona_id ?? null,
    roles: userRoles,
    org_ids,
    is_admin,
    nivel_max,
    db_permissions,
  }
}

