-- ============================================================
-- Migration 079: Apodo / sobrenombre de la persona
-- Campo opcional, autodeclarable en Configuración → Perfil y
-- editable por administración en la ficha de la persona. Se
-- muestra entre paréntesis junto al nombre y apellido en listados,
-- fichas y buscadores.
-- ============================================================

BEGIN;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS apodo TEXT;

COMMIT;
