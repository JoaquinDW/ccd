-- ============================================================
-- MIGRACIÓN 066: Becas en pensiones
--
-- Permite registrar, por participante de evento, un valor de inscripción
-- y de pensión propios (por si difieren del precio general del evento) y
-- una beca de pensión en pesos (no %) que reduce el saldo a pagar.
--
-- valor_inscripcion / valor_pension son NULLABLE: si no se cargan
-- explícitamente, la UI usa como fallback eventos.cuota_inscripcion /
-- eventos.pension. Se eligió NULLABLE-con-fallback en vez de copiar el
-- valor del evento en el INSERT porque evento_participantes se crea desde
-- múltiples puntos (inscripciones/nueva, api/public/interes,
-- retiros/[id]/inscripcion, altas admin) y forzar un default/trigger en
-- todos ellos es más invasivo que resolver el fallback en un solo lugar
-- (lib/eventos/pension.ts) al leer.
-- ============================================================

BEGIN;

ALTER TABLE public.evento_participantes
  ADD COLUMN IF NOT EXISTS valor_inscripcion DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS valor_pension DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS beca_pension DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notas_beca TEXT;

ALTER TABLE public.evento_participantes
  ADD CONSTRAINT evento_participantes_valor_inscripcion_check CHECK (valor_inscripcion IS NULL OR valor_inscripcion >= 0),
  ADD CONSTRAINT evento_participantes_valor_pension_check CHECK (valor_pension IS NULL OR valor_pension >= 0),
  ADD CONSTRAINT evento_participantes_beca_pension_check CHECK (beca_pension >= 0);

COMMIT;
