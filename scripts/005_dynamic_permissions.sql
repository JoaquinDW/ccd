-- ============================================================
-- CcD Platform - Migration 005: Dynamic Permissions System
-- ============================================================
-- Crea las tablas permisos + rol_permisos para gestionar permisos
-- de forma dinámica desde la UI, y corrige el UNIQUE constraint
-- de usuario_roles para permitir registros históricos.
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- 1. Corregir UNIQUE constraint en usuario_roles
--    El constraint original impide registros históricos (múltiples
--    registros para el mismo usuario+rol+org). Lo reemplazamos por
--    un índice parcial que solo garantiza unicidad en activos.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.usuario_roles
  DROP CONSTRAINT IF EXISTS usuario_roles_usuario_id_rol_sistema_id_organizacion_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_roles_activo
  ON public.usuario_roles (
    usuario_id,
    rol_sistema_id,
    COALESCE(organizacion_id, '00000000-0000-0000-0000-000000000000')
  )
  WHERE activo = TRUE;

-- ──────────────────────────────────────────────────────────────
-- 2. Tabla permisos (catálogo de permisos del sistema)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.permisos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave       TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  categoria   TEXT NOT NULL DEFAULT 'general'
                CHECK (categoria IN ('personas', 'organizaciones', 'eventos', 'roles', 'sistema')),
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permisos_select_auth"
  ON public.permisos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "permisos_insert_auth"
  ON public.permisos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "permisos_update_auth"
  ON public.permisos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Seed: catálogo canónico de permisos
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('person.create',             'Crear personas',                     'Permite registrar nuevas personas en el sistema',                   'personas'),
  ('person.update',             'Editar personas',                    'Permite modificar datos de personas existentes',                    'personas'),
  ('person.delete',             'Dar de baja personas',               'Permite marcar personas como inactivas (soft delete)',              'personas'),
  ('person.merge',              'Fusionar duplicados',                'Permite unificar registros duplicados de personas',                 'personas'),
  ('event.create',              'Crear eventos',                      'Permite crear nuevos eventos (convivencias, retiros, talleres)',    'eventos'),
  ('event.approve',             'Aprobar y publicar eventos',         'Permite cambiar el estado de eventos a aprobado/publicado',        'eventos'),
  ('event.update',              'Editar eventos',                     'Permite modificar datos de eventos existentes',                    'eventos'),
  ('event.manage_participants', 'Gestionar participantes',            'Permite inscribir, confirmar y gestionar participantes de eventos', 'eventos'),
  ('organization.create',       'Crear organizaciones',               'Permite crear nuevas organizaciones en el sistema',                'organizaciones'),
  ('organization.update',       'Editar organizaciones',              'Permite modificar datos de organizaciones existentes',             'organizaciones'),
  ('ministry.assign',           'Asignar ministerios',                'Permite asignar ministerios institucionales a personas',           'roles'),
  ('roles.assign',              'Gestionar roles del sistema',        'Permite asignar y revocar roles técnicos del sistema',             'roles'),
  ('roles.view',                'Ver roles del sistema',              'Permite ver la sección de Ministerios y Roles',                   'roles'),
  ('view.all',                  'Ver todos los registros',            'Permite ver listados de personas, eventos y organizaciones',       'sistema')
ON CONFLICT (clave) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 3. Tabla rol_permisos (junction: rol → permisos asignados)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rol_permisos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol_sistema_id  UUID NOT NULL REFERENCES public.roles_sistema(id) ON DELETE CASCADE,
  permiso_id      UUID NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rol_sistema_id, permiso_id)
);

ALTER TABLE public.rol_permisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rol_permisos_select_auth"
  ON public.rol_permisos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "rol_permisos_insert_auth"
  ON public.rol_permisos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "rol_permisos_update_auth"
  ON public.rol_permisos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "rol_permisos_delete_auth"
  ON public.rol_permisos FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_rol_permisos_rol
  ON public.rol_permisos(rol_sistema_id);

-- ──────────────────────────────────────────────────────────────
-- 4. Seed rol_permisos desde el mapa canónico de permissions.ts
-- ──────────────────────────────────────────────────────────────

-- admin_general: acceso total
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id)
SELECT rs.id, p.id
FROM public.roles_sistema rs, public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave IN (
    'person.create', 'person.update', 'person.delete', 'person.merge',
    'event.create', 'event.approve', 'event.update', 'event.manage_participants',
    'organization.create', 'organization.update',
    'ministry.assign', 'roles.assign', 'roles.view', 'view.all'
  )
ON CONFLICT DO NOTHING;

-- tecnico_confraternidad: gestión sin aprobación ni fusión
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id)
SELECT rs.id, p.id
FROM public.roles_sistema rs, public.permisos p
WHERE rs.nombre = 'tecnico_confraternidad'
  AND p.clave IN (
    'person.create', 'person.update',
    'event.create', 'event.update', 'event.manage_participants',
    'organization.update',
    'ministry.assign', 'roles.view', 'view.all'
  )
ON CONFLICT DO NOTHING;

-- responsable_fraternidad: gestión limitada a su fraternidad
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id)
SELECT rs.id, p.id
FROM public.roles_sistema rs, public.permisos p
WHERE rs.nombre = 'responsable_fraternidad'
  AND p.clave IN (
    'person.create', 'person.update',
    'event.create', 'event.update', 'event.manage_participants',
    'roles.view', 'view.all'
  )
ON CONFLICT DO NOTHING;

-- usuario_carga: carga de datos (eventos forzados a borrador)
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id)
SELECT rs.id, p.id
FROM public.roles_sistema rs, public.permisos p
WHERE rs.nombre = 'usuario_carga'
  AND p.clave IN (
    'person.create', 'person.update',
    'event.create', 'event.update', 'event.manage_participants',
    'view.all'
  )
ON CONFLICT DO NOTHING;

-- solo_lectura: solo visualización
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id)
SELECT rs.id, p.id
FROM public.roles_sistema rs, public.permisos p
WHERE rs.nombre = 'solo_lectura'
  AND p.clave IN ('view.all')
ON CONFLICT DO NOTHING;

COMMIT;
