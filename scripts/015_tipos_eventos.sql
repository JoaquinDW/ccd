-- Migration: Create tipos_eventos table and link to eventos
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.tipos_eventos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT NOT NULL,
  categoria   TEXT NOT NULL CHECK (categoria IN ('convivencia', 'retiro', 'taller', 'otro')),
  alcance     TEXT NOT NULL DEFAULT 'interno' CHECK (alcance IN ('interno', 'abierto')),
  requiere_discernimiento_confra  BOOLEAN NOT NULL DEFAULT FALSE,
  requiere_discernimiento_eqt     BOOLEAN NOT NULL DEFAULT FALSE,
  requisitos  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK column to eventos (keep existing tipo column for compatibility)
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS tipo_evento_id UUID REFERENCES public.tipos_eventos(id);

-- Seed initial types matching existing historical values
INSERT INTO public.tipos_eventos (nombre, categoria, alcance)
VALUES
  ('Convivencia con Dios', 'convivencia', 'interno'),
  ('Retiro', 'retiro', 'interno'),
  ('Taller', 'taller', 'interno')
ON CONFLICT DO NOTHING;
