-- ============================================================
-- MIGRACIÓN 069: Solicitudes de corrección de datos bloqueados
--
-- Contexto: en Configuración > Datos Personales hay campos que el propio
-- cecista no puede editar (Nombre/Apellido, y toda la tarjeta "Datos
-- institucionales": Categoría, Estado, Modo de participación, Usuario,
-- Código Interno, Mail CcD, Confraternidad, Fraternidad). Si alguno está
-- mal cargado, no había forma de avisarlo desde la plataforma. Esta tabla
-- guarda esas solicitudes (con historial, nunca se borran) para que el
-- Equipo Timón las revise y marque como resueltas desde /admin.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.solicitudes_correccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  campo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'resuelta')),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_resolucion TIMESTAMPTZ,
  resuelto_por UUID REFERENCES auth.users(id),
  respuesta TEXT
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_correccion_estado ON public.solicitudes_correccion(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_correccion_persona ON public.solicitudes_correccion(persona_id);

ALTER TABLE public.solicitudes_correccion ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado con perfil puede crear su propia solicitud
CREATE POLICY "solicitudes_correccion_insert_own"
  ON public.solicitudes_correccion FOR INSERT
  WITH CHECK (
    auth.uid() = creado_por
    AND persona_id IN (SELECT persona_id FROM public.perfiles_usuario WHERE id = auth.uid())
  );

-- El propio usuario ve sus solicitudes; admin_general ve todas
CREATE POLICY "solicitudes_correccion_select"
  ON public.solicitudes_correccion FOR SELECT
  USING (
    persona_id IN (SELECT persona_id FROM public.perfiles_usuario WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.usuario_roles ur
      JOIN public.roles_sistema rs ON rs.id = ur.rol_sistema_id
      WHERE ur.usuario_id = auth.uid() AND ur.activo = true AND rs.nombre = 'admin_general'
        AND (ur.fecha_fin IS NULL OR ur.fecha_fin > now())
    )
  );

-- Solo admin_general puede marcarla como resuelta
CREATE POLICY "solicitudes_correccion_update_admin"
  ON public.solicitudes_correccion FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuario_roles ur
      JOIN public.roles_sistema rs ON rs.id = ur.rol_sistema_id
      WHERE ur.usuario_id = auth.uid() AND ur.activo = true AND rs.nombre = 'admin_general'
        AND (ur.fecha_fin IS NULL OR ur.fecha_fin > now())
    )
  );

COMMIT;
