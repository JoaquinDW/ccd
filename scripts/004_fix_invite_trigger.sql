-- ============================================================
-- CcD Platform - Migration 004: Fix handle_new_user for invitations
-- Problem: when inviting a persona that already exists in personas
--   by email, the trigger fails with UNIQUE constraint on email.
-- Solution: check if email already exists in personas and link
--   that existing persona instead of creating a new one.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id      UUID;
  v_rol_sistema_id  UUID;
  v_rol_legacy_id   UUID;
BEGIN
  -- Check if the invite carried a persona_id in metadata
  v_persona_id := (NEW.raw_user_meta_data ->> 'persona_id')::UUID;

  IF v_persona_id IS NOT NULL THEN
    -- Persona already exists — just link auth_user_id
    UPDATE public.personas
      SET auth_user_id = NEW.id,
          email        = COALESCE(email, NEW.email)
    WHERE id = v_persona_id;
  ELSE
    -- Try to find an existing persona by email first
    SELECT id INTO v_persona_id
    FROM public.personas
    WHERE email = NEW.email
    LIMIT 1;

    IF v_persona_id IS NOT NULL THEN
      -- Link this auth user to the existing persona
      UPDATE public.personas
        SET auth_user_id = NEW.id
      WHERE id = v_persona_id;
    ELSE
      -- No existing persona — create a new one
      INSERT INTO public.personas (auth_user_id, nombre, apellido, email, fecha_alta)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
        NEW.email,
        CURRENT_DATE
      )
      ON CONFLICT (email) DO UPDATE
        SET auth_user_id = EXCLUDED.auth_user_id
      RETURNING id INTO v_persona_id;
    END IF;
  END IF;

  IF v_persona_id IS NOT NULL THEN
    -- Create perfil_usuario
    INSERT INTO public.perfiles_usuario (id, persona_id, estado)
    VALUES (NEW.id, v_persona_id, 'activo')
    ON CONFLICT (id) DO NOTHING;

    -- Assign 'solo_lectura' role in usuario_roles
    SELECT id INTO v_rol_sistema_id
    FROM public.roles_sistema
    WHERE nombre = 'solo_lectura'
    LIMIT 1;

    IF v_rol_sistema_id IS NOT NULL THEN
      INSERT INTO public.usuario_roles (usuario_id, rol_sistema_id)
      VALUES (NEW.id, v_rol_sistema_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Legacy compatibility: also insert in persona_roles
    SELECT id INTO v_rol_legacy_id
    FROM public.roles
    WHERE nombre = 'solo_lectura'
    LIMIT 1;

    IF v_rol_legacy_id IS NOT NULL THEN
      INSERT INTO public.persona_roles (persona_id, rol_id)
      VALUES (v_persona_id, v_rol_legacy_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
