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

  // Path A: Cargar permisos desde rol_permisos (legacy, migración 005).
  const rolSistemaIds = (roles ?? [])
    .map((r: any) => r.rol_sistema_id)
    .filter(Boolean) as string[]

  let legacyPermissions: string[] = []
  if (rolSistemaIds.length > 0) {
    const { data: permsData } = await supabase
      .from('rol_permisos')
      .select('permiso:permisos!permiso_id(clave)')
      .in('rol_sistema_id', rolSistemaIds)
      .eq('activo', true)

    legacyPermissions = (permsData ?? [])
      .map((p: any) => p.permiso?.clave)
      .filter(Boolean) as string[]
  }

  // Path B: Cargar permisos desde asignaciones_ministerio → ministerio_permisos (migración 007).
  let ministerioPermissions: string[] = []
  let ministerioNivelMax = 0
  let ministerioIsAdmin = false
  let ministerioOrgIds: string[] = []

  const persona_id = perfil?.persona_id ?? null
  if (persona_id) {
    const { data: asignaciones } = await supabase
      .from('asignaciones_ministerio')
      .select(`
        organizacion_id,
        ministerio:ministerios!ministerio_id(
          nombre,
          nivel_acceso,
          ministerio_permisos(permiso:permisos!permiso_id(clave))
        )
      `)
      .eq('persona_id', persona_id)
      .eq('estado', 'activo')
      .or(`fecha_fin.is.null,fecha_fin.gt.${hoy}`)

    for (const a of asignaciones ?? []) {
      const min = a.ministerio as any
      if (!min) continue
      const nivelAcceso = min.nivel_acceso ?? 0
      ministerioNivelMax = Math.max(ministerioNivelMax, nivelAcceso)
      if (nivelAcceso >= 100) ministerioIsAdmin = true
      if (a.organizacion_id) ministerioOrgIds.push(a.organizacion_id as string)
      for (const mp of min.ministerio_permisos ?? []) {
        const clave = (mp as any).permiso?.clave
        if (clave && !ministerioPermissions.includes(clave)) {
          ministerioPermissions.push(clave)
        }
      }
    }
  }

  // Merge ambos paths
  const merged_nivel_max = Math.max(nivel_max, ministerioNivelMax)
  const merged_is_admin = is_admin || ministerioIsAdmin
  const merged_org_ids = [...new Set([...org_ids, ...ministerioOrgIds])]
  const db_permissions = [...new Set([...legacyPermissions, ...ministerioPermissions])]

  return {
    auth_user_id: user.id,
    persona_id,
    roles: userRoles,
    org_ids: merged_org_ids,
    is_admin: merged_is_admin,
    nivel_max: merged_nivel_max,
    db_permissions,
  }
}

