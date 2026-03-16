-- Migration 009: Campos faltantes en personas (Mail CcD, dirección_nro, CP, estado_vida, intercesor_dies_natalis)
-- y extensión de persona_categoria_no_cecista con contacto_casa_retiro

BEGIN;

-- ─── 1. Nuevas columnas en personas ───────────────────────────────────────────

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS email_ccd TEXT,
  ADD COLUMN IF NOT EXISTS direccion_nro TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
  ADD COLUMN IF NOT EXISTS estado_vida TEXT
    CHECK (estado_vida IN ('soltero', 'casado', 'viudo', 'separado', 'consagrado')),
  ADD COLUMN IF NOT EXISTS intercesor_dies_natalis DATE;

-- ─── 2. Ampliar persona_categoria_no_cecista con contacto_casa_retiro ─────────

ALTER TABLE public.persona_categoria_no_cecista
  DROP CONSTRAINT IF EXISTS persona_categoria_no_cecista_categoria_check;

ALTER TABLE public.persona_categoria_no_cecista
  ADD CONSTRAINT persona_categoria_no_cecista_categoria_check
    CHECK (categoria IN ('voluntario', 'convivente', 'cooperador', 'contacto_casa_retiro'));

-- ─── 3. RLS en persona_categoria_no_cecista (si no está habilitado) ───────────

ALTER TABLE public.persona_categoria_no_cecista ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_categoria_no_cecista' AND policyname = 'pnc_select_auth') THEN
    CREATE POLICY "pnc_select_auth" ON public.persona_categoria_no_cecista FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_categoria_no_cecista' AND policyname = 'pnc_insert_auth') THEN
    CREATE POLICY "pnc_insert_auth" ON public.persona_categoria_no_cecista FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_categoria_no_cecista' AND policyname = 'pnc_delete_auth') THEN
    CREATE POLICY "pnc_delete_auth" ON public.persona_categoria_no_cecista FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ─── 4. RLS en persona_organizacion (si no está habilitado) ───────────────────

ALTER TABLE public.persona_organizacion ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_organizacion' AND policyname = 'po_select_auth') THEN
    CREATE POLICY "po_select_auth" ON public.persona_organizacion FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_organizacion' AND policyname = 'po_insert_auth') THEN
    CREATE POLICY "po_insert_auth" ON public.persona_organizacion FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_organizacion' AND policyname = 'po_update_auth') THEN
    CREATE POLICY "po_update_auth" ON public.persona_organizacion FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMIT;
