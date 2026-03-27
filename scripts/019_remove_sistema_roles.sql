-- Migration 019: Eliminar roles de sistema innecesarios
-- Elimina los 4 roles de sistema que no son admin_general.
-- Se eliminan TODAS las asignaciones (activas e históricas) para evitar FK violations.
-- ministerio_permisos se borra por ON DELETE CASCADE.

BEGIN;

-- 1. Eliminar todas las asignaciones (activas e históricas) de estos roles
DELETE FROM public.asignaciones_ministerio
WHERE ministerio_id IN (
  SELECT id FROM public.ministerios
  WHERE tipo = 'sistema'
    AND nombre <> 'admin_general'
);

-- 2. Eliminar los ministerios de tipo sistema (excepto admin_general)
--    ministerio_permisos se elimina por ON DELETE CASCADE
DELETE FROM public.ministerios
WHERE tipo = 'sistema'
  AND nombre <> 'admin_general';

COMMIT;
