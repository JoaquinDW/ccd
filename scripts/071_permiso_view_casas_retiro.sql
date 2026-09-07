-- ============================================================
-- MIGRACIÓN 071: Permiso view.casas_retiro
--
-- Contexto: "Casas de Retiro" está hoy visible en el menú para
-- cualquier usuario logueado, sin importar su rol. Se pide sacarlo de
-- la vista ordinaria y que solo lo vean quienes tengan un rol/ministerio
-- al que se le haya asignado este permiso explícitamente.
--
-- Igual que el resto del catálogo (ver scripts/068 para el mismo
-- patrón): esta migración SOLO crea el permiso. No se lo asigna a
-- ningún ministerio — eso lo decide el Equipo Timón desde
-- /ministerios/catalogo/[id], tildando el permiso en el rol que
-- corresponda (Enlace, Responsable, Coordinador, etc.).
-- ============================================================

-- 1. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('view.casas_retiro',
   'Ver Casas de Retiro',
   'Permite ver la sección "Casas de Retiro" del menú y su listado. Sin este permiso, el módulo queda oculto y la URL redirige al dashboard.',
   'organizaciones')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar a admin_general (acceso técnico global, mismo patrón que el resto del catálogo)
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'view.casas_retiro'
ON CONFLICT DO NOTHING;
