-- ============================================================================
-- 075_rename_rol_admin_sistema_sede.sql
-- Renombra el rol "Administrador Sistema Sede" → "Coordinación Administrativa"
-- (Roles de la Plataforma → Listado de roles, /ministerios/catalogo).
--
-- Solo cambia el nombre visible: se conserva el id, el codigo_interno ('ADMIN'),
-- los permisos (ministerio_permisos) y las asignaciones (asignaciones_ministerio).
--
-- Idempotente y seguro ante el UNIQUE de ministerios.nombre: si ya existe una
-- fila llamada "Coordinación Administrativa" no hace nada.
-- ============================================================================

BEGIN;

UPDATE public.ministerios m
   SET nombre = 'Coordinación Administrativa'
 WHERE (m.codigo_interno = 'ADMIN' OR m.nombre = 'Administrador Sistema Sede')
   AND m.nombre <> 'Coordinación Administrativa'
   AND NOT EXISTS (
     SELECT 1 FROM public.ministerios x
      WHERE x.nombre = 'Coordinación Administrativa'
        AND x.id <> m.id
   );

COMMIT;

-- ─── Verificación (correr aparte) ────────────────────────────────────────────
-- SELECT id, codigo_interno, nombre, tipo, nivel, activo
--   FROM public.ministerios WHERE codigo_interno = 'ADMIN';
