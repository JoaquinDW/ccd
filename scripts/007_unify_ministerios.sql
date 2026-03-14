-- ============================================================
-- 007_unify_ministerios.sql
-- Unifica ministerios pastorales y roles técnicos del sistema.
-- Los 5 roles_sistema se convierten en ministerios de tipo 'sistema'
-- con permisos configurables via ministerio_permisos.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Extender tabla ministerios con nivel_acceso
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.ministerios
  ADD COLUMN IF NOT EXISTS nivel_acceso INTEGER NOT NULL DEFAULT 0;

-- Agregar tipo 'sistema' al CHECK de tipo
ALTER TABLE public.ministerios
  DROP CONSTRAINT IF EXISTS ministerios_tipo_check;

ALTER TABLE public.ministerios
  ADD CONSTRAINT ministerios_tipo_check
  CHECK (tipo IN ('conduccion', 'pastoral', 'servicio', 'sistema'));

-- ─────────────────────────────────────────────────────────────
-- 2. Crear tabla ministerio_permisos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ministerio_permisos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  permiso_id    UUID NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ministerio_id, permiso_id)
);

ALTER TABLE public.ministerio_permisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "min_permisos_select_auth" ON public.ministerio_permisos;
DROP POLICY IF EXISTS "min_permisos_insert_auth" ON public.ministerio_permisos;
DROP POLICY IF EXISTS "min_permisos_delete_auth" ON public.ministerio_permisos;

CREATE POLICY "min_permisos_select_auth"
  ON public.ministerio_permisos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "min_permisos_insert_auth"
  ON public.ministerio_permisos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "min_permisos_delete_auth"
  ON public.ministerio_permisos FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_min_permisos_ministerio
  ON public.ministerio_permisos(ministerio_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Insertar los 5 roles técnicos como ministerios de tipo 'sistema'
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.ministerios (nombre, tipo, nivel, nivel_acceso, requiere_acta, activo)
VALUES
  ('admin_general',           'sistema', 'comunidad',       100, FALSE, TRUE),
  ('tecnico_confraternidad',  'sistema', 'confraternidad',   80, FALSE, TRUE),
  ('responsable_fraternidad', 'sistema', 'fraternidad',      60, FALSE, TRUE),
  ('usuario_carga',           'sistema', 'comunidad',        50, FALSE, TRUE),
  ('solo_lectura',            'sistema', 'comunidad',        10, FALSE, TRUE)
ON CONFLICT (nombre) DO UPDATE
  SET tipo         = EXCLUDED.tipo,
      nivel_acceso = EXCLUDED.nivel_acceso,
      activo       = TRUE;

-- ─────────────────────────────────────────────────────────────
-- 4. Migrar rol_permisos → ministerio_permisos
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.ministerio_permisos (ministerio_id, permiso_id)
SELECT m.id, rp.permiso_id
FROM public.rol_permisos rp
JOIN public.roles_sistema rs ON rs.id = rp.rol_sistema_id
JOIN public.ministerios m    ON m.nombre = rs.nombre
WHERE rp.activo = TRUE
ON CONFLICT (ministerio_id, permiso_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. Advertencia: usuario_roles sin persona_id no se pueden migrar
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE v_orphaned INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_orphaned
  FROM public.usuario_roles
  WHERE persona_id IS NULL AND activo = TRUE;
  IF v_orphaned > 0 THEN
    RAISE WARNING '% registros activos en usuario_roles tienen persona_id NULL y NO serán migrados. Resolverlos manualmente.', v_orphaned;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. Migrar usuario_roles → asignaciones_ministerio
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.asignaciones_ministerio
  (persona_id, ministerio_id, organizacion_id, fecha_inicio, fecha_fin, estado)
SELECT
  ur.persona_id,
  m.id,
  ur.organizacion_id,
  ur.fecha_inicio,
  ur.fecha_fin,
  CASE WHEN ur.activo THEN 'activo' ELSE 'inactivo' END
FROM public.usuario_roles ur
JOIN public.roles_sistema rs ON rs.id = ur.rol_sistema_id
JOIN public.ministerios m    ON m.nombre = rs.nombre
WHERE ur.persona_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. Asegurar políticas RLS en ministerios (UPDATE para soft-delete)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ministerios_update_auth" ON public.ministerios;
CREATE POLICY "ministerios_update_auth"
  ON public.ministerios FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ministerios_select_auth" ON public.ministerios;
CREATE POLICY "ministerios_select_auth"
  ON public.ministerios FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- 8. Índices para búsquedas frecuentes en asignaciones_ministerio
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_asig_min_persona_estado
  ON public.asignaciones_ministerio (persona_id, estado);

CREATE INDEX IF NOT EXISTS idx_asig_min_ministerio_estado
  ON public.asignaciones_ministerio (ministerio_id, estado);

COMMIT;
