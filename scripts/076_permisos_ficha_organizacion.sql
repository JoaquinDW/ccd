-- ============================================================
-- MIGRACIÓN 076: Permisos de visibilidad de la ficha de organizaciones
--
-- Contexto (directiva 8/9): en "Confraternidades y Fraternidades > Listado"
-- el usuario común tiene que ver SOLO el nombre de las CONFRATERNIDADES
-- (incluido el nodo agrupador "Fraternidades dependientes del Equipo Timón",
-- que también es tipo='confraternidad'). Nada de código, tipo, relación,
-- localidad, provincia ni acciones.
--
-- Al entrar a una confraternidad tiene que ver únicamente:
--   a) el listado de fraternidades que la componen (clickeables, para entrar
--      a cada fraternidad), y
--   b) abajo, quiénes tienen un rol en esa confraternidad
--      (Responsable, Tesorero, Referente de Dedicados, Referente de Jóvenes…),
--      con NOMBRE y ROL solamente.
--
-- Hasta ahora ese recorte estaba atado a 'organization.update' (permiso de
-- ESCRITURA), lo que mezclaba "poder editar" con "poder ver los datos".
-- Esta migración lo convierte en permisos de LECTURA administrables desde
-- /ministerios/catalogo/[id] y /ministerios/roles/[id], mismo patrón que
-- las migraciones 068, 071, 072 y 073.
--
--   - organizaciones.view_ficha         → ver la ficha completa y el listado completo.
--   - organizaciones.view_roles_detalle → ver las columnas administrativas del
--                                         bloque "Roles" (evento, estado, fechas).
--
-- Ambos son GLOBALES (no scopeados a una confraternidad): el recorte de filas
-- lo sigue haciendo RLS.
--
-- La vista base (nombres de confraternidades → fraternidades → nombre + rol)
-- NO necesita permiso nuevo: sigue alcanzando con 'view.organizaciones'.
-- ============================================================

-- 1. Insertar los permisos en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('organizaciones.view_ficha',
   'Ver ficha completa de organizaciones',
   'Permite ver los datos completos de una confraternidad/fraternidad (código interno, tipo, organización padre, sede y dirección, diócesis, localidad, provincia, país, mail, teléfonos, estado y notas), además del listado con fraternidades, filtros avanzados y ordenamiento. Sin este permiso solo se ven los nombres de las confraternidades, sus fraternidades dependientes y quiénes tienen rol en ellas.',
   'organizaciones'),
  ('organizaciones.view_roles_detalle',
   'Ver detalle de roles de la organización',
   'Permite ver las columnas administrativas del bloque "Roles" en el detalle de una organización (evento, estado de la asignación, fecha de inicio y fecha de fin). Sin este permiso solo se ven Persona y Rol.',
   'organizaciones')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar ambos permisos a admin_general (Equipo Timón / acceso técnico global)
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave IN ('organizaciones.view_ficha', 'organizaciones.view_roles_detalle')
ON CONFLICT DO NOTHING;

-- 3. Backfill: quien HOY puede editar organizaciones ya venía viendo la ficha
--    completa (el recorte estaba atado a 'organization.update'). Se le conservan
--    ambos permisos de lectura para que la migración no le saque información.
--
-- 3a. Roles de sistema con 'organization.update'
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT DISTINCT rp.rol_sistema_id, p.id, true
FROM public.rol_permisos rp
JOIN public.permisos origen ON origen.id = rp.permiso_id
CROSS JOIN public.permisos p
WHERE origen.clave = 'organization.update'
  AND rp.activo = true
  AND p.clave IN ('organizaciones.view_ficha', 'organizaciones.view_roles_detalle')
ON CONFLICT DO NOTHING;

-- 3b. Ministerios con 'organization.update'
INSERT INTO public.ministerio_permisos (ministerio_id, permiso_id)
SELECT DISTINCT mp.ministerio_id, p.id
FROM public.ministerio_permisos mp
JOIN public.permisos origen ON origen.id = mp.permiso_id
CROSS JOIN public.permisos p
WHERE origen.clave = 'organization.update'
  AND p.clave IN ('organizaciones.view_ficha', 'organizaciones.view_roles_detalle')
ON CONFLICT DO NOTHING;
