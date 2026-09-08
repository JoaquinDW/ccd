-- ============================================================================
-- 068_dedicacion_votos_como_si.sql
-- Agrega el detalle de "Viviendo como si el/los votos..." a las dedicaciones.
--
-- Contexto: en Configuración → Perfil → Dedicación, quien marca la dedicación
-- 'viviendo_como_dedicado' ahora puede indicar (selección múltiple) cuáles de
-- los votos está viviendo "como si". Los valores son los mismos códigos que
-- usa persona_votos.tipo_voto (ver 039_cecista_perfil.sql):
--   tender_union_dios, caridad_fraterna, irradiacion, castidad, pobreza,
--   obediencia, tender_union_dios_matrimonios, otros_familiares
--
-- Idempotente.
-- ============================================================================

ALTER TABLE public.persona_dedicaciones
  ADD COLUMN IF NOT EXISTS votos_como_si TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.persona_dedicaciones.votos_como_si IS
  'Votos que la persona vive "como si" (solo aplica a tipo = viviendo_como_dedicado). Códigos = persona_votos.tipo_voto.';
