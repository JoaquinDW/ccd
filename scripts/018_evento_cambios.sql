-- Migration 018: Historial de cambios durante discernimiento
-- Registra los campos modificados por aprobadores en cada nivel de discernimiento.

BEGIN;

CREATE TABLE IF NOT EXISTS public.evento_cambios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id      UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nivel_disc     TEXT NOT NULL CHECK (nivel_disc IN ('confra', 'eqt')),
  campo          TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo    TEXT,
  modificado_por UUID REFERENCES public.personas(id),
  fecha          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.evento_cambios ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read change history
CREATE POLICY "evento_cambios_select_auth"
  ON public.evento_cambios FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Any authenticated user can insert (API route enforces tighter permission checks)
CREATE POLICY "evento_cambios_insert_auth"
  ON public.evento_cambios FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE/DELETE policies: historial es inmutable

CREATE INDEX IF NOT EXISTS idx_evento_cambios_evento ON public.evento_cambios(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_cambios_fecha  ON public.evento_cambios(fecha);

COMMIT;
