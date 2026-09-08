-- Migration 047: Seed / update Ministerios (Roles de la plataforma)
-- Source: "Ministerios - Listado.csv"
-- Run this in the Supabase SQL editor.
--
-- Behaviour (per request):
--   - Match by `nombre` (UNIQUE). Existing ministerios keep their id and therefore
--     their permissions (ministerio_permisos is NOT touched); only `codigo_interno`
--     and `tipo` are updated, and they are re-activated (activo=TRUE).
--   - Missing ministerios are created.
--   - "Qué puede ver / Qué puede hacer" (permissions) are added manually later.
--
-- Notes:
--   - `codigo_interno` (UNIQUE, added in migration 023) holds the CSV "Código Ministerio".
--   - `tipo` is free text since migration 016 removed its CHECK. CSV values normalized:
--       Conducción->conduccion, Pastoral->pastoral, Servicio->servicio,
--       Usuario->usuario, Tecnico->tecnico.
--   - `nivel` (NOT NULL, CHECK comunidad|confraternidad|fraternidad|evento) is NOT in
--     the CSV. For NEW rows it is inferred from the role's scope (best-guess, review as
--     needed). Existing rows keep their current `nivel` (not overwritten by the upsert).
--   - SIGLAS columns in the CSV are an abbreviation legend, not per-row data → ignored.

BEGIN;

INSERT INTO public.ministerios (nombre, codigo_interno, tipo, nivel, activo)
VALUES
  -- Conducción
  ('Timonel',                                       'TIMON',   'conduccion', 'comunidad',      TRUE),
  ('Responsable de Confraternidad',                 'RCONFRA', 'conduccion', 'confraternidad', TRUE),
  ('Enlace de Fraternidad',                         'EFRATER', 'conduccion', 'fraternidad',    TRUE),
  ('Delegado de Fraternidad Dependiente del EqT',   'DEQT',    'conduccion', 'fraternidad',    TRUE),
  -- Pastoral
  ('Animador de Dedicados y Casas Comunitarias',    'ADEDI',   'pastoral',   'comunidad',      TRUE),
  ('Referente de Dedicados',                        'RDEDI',   'pastoral',   'comunidad',      TRUE),
  ('Animador de Jóvenes',                           'AJOV',    'pastoral',   'comunidad',      TRUE),
  ('Referente de Jóvenes',                          'RJOV',    'pastoral',   'comunidad',      TRUE),
  ('Guía de familiares',                            'GFAM',    'pastoral',   'comunidad',      TRUE),
  ('Formador de Futuros Familiares',                'FFFAM',   'pastoral',   'comunidad',      TRUE),
  ('Secretario de Núcleo de Familiares',            'SECN',    'pastoral',   'comunidad',      TRUE),
  ('Ministerio de Comunicación',                    'MCOM',    'pastoral',   'comunidad',      TRUE),
  ('Tesorero de Confraternidad',                    'TCONFRA', 'pastoral',   'confraternidad', TRUE),
  ('Tesorero de Fraternidad',                       'TFRATER', 'pastoral',   'fraternidad',    TRUE),
  ('Referente - Zona de la fraternidad',            'RFRA',    'pastoral',   'fraternidad',    TRUE),
  ('Alentador de Orantes',                          'ALOR',    'pastoral',   'comunidad',      TRUE),
  ('Titular Casa Comunitaria',                      'TICC',    'pastoral',   'comunidad',      TRUE),
  ('Titular Comisión Revisora',                     'TICR',    'pastoral',   'comunidad',      TRUE),
  -- Servicio
  ('Coordinador',                                   'COOR',    'servicio',   'evento',         TRUE),
  ('Ministerio de Música',                          'MMUSIC',  'servicio',   'evento',         TRUE),
  ('Centralizador',                                 'CENT',    'servicio',   'evento',         TRUE),
  ('Asesor',                                        'ASES',    'servicio',   'evento',         TRUE),
  -- Usuario
  ('Convivente',                                    'CONV',    'usuario',    'comunidad',      TRUE),
  ('Cecista',                                       'CEC',     'usuario',    'comunidad',      TRUE),
  -- Técnico
  -- Renombrado desde 'Administrador Sistema Sede' — ver 075_rename_rol_admin_sistema_sede.sql
  ('Coordinación Administrativa',                   'ADMIN',   'tecnico',    'comunidad',      TRUE),
  ('Secretaria',                                    'SEC',     'tecnico',    'comunidad',      TRUE),
  ('Tesoreria',                                     'TES',     'tecnico',    'comunidad',      TRUE),
  ('Finanzas',                                      'FIN',     'tecnico',    'comunidad',      TRUE),
  ('Coordinación Operativa',                        'COP',     'tecnico',    'comunidad',      TRUE),
  ('Coordinacion Editorial',                        'CEDIT',   'tecnico',    'comunidad',      TRUE)
ON CONFLICT (nombre) DO UPDATE
  SET codigo_interno = EXCLUDED.codigo_interno,
      tipo           = EXCLUDED.tipo,
      activo         = TRUE;
      -- nivel is intentionally NOT updated: existing rows keep their configured scope.

COMMIT;

-- ─── Verification (run separately after commit) ───────────────────────────────
-- SELECT codigo_interno, nombre, tipo, nivel, activo FROM public.ministerios
--   WHERE codigo_interno IS NOT NULL ORDER BY tipo, codigo_interno;
-- SELECT tipo, count(*) FROM public.ministerios WHERE codigo_interno IS NOT NULL GROUP BY tipo;
