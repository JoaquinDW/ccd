-- Migration: Data Model v2.0 — Personas & Organizaciones
-- Run this in Supabase SQL editor after scripts 001-004

-- ============================================================
-- PERSONAS — new columns
-- ============================================================

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS categoria_persona TEXT
    CHECK (categoria_persona IN ('cecista', 'no_cecista')),
  ADD COLUMN IF NOT EXISTS parroquia TEXT,
  ADD COLUMN IF NOT EXISTS socio_asociacion BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS referente_comunidad BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cecista_dedicado BOOLEAN DEFAULT false;

-- ============================================================
-- ORGANIZACIONES — new columns
-- ============================================================

ALTER TABLE organizaciones
  ADD COLUMN IF NOT EXISTS telefono_1 TEXT,
  ADD COLUMN IF NOT EXISTS telefono_2 TEXT;

-- ============================================================
-- NEW TABLE: persona_categoria_no_cecista
-- Subcategorías posibles cuando la persona no es cecista.
-- Una persona puede tener múltiples simultáneamente.
-- ============================================================

CREATE TABLE IF NOT EXISTS persona_categoria_no_cecista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id),
  categoria TEXT NOT NULL CHECK (categoria IN ('voluntario', 'convivente', 'cooperador')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NEW TABLE: persona_organizacion
-- Histórico de pertenencia de personas a fraternidades
-- o confraternidades. Permite registrar mudanzas o cambios.
-- ============================================================

CREATE TABLE IF NOT EXISTS persona_organizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id),
  organizacion_id UUID NOT NULL REFERENCES organizaciones(id),
  tipo_relacion TEXT NOT NULL CHECK (tipo_relacion IN ('confraternidad', 'fraternidad')),
  fecha_inicio DATE,
  fecha_fin DATE,
  motivo_fin TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
