-- Migration 016: Liberar el tipo de ministerio para permitir tipos personalizados
-- El CHECK constraint limita los tipos a los hardcodeados. Al eliminarlo,
-- el campo tipo (TEXT NOT NULL) acepta cualquier valor libre.

BEGIN;

ALTER TABLE public.ministerios
  DROP CONSTRAINT IF EXISTS ministerios_tipo_check;

COMMIT;
