-- ============================================================
-- Migration 070: Ajuste de "Ministerios que ejerce"
-- A pedido de Coti (01/09): dejar solo Eucaristía, Música y Otros.
-- "Escucha" se da de baja lógica (nadie la tenía tildada, ver
-- persona_areas_servicio). "Otros" suma un comentario libre para
-- que la persona aclare cuál.
-- ============================================================

BEGIN;

ALTER TABLE public.persona_areas_servicio
  ADD COLUMN IF NOT EXISTS comentario TEXT;

UPDATE public.areas_servicio
   SET activo = false
 WHERE nombre = 'Escucha';

INSERT INTO public.areas_servicio (nombre) VALUES ('Otros')
ON CONFLICT (nombre) DO UPDATE SET activo = true;

COMMIT;
