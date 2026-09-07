-- ============================================================
-- MIGRACIÓN 073: Permiso view.interesados
--
-- Contexto: "Interesados" (dentro de Eventos) está hoy visible para
-- cualquier usuario logueado, con el listado completo de toda la
-- comunidad. Se pide (Pablo Medina, 30/8) que solo lo vean Enlaces,
-- Responsables, Coordinador y Centralizador "de esa CcD".
--
-- Enlace/Responsable son ministerios institucionales → se resuelven con
-- este permiso de catálogo, igual que scripts/071 y scripts/072. No se
-- asigna a ningún ministerio por defecto — lo decide el Equipo Timón
-- desde /ministerios/catalogo/[id].
--
-- Coordinador/Centralizador son roles scoped a un evento puntual (no un
-- ministerio) — esos se resuelven aparte, en código, comparando
-- persona_id contra eventos.coordinador_asignado_id /
-- centralizador_1/2/3_persona_id (ver lib/eventos/roles.ts). No hace
-- falta un permiso de catálogo para ellos.
-- ============================================================

-- 1. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('view.interesados',
   'Ver Interesados',
   'Permite ver la sección "Interesados" dentro de Eventos, con los interesados de los eventos de la propia organización (confraternidad/fraternidad). Quien es Coordinador o Centralizador de un evento puntual ve los interesados de ese evento sin necesitar este permiso.',
   'eventos')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar a admin_general (acceso técnico global, mismo patrón que el resto del catálogo)
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'view.interesados'
ON CONFLICT DO NOTHING;
