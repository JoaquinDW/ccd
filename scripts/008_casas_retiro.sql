-- Migration 008: Tabla dedicada para Casas de Retiro
-- Crea casas_retiro y casa_retiro_organizaciones (many-to-many con organizaciones cercanas)

BEGIN;

-- ─── 1. Tabla principal ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.casas_retiro (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  nombre               TEXT NOT NULL,
  codigo_interno       TEXT,
  tipo_propiedad       TEXT NOT NULL DEFAULT 'terceros'
                         CHECK (tipo_propiedad IN ('propia', 'terceros')),
  estado               TEXT NOT NULL DEFAULT 'activa'
                         CHECK (estado IN ('activa', 'inactiva')),

  -- Contacto
  contacto_persona_id  UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  telefono             TEXT,
  mail                 TEXT,

  -- Dirección
  direccion_calle      TEXT,
  direccion_nro        TEXT,
  ciudad               TEXT,
  cp                   TEXT,
  diocesis             TEXT,
  provincia            TEXT,
  pais                 TEXT DEFAULT 'Argentina',

  -- Capacidad
  aforo                INTEGER,

  -- Amenities
  estacionamiento      BOOLEAN NOT NULL DEFAULT FALSE,
  rampa_discapacitados BOOLEAN NOT NULL DEFAULT FALSE,
  capilla              BOOLEAN NOT NULL DEFAULT FALSE,
  comedor_amplio       BOOLEAN NOT NULL DEFAULT FALSE,
  salon                BOOLEAN NOT NULL DEFAULT FALSE,
  banos_en_habit       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Habitaciones
  cant_hab_x2          INTEGER DEFAULT 0,
  cant_hab_x3          INTEGER DEFAULT 0,
  cant_hab_x4          INTEGER DEFAULT 0,
  cant_banos           INTEGER DEFAULT 0,

  -- Otros
  notas                TEXT,
  fecha_baja           DATE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.casas_retiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casas_retiro_select_auth"
  ON public.casas_retiro FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "casas_retiro_insert_auth"
  ON public.casas_retiro FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "casas_retiro_update_auth"
  ON public.casas_retiro FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX IF NOT EXISTS idx_casas_retiro_estado
  ON public.casas_retiro(estado);
CREATE INDEX IF NOT EXISTS idx_casas_retiro_provincia
  ON public.casas_retiro(provincia);
CREATE INDEX IF NOT EXISTS idx_casas_retiro_fecha_baja
  ON public.casas_retiro(fecha_baja);

-- Trigger updated_at (reutiliza la función existente)
CREATE TRIGGER casas_retiro_updated_at
  BEFORE UPDATE ON public.casas_retiro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ─── 2. Tabla junction: organizaciones cercanas ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.casa_retiro_organizaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casa_retiro_id  UUID NOT NULL REFERENCES public.casas_retiro(id) ON DELETE CASCADE,
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (casa_retiro_id, organizacion_id)
);

-- RLS
ALTER TABLE public.casa_retiro_organizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cro_select_auth"
  ON public.casa_retiro_organizaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cro_insert_auth"
  ON public.casa_retiro_organizaciones FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cro_delete_auth"
  ON public.casa_retiro_organizaciones FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cro_casa
  ON public.casa_retiro_organizaciones(casa_retiro_id);
CREATE INDEX IF NOT EXISTS idx_cro_org
  ON public.casa_retiro_organizaciones(organizacion_id);

COMMIT;
