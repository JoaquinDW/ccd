-- Migration: Add address and contact fields to organizaciones
-- Run this in Supabase SQL editor

ALTER TABLE public.organizaciones
  ADD COLUMN IF NOT EXISTS mail_org        TEXT,
  ADD COLUMN IF NOT EXISTS sede_fisica     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS direccion_calle TEXT,
  ADD COLUMN IF NOT EXISTS direccion_nro   TEXT,
  ADD COLUMN IF NOT EXISTS ciudad          TEXT,
  ADD COLUMN IF NOT EXISTS cp              TEXT,
  ADD COLUMN IF NOT EXISTS diocesis        TEXT;
