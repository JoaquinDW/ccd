-- ============================================================
-- CcD Platform - Migration 003: Align Schema to Canonical Data Model
-- Version: 1.0
-- Date: 2026-03-03
-- Description: Migración aditiva. No se eliminan tablas con datos.
--   Agrega columnas faltantes, crea 7 nuevas tablas, corrige
--   valores de CHECK constraints, actualiza trigger de nuevo usuario.
-- ============================================================

BEGIN;

-- ============================================================
-- SECCIÓN 1: ALTER personas — Columnas faltantes
-- ============================================================

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS fecha_alta DATE;

-- Backfill: usar fecha de creación como fecha de alta para registros existentes
UPDATE public.personas
  SET fecha_alta = created_at::DATE
  WHERE fecha_alta IS NULL;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS fecha_baja DATE;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS tipo_documento TEXT
    CHECK (tipo_documento IN ('dni', 'pasaporte', 'cedula', 'otro'));

-- ============================================================
-- SECCIÓN 2: ALTER organizaciones — Jerarquía y campos faltantes
-- ============================================================

ALTER TABLE public.organizaciones
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.organizaciones(id) ON DELETE SET NULL;

ALTER TABLE public.organizaciones
  ADD COLUMN IF NOT EXISTS codigo TEXT;

ALTER TABLE public.organizaciones
  ADD COLUMN IF NOT EXISTS fecha_creacion DATE;

ALTER TABLE public.organizaciones
  ADD COLUMN IF NOT EXISTS fecha_baja DATE;

-- Corregir CHECK de tipo para incluir 'eqt' (mantenemos 'otra' por compatibilidad)
ALTER TABLE public.organizaciones
  DROP CONSTRAINT IF EXISTS organizaciones_tipo_check;

ALTER TABLE public.organizaciones
  ADD CONSTRAINT organizaciones_tipo_check
    CHECK (tipo IN ('comunidad', 'confraternidad', 'fraternidad', 'casa_retiro', 'eqt', 'otra'));

CREATE INDEX IF NOT EXISTS idx_org_parent    ON public.organizaciones(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_fecha_baja ON public.organizaciones(fecha_baja);

-- ============================================================
-- SECCIÓN 3: eventos.tipo — Migrar valores al modelo canónico
-- ============================================================

ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_tipo_check;

UPDATE public.eventos SET tipo = 'convivencia' WHERE tipo = 'CcD';
UPDATE public.eventos SET tipo = 'retiro'      WHERE tipo = 'Retiro';
UPDATE public.eventos SET tipo = 'taller'      WHERE tipo = 'Taller';

ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_tipo_check
    CHECK (tipo IN ('convivencia', 'retiro', 'taller'));

-- ============================================================
-- SECCIÓN 4: eventos.estado — Limpiar estados no canónicos
-- ============================================================

ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_estado_check;

-- 'cerrado' es semánticamente equivalente a 'finalizado'
UPDATE public.eventos SET estado = 'finalizado' WHERE estado = 'cerrado';

-- Mantenemos 'cancelado' como estado operativo válido (fuera del flujo normal)
ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_estado_check
    CHECK (estado IN ('borrador', 'solicitado', 'aprobado', 'publicado', 'finalizado', 'cancelado'));

-- ============================================================
-- SECCIÓN 5: ALTER eventos — Campos faltantes del modelo
-- ============================================================

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS audiencia TEXT DEFAULT 'cerrado'
    CHECK (audiencia IN ('abierto', 'cerrado'));

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'presencial'
    CHECK (modalidad IN ('presencial', 'virtual', 'bimodal'));

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS fecha_solicitud DATE;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS fecha_aprobacion DATE;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES public.personas(id) ON DELETE SET NULL;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS cuota_inscripcion DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS pension DECIMAL(10,2) DEFAULT 0;

-- Nota: se mantiene la columna 'precio' existente para no romper código actual

-- ============================================================
-- SECCIÓN 6: evento_participantes.rol_en_evento — Valores canónicos
-- ============================================================

ALTER TABLE public.evento_participantes
  DROP CONSTRAINT IF EXISTS evento_participantes_rol_en_evento_check;

-- 'eqt' y 'delegado' se mapean a 'equipo_auxiliar' (equivalente canónico más cercano)
UPDATE public.evento_participantes
  SET rol_en_evento = 'equipo_auxiliar'
  WHERE rol_en_evento IN ('eqt', 'delegado');

ALTER TABLE public.evento_participantes
  ADD CONSTRAINT evento_participantes_rol_en_evento_check
    CHECK (rol_en_evento IN ('convivente', 'coordinador', 'asesor', 'centralizador', 'equipo_auxiliar'));

-- ============================================================
-- SECCIÓN 7: CREATE perfiles_usuario
-- Extensión de Supabase Auth — vincula auth.users con personas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id  UUID UNIQUE REFERENCES public.personas(id) ON DELETE SET NULL,
  estado      TEXT NOT NULL DEFAULT 'activo'
                CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfiles_select_own"
  ON public.perfiles_usuario FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "perfiles_insert_own"
  ON public.perfiles_usuario FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles_update_own"
  ON public.perfiles_usuario FOR UPDATE
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_perfiles_persona ON public.perfiles_usuario(persona_id);

CREATE TRIGGER perfiles_usuario_updated_at
  BEFORE UPDATE ON public.perfiles_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Backfill: crear perfil para personas ya vinculadas a auth.users
INSERT INTO public.perfiles_usuario (id, persona_id, estado)
SELECT p.auth_user_id, p.id, 'activo'
FROM public.personas p
WHERE p.auth_user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECCIÓN 8: CREATE roles_sistema
-- Catálogo de roles técnicos del sistema (separado del mixto 'roles')
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles_sistema (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL UNIQUE,
  descripcion   TEXT,
  nivel_acceso  INTEGER NOT NULL DEFAULT 0,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roles_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_sistema_select_auth"
  ON public.roles_sistema FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "roles_sistema_insert_auth"
  ON public.roles_sistema FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "roles_sistema_update_auth"
  ON public.roles_sistema FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Migrar roles de tipo 'sistema' desde la tabla 'roles' (mantiene mismo UUID)
INSERT INTO public.roles_sistema (id, nombre, descripcion, nivel_acceso, activo)
SELECT id, nombre, descripcion, nivel_acceso, TRUE
FROM public.roles
WHERE tipo = 'sistema'
ON CONFLICT (nombre) DO NOTHING;

-- Seed canónico: roles del modelo de datos
INSERT INTO public.roles_sistema (nombre, descripcion, nivel_acceso) VALUES
  ('admin_general',            'Acceso global completo – Equipo Timón',           100),
  ('tecnico_confraternidad',   'Administrador técnico de confraternidad',          80),
  ('responsable_fraternidad',  'Responsable de fraternidad',                       60),
  ('usuario_carga',            'Carga de datos sin acceso administrativo',         50),
  ('solo_lectura',             'Consulta sin modificación',                        10)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- SECCIÓN 9: CREATE usuario_roles
-- Permisos contextuales: usuario + rol_sistema + organización (opcional)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuario_roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES public.perfiles_usuario(id) ON DELETE CASCADE,
  rol_sistema_id  UUID NOT NULL REFERENCES public.roles_sistema(id) ON DELETE CASCADE,
  organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  fecha_inicio    DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin       DATE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, rol_sistema_id, organizacion_id)
);

ALTER TABLE public.usuario_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_roles_select_own"
  ON public.usuario_roles FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "usuario_roles_insert_auth"
  ON public.usuario_roles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "usuario_roles_update_auth"
  ON public.usuario_roles FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario   ON public.usuario_roles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_org       ON public.usuario_roles(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_fecha_fin ON public.usuario_roles(fecha_fin);

-- Migrar desde persona_roles (roles de tipo 'sistema') para usuarios con perfil existente
INSERT INTO public.usuario_roles (usuario_id, rol_sistema_id, organizacion_id, fecha_inicio, fecha_fin, activo)
SELECT
  pu.id,
  rs.id,
  pr.organizacion_id,
  COALESCE(pr.fecha_inicio, CURRENT_DATE),
  pr.fecha_fin,
  CASE WHEN pr.estado = 'activo' THEN TRUE ELSE FALSE END
FROM public.persona_roles pr
JOIN public.personas p ON p.id = pr.persona_id
JOIN public.perfiles_usuario pu ON pu.persona_id = p.id
JOIN public.roles r ON r.id = pr.rol_id AND r.tipo = 'sistema'
JOIN public.roles_sistema rs ON rs.nombre = r.nombre
ON CONFLICT (usuario_id, rol_sistema_id, organizacion_id) DO NOTHING;

-- ============================================================
-- SECCIÓN 10: CREATE persona_modos
-- Histórico de modos de participación institucional
-- ============================================================

CREATE TABLE IF NOT EXISTS public.persona_modos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id    UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  modo          TEXT NOT NULL
                  CHECK (modo IN ('colaborador', 'servidor', 'asesor', 'familiar', 'orante', 'intercesor')),
  fecha_inicio  DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin     DATE,
  estado        TEXT NOT NULL DEFAULT 'activo'
                  CHECK (estado IN ('activo', 'inactivo')),
  motivo_fin    TEXT,
  documento_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.persona_modos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_modos_select_auth"
  ON public.persona_modos FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_modos_insert_auth"
  ON public.persona_modos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "persona_modos_update_auth"
  ON public.persona_modos FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_persona_modos_persona   ON public.persona_modos(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_modos_fecha_fin ON public.persona_modos(fecha_fin);

-- Índice parcial: garantiza solo un modo activo por persona (fecha_fin IS NULL = activo)
CREATE UNIQUE INDEX IF NOT EXISTS uq_persona_modo_activo
  ON public.persona_modos (persona_id)
  WHERE fecha_fin IS NULL;

-- ============================================================
-- SECCIÓN 11: CREATE ministerios
-- Catálogo institucional de ministerios
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ministerios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         TEXT NOT NULL UNIQUE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('conduccion', 'pastoral', 'servicio')),
  nivel          TEXT NOT NULL CHECK (nivel IN ('comunidad', 'confraternidad', 'fraternidad', 'evento')),
  requiere_acta  BOOLEAN NOT NULL DEFAULT FALSE,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ministerios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ministerios_select_auth"
  ON public.ministerios FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ministerios_insert_auth"
  ON public.ministerios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ministerios_update_auth"
  ON public.ministerios FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Seed: catálogo inicial de ministerios canónicos
INSERT INTO public.ministerios (nombre, tipo, nivel, requiere_acta) VALUES
  ('Coordinador de Fraternidad',    'conduccion', 'fraternidad',    TRUE),
  ('Coordinador de Confraternidad', 'conduccion', 'confraternidad', TRUE),
  ('Asesor Espiritual',             'pastoral',   'confraternidad', TRUE),
  ('Responsable de Área',           'pastoral',   'comunidad',      FALSE),
  ('Centralizador',                 'servicio',   'evento',         FALSE)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- SECCIÓN 12: CREATE asignaciones_ministerio
-- Histórico de asignaciones institucionales
-- ============================================================

CREATE TABLE IF NOT EXISTS public.asignaciones_ministerio (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id      UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  ministerio_id   UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE RESTRICT,
  organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE SET NULL,
  evento_id       UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  fecha_inicio    DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin       DATE,
  estado          TEXT NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'inactivo')),
  motivo_fin      TEXT,
  documento_url   TEXT,
  asignado_por    UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.asignaciones_ministerio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asig_min_select_auth"
  ON public.asignaciones_ministerio FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "asig_min_insert_auth"
  ON public.asignaciones_ministerio FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "asig_min_update_auth"
  ON public.asignaciones_ministerio FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_asig_min_persona    ON public.asignaciones_ministerio(persona_id);
CREATE INDEX IF NOT EXISTS idx_asig_min_org        ON public.asignaciones_ministerio(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_asig_min_evento     ON public.asignaciones_ministerio(evento_id);
CREATE INDEX IF NOT EXISTS idx_asig_min_fecha_fin  ON public.asignaciones_ministerio(fecha_fin);

-- ============================================================
-- SECCIÓN 13: CREATE evento_fechas
-- Fechas fragmentadas para eventos multi-jornada
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evento_fechas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id    UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  descripcion  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_evento_fechas_orden CHECK (fecha_fin >= fecha_inicio)
);

ALTER TABLE public.evento_fechas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evento_fechas_select_auth"
  ON public.evento_fechas FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "evento_fechas_insert_auth"
  ON public.evento_fechas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "evento_fechas_update_auth"
  ON public.evento_fechas FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "evento_fechas_delete_auth"
  ON public.evento_fechas FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_evento_fechas_evento ON public.evento_fechas(evento_id);

-- Backfill: crear una fecha por cada evento existente usando sus fechas principales
INSERT INTO public.evento_fechas (evento_id, fecha_inicio, fecha_fin, descripcion)
SELECT id, fecha_inicio, fecha_fin, 'Fecha principal (migrada desde eventos)'
FROM public.eventos
WHERE fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECCIÓN 14: Actualizar trigger handle_new_user
-- Al crear usuario en auth: crea persona + perfil + rol sistema
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id      UUID;
  v_rol_sistema_id  UUID;
  v_rol_legacy_id   UUID;
BEGIN
  -- 1. Crear persona
  INSERT INTO public.personas (auth_user_id, nombre, apellido, email, fecha_alta)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    CURRENT_DATE
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET email = EXCLUDED.email
  RETURNING id INTO v_persona_id;

  IF v_persona_id IS NOT NULL THEN
    -- 2. Crear perfil_usuario
    INSERT INTO public.perfiles_usuario (id, persona_id, estado)
    VALUES (NEW.id, v_persona_id, 'activo')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Asignar rol 'solo_lectura' en usuario_roles (tabla canónica)
    SELECT id INTO v_rol_sistema_id
    FROM public.roles_sistema
    WHERE nombre = 'solo_lectura'
    LIMIT 1;

    IF v_rol_sistema_id IS NOT NULL THEN
      INSERT INTO public.usuario_roles (usuario_id, rol_sistema_id)
      VALUES (NEW.id, v_rol_sistema_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- 4. Compatibilidad retroactiva: también insertar en persona_roles (tabla legacy)
    SELECT id INTO v_rol_legacy_id
    FROM public.roles
    WHERE nombre = 'solo_lectura'
    LIMIT 1;

    IF v_rol_legacy_id IS NOT NULL THEN
      INSERT INTO public.persona_roles (persona_id, rol_id)
      VALUES (v_persona_id, v_rol_legacy_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECCIÓN 15: Documentar tablas deprecadas
-- ============================================================

COMMENT ON TABLE public.roles IS
  'DEPRECATED en migración 003. Usar roles_sistema para roles de tipo sistema, y ministerios para roles funcionales institucionales. Se mantiene para compatibilidad retroactiva durante la transición.';

COMMENT ON TABLE public.persona_roles IS
  'DEPRECATED en migración 003. Usar usuario_roles para permisos técnicos del sistema, y asignaciones_ministerio para asignaciones institucionales. Se mantiene para compatibilidad retroactiva durante la transición.';

-- ============================================================
COMMIT;
-- ============================================================
