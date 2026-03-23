-- Migration 017: Correcciones de nombres y descripciones de permisos
-- 1. event.create pasa a llamarse "Solicitar eventos" (refleja el workflow real: borrador → solicitado)
-- 2. Mejora descripciones de ministry.assign y roles.assign para dejar claro que son permisos distintos

BEGIN;

UPDATE public.permisos
  SET nombre      = 'Solicitar eventos',
      descripcion = 'Permite crear solicitudes de nuevos eventos (convivencias, retiros, talleres)'
  WHERE clave = 'event.create';

UPDATE public.permisos
  SET descripcion = 'Permite asignar roles en ministerios institucionales a personas'
  WHERE clave = 'ministry.assign';

UPDATE public.permisos
  SET descripcion = 'Permite asignar y revocar acceso técnico al sistema (solo administradores)'
  WHERE clave = 'roles.assign';

COMMIT;
