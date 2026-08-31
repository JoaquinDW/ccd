-- Migration 066: Eliminar (hard delete) los ministerios/roles inactivos
--
-- Contexto: la UI de /ministerios/catalogo solo hace soft-delete (activo=false) y
-- deshabilita el botón de borrar para los que ya están inactivos, así que los roles
-- legacy desactivados por 048 (TIMONEL, RESPONSABLE - CONFRATERNIDAD,
-- ENLACE - FRATERNIDAD, ...) quedan para siempre en el listado. Este script los borra
-- físicamente de la base.
--
-- Reglas de seguridad:
--   1. Solo toca ministerios con activo = FALSE.
--   2. NUNCA borra 'admin_general' (aunque estuviera inactivo).
--   3. Si un ministerio inactivo todavía tiene asignaciones ACTIVAS
--      (asignaciones_ministerio.estado = 'activo') se OMITE y se avisa por NOTICE:
--      borrarlo dejaría personas sin su rol vigente.
--   4. Las asignaciones históricas (estado <> 'activo') de los ministerios borrados
--      se eliminan primero, porque la FK es ON DELETE RESTRICT.
--   5. ministerio_permisos y tipo_evento_roles_solicitantes se limpian solos
--      (ON DELETE CASCADE).
--
-- ATENCIÓN: esto SÍ borra historial (las asignaciones pasadas de esos roles).
-- Es intencional: son roles duplicados/legacy que no deben quedar en el sistema.
-- Idempotente: correrlo dos veces no hace nada la segunda vez.
--
-- ─── Preview (correr ANTES, por separado, para ver qué se va a borrar) ────────
-- SELECT m.nombre, m.codigo_interno, m.tipo,
--        COUNT(*) FILTER (WHERE am.estado = 'activo')  AS asignaciones_activas,
--        COUNT(*) FILTER (WHERE am.estado <> 'activo') AS asignaciones_historicas
-- FROM public.ministerios m
-- LEFT JOIN public.asignaciones_ministerio am ON am.ministerio_id = m.id
-- WHERE m.activo = FALSE AND m.nombre <> 'admin_general'
-- GROUP BY m.id, m.nombre, m.codigo_interno, m.tipo
-- ORDER BY m.nombre;

BEGIN;

DO $$
DECLARE
  v_ids      UUID[];
  v_lista    TEXT;
  v_omitidos TEXT;
  v_asig     INTEGER;
BEGIN
  -- ───────────────────────────────────────────────────────────
  -- 1. Determinar los ministerios a borrar
  -- ───────────────────────────────────────────────────────────
  SELECT array_agg(m.id), string_agg(m.nombre, ', ' ORDER BY m.nombre)
    INTO v_ids, v_lista
  FROM public.ministerios m
  WHERE m.activo = FALSE
    AND m.nombre <> 'admin_general'
    AND NOT EXISTS (
          SELECT 1
          FROM public.asignaciones_ministerio am
          WHERE am.ministerio_id = m.id
            AND am.estado = 'activo'
        );

  -- ───────────────────────────────────────────────────────────
  -- 2. Avisar cuáles se omiten por tener asignaciones activas
  -- ───────────────────────────────────────────────────────────
  SELECT string_agg(m.nombre, ', ' ORDER BY m.nombre) INTO v_omitidos
  FROM public.ministerios m
  WHERE m.activo = FALSE
    AND m.nombre <> 'admin_general'
    AND EXISTS (
          SELECT 1 FROM public.asignaciones_ministerio am
          WHERE am.ministerio_id = m.id AND am.estado = 'activo'
        );

  IF v_omitidos IS NOT NULL THEN
    RAISE NOTICE 'OMITIDOS (tienen asignaciones activas, siguen inactivos pero NO se borran): %', v_omitidos;
  END IF;

  IF v_ids IS NULL THEN
    RAISE NOTICE 'No hay ministerios inactivos para eliminar. Nada que hacer.';
    RETURN;
  END IF;

  -- ───────────────────────────────────────────────────────────
  -- 3. Borrar el historial de asignaciones de esos ministerios
  --    (la FK asignaciones_ministerio.ministerio_id es ON DELETE RESTRICT)
  -- ───────────────────────────────────────────────────────────
  DELETE FROM public.asignaciones_ministerio
  WHERE ministerio_id = ANY (v_ids);
  GET DIAGNOSTICS v_asig = ROW_COUNT;

  -- ───────────────────────────────────────────────────────────
  -- 4. Borrar los ministerios
  --    ministerio_permisos (007) y tipo_evento_roles_solicitantes (033)
  --    caen por ON DELETE CASCADE.
  -- ───────────────────────────────────────────────────────────
  DELETE FROM public.ministerios
  WHERE id = ANY (v_ids);

  RAISE NOTICE 'Ministerios eliminados: % (%). Asignaciones históricas borradas: %',
    array_length(v_ids, 1), v_lista, v_asig;
END $$;

COMMIT;

-- ─── Verificación (correr después del commit) ─────────────────────────────────
-- SELECT nombre, codigo_interno, tipo, activo FROM public.ministerios
--   ORDER BY activo DESC, nombre;
-- Esperado: no queda ninguna fila con activo = FALSE (salvo las omitidas del paso 2).
