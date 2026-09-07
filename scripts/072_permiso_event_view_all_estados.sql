-- ============================================================
-- MIGRACIÓN 072: Permiso event.view_all_estados
--
-- Contexto: en /eventos, el listado "Eventos Registrados" trae hoy
-- TODOS los estados (borrador, discernimiento, rechazado, etc.) para
-- cualquier usuario logueado. Se pide que el cecista de base solo vea
-- los eventos ya aprobados/publicados (y en curso/finalizados, que son
-- consecuencia de "publicado"), y que los ministerios de conducción
-- sigan viendo todos los estados intermedios SI tienen este atributo.
--
-- Mismo patrón que scripts/071 (view.casas_retiro): esta migración
-- solo crea el permiso en el catálogo. No se lo asigna a ningún
-- ministerio — eso lo decide el Equipo Timón desde
-- /ministerios/catalogo/[id].
-- ============================================================

-- 1. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('event.view_all_estados',
   'Ver eventos en todos los estados',
   'Permite ver en el listado de Eventos los que están en borrador, discernimiento, rechazados o suspendidos. Sin este permiso, el listado solo muestra eventos aprobados, publicados, en curso o finalizados.',
   'eventos')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar a admin_general (acceso técnico global, mismo patrón que el resto del catálogo)
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'event.view_all_estados'
ON CONFLICT DO NOTHING;
