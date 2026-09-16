-- Migration 078: fecha_solicitud de eventos pasa a ser automática e inmutable
--
-- Contexto: hoy se podía solicitar una convivencia y declarar una fecha de
-- solicitud pasada (ej. "hace 5 días"), porque el input quedaba editable en
-- los formularios y la API confiaba en el valor mandado por el cliente. La
-- fecha de solicitud debe reflejar cuándo se hizo la solicitud realmente.
--
-- Este trigger fuerza, a nivel de base de datos (la última línea de defensa,
-- ya que /eventos/[id]/editar escribe directo a Supabase sin pasar por una
-- API route):
--   1. En INSERT: si el evento nace en estado 'solicitud', fecha_solicitud
--      siempre es CURRENT_DATE (se ignora cualquier valor recibido).
--   2. En UPDATE: fecha_solicitud no puede cambiar respecto al valor ya
--      guardado (se reescribe silenciosamente con el valor anterior).

BEGIN;

CREATE OR REPLACE FUNCTION public.fijar_fecha_solicitud_evento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.estado = 'solicitud' THEN
      NEW.fecha_solicitud := CURRENT_DATE;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.fecha_solicitud := OLD.fecha_solicitud;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fijar_fecha_solicitud_evento ON public.eventos;

CREATE TRIGGER trg_fijar_fecha_solicitud_evento
  BEFORE INSERT OR UPDATE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.fijar_fecha_solicitud_evento();

COMMIT;
