-- ============================================================
-- MIGRACIÓN 077: Permiso event.view_aprobados
--
-- Contexto: la 072 (event.view_all_estados) dejó como piso visible
-- para cualquier usuario logueado los estados
--   aprobado / publicado / en_curso / finalizado.
--
-- Pero "aprobado" NO es lo mismo que "publicado": un evento aprobado
-- todavía no se comunicó a la comunidad (falta cargar datos para
-- noticias, centralizadores, aprobación final y publicación). No
-- cualquiera debe verlo.
--
-- Esta migración separa ese estado en un permiso propio y
-- administrable desde el CMS (/ministerios/catalogo/[id] y
-- /ministerios/roles/[id]), mismo patrón que 068, 071, 072, 073 y 076.
--
-- Nueva grilla de visibilidad del listado /eventos:
--   sin permisos              → publicado, en_curso, finalizado
--   + event.view_aprobados    → suma aprobado
--   + event.view_all_estados  → todos (incluye aprobado, sin necesidad
--                               del permiso anterior)
-- ============================================================

-- 1. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('event.view_aprobados',
   'Ver eventos aprobados',
   'Permite ver en el listado de Eventos (y contar en el dashboard) los eventos en estado "aprobado", que todavía no fueron publicados a la comunidad. Sin este permiso solo se ven los eventos publicados, en curso y finalizados. Quien tenga "Ver eventos en todos los estados" ya los ve, sin necesidad de este permiso.',
   'eventos')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar a admin_general (Equipo Timón / acceso técnico global)
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'event.view_aprobados'
ON CONFLICT DO NOTHING;

-- 3. Backfill: quien ya tenía 'event.view_all_estados' venía viendo los
--    aprobados. No se le saca nada (además el código lo da por implícito,
--    pero así queda tildado y visible en el CMS).
--
-- 3a. Roles de sistema
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT DISTINCT rp.rol_sistema_id, p.id, true
FROM public.rol_permisos rp
JOIN public.permisos origen ON origen.id = rp.permiso_id
CROSS JOIN public.permisos p
WHERE origen.clave = 'event.view_all_estados'
  AND rp.activo = true
  AND p.clave = 'event.view_aprobados'
ON CONFLICT DO NOTHING;

-- 3b. Ministerios
INSERT INTO public.ministerio_permisos (ministerio_id, permiso_id)
SELECT DISTINCT mp.ministerio_id, p.id
FROM public.ministerio_permisos mp
JOIN public.permisos origen ON origen.id = mp.permiso_id
CROSS JOIN public.permisos p
WHERE origen.clave = 'event.view_all_estados'
  AND p.clave = 'event.view_aprobados'
ON CONFLICT DO NOTHING;
