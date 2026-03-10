-- Migration: Add estado_eclesial and diocesis to personas
-- Run this in Supabase SQL editor

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS estado_eclesial TEXT NOT NULL DEFAULT 'laico'
    CHECK (estado_eclesial IN ('laico', 'religioso', 'diacono', 'sacerdote', 'obispo', 'cardenal')),
  ADD COLUMN IF NOT EXISTS diocesis TEXT;
