-- ============================================================
-- CcD Platform - Migration 006: persona_id en usuario_roles
-- ============================================================
-- Agrega persona_id a usuario_roles para permitir asignar roles
-- a personas que aún no tienen cuenta de auth (perfiles_usuario).
-- Cuando la persona haga login, el trigger une la cuenta con
-- los roles preexistentes via persona_id.
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- 1. Hacer usuario_id nullable (antes era NOT NULL)
--    Ahora un rol puede estar vinculado por persona_id (sin cuenta)
--    o por usuario_id (con cuenta de auth activa).
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.usuario_roles
  ALTER COLUMN usuario_id DROP NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 2. Agregar columna persona_id
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.usuario_roles
  ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_usuario_roles_persona
  ON public.usuario_roles(persona_id);

-- ──────────────────────────────────────────────────────────────
-- 3. Migrar datos existentes: llenar persona_id desde perfiles_usuario
-- ──────────────────────────────────────────────────────────────

UPDATE public.usuario_roles ur
SET persona_id = pu.persona_id
FROM public.perfiles_usuario pu
WHERE pu.id = ur.usuario_id
  AND ur.persona_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. Trigger: cuando una persona hace login por primera vez
--    (se crea su perfiles_usuario), vincular los roles pre-asignados
--    por persona_id con su nuevo usuario_id
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.vincular_roles_al_hacer_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cuando se crea un perfil de usuario, buscar roles asignados por persona_id
  -- que aún no tienen usuario_id y vincularlos
  UPDATE public.usuario_roles
  SET usuario_id = NEW.id
  WHERE persona_id = NEW.persona_id
    AND usuario_id IS NULL
    AND activo = TRUE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vincular_roles_al_hacer_login ON public.perfiles_usuario;

CREATE TRIGGER trg_vincular_roles_al_hacer_login
  AFTER INSERT ON public.perfiles_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.vincular_roles_al_hacer_login();

-- ──────────────────────────────────────────────────────────────
-- 5. Actualizar RLS: SELECT también permite ver por persona_id
--    (para que el propio usuario vea sus roles preexistentes)
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "usuario_roles_select_own" ON public.usuario_roles;

CREATE POLICY "usuario_roles_select_own"
  ON public.usuario_roles FOR SELECT
  USING (
    auth.uid() = usuario_id
    OR auth.uid() IN (
      SELECT id FROM public.perfiles_usuario WHERE persona_id = usuario_roles.persona_id
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 6. Actualizar el índice parcial de unicidad (migración 005)
--    para incluir persona_id como clave alternativa
-- ──────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS uq_usuario_roles_activo;

-- Un solo rol activo por (persona, rol, org) — independientemente de si tiene cuenta
CREATE UNIQUE INDEX uq_usuario_roles_activo
  ON public.usuario_roles (
    COALESCE(persona_id::text, usuario_id::text),
    rol_sistema_id,
    COALESCE(organizacion_id::text, '00000000-0000-0000-0000-000000000000')
  )
  WHERE activo = TRUE;

COMMIT;
