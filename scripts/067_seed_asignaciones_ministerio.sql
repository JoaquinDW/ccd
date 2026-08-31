-- Migration 067: Asignación masiva de ministerios (conducción y pastorales)
-- Source: "Ministerios y Personas - Personas-Ministerios.csv"
-- GENERADO por scratchpad/gen_asignaciones_ministerio.py — no editar a mano.
-- Depends on: 043 (organizaciones.codigo), 047 (ministerios.codigo_interno),
--             050 + 054 (personas.codigo_interno con formato CCD-#####),
--             023 (ministerios.codigo_interno), 010 (asignaciones_ministerio.notas).
-- Run this in the Supabase SQL editor. (Si aparece el aviso de RLS por la tabla
-- temporal _stg_asig -> "Run without RLS": es de sesión y se descarta en COMMIT.)
--
-- Comportamiento (acordado con el usuario):
--   * ADITIVO: solo inserta las asignaciones que hoy NO existen. NO cierra ni
--     revoca ninguna asignación vigente (patrón NOT EXISTS de 057).
--   * El rol base "Cecista" (057) se deja intacto: los permisos son la unión de
--     todas las asignaciones activas, así que convivir con CEC no resta nada.
--   * Join por códigos de negocio, nunca por UUID:
--       personas       <- codigo_interno (CCD-#####)   [validado 199/199 contra 054]
--       ministerios    <- codigo_interno               [los 10 existen en 047]
--       organizaciones <- codigo                       [los 77 mapean a 043]
--   * Re-ejecutable: una segunda corrida inserta 0 filas.
--
-- Normalizaciones aplicadas a la planilla:
--   * "Estado" mal tipeado (Activvo / Actiivo / Ativo / Acivo / "Activo ") -> todas
--     las filas del CSV son altas vigentes, así que se cargan con estado='activo'.
--   * Fecha "14/04/0204" (marcelomassaini) -> 2024-04-14.
--   * "Desde el" vacío -> fecha_inicio = CURRENT_DATE (5 filas).
--   * "Hasta el" trae solo el año del mandato ("2028") -> fecha_fin = 2028-12-31.
--   * Celdas con dos organizaciones separadas por coma (yamilaflores,
--     edgarpajuelorios) -> se expanden a una asignación por organización.
--   * Los nombres de organización del CSV agregan el país entre paréntesis
--     ("Fraternidad Chicago (Estados Unidos)") — por eso el mapeo a `codigo`.
--   * Filas sin "Código de Cecista" resueltas por nombre_usuario contra 054:
--     mariagabrielarossi -> CCD-00624, mariaveronicafolmer -> CCD-00999.
--
-- Filas OMITIDAS (no hay forma de resolverlas):
--   * ricardovaldivialaos (CCD-01936): código inexistente en el padrón (054)
--   * (sin usuario) (-): sin Código de Cecista y sin match por nombre_usuario
--   * ilkagonzales (-): sin Código de Cecista y sin match por nombre_usuario
--   * angelasanchezsilva (CCD-01935): sin ministerio en la planilla
--
-- Nota: en 10 asignaciones el `nivel` del ministerio (047) no coincide con el
-- `tipo` de la organización, y es correcto — así lo declara la planilla:
--   * ADEDI (3), AJOV (2), GFAM (1), FFFAM (1) son nivel='comunidad' pero se
--     asignan a una fraternidad concreta.
--   * 3 Enlaces de Fraternidad apuntan a FRAT-DEQT ("Fraternidades dependientes
--     del Equipo Timón"), que 043 modela como nodo agrupador de nivel confraternidad.
-- Nada en la DB fuerza esa correspondencia; queda documentado para que no se lea
-- como un error más adelante.
--
-- Total: 199 asignaciones sobre 191 personas.
-- Reparto por ministerio: EFRATER 131 · RCONFRA 40 · DEQT 16 · TIMON 3 · ADEDI 3 · AJOV 2 · GFAM 1 · FFFAM 1 · CEDIT 1 · TICR 1.

BEGIN;

-- ─── 1. Staging con los códigos de negocio ────────────────────────────────────

CREATE TEMP TABLE _stg_asig (
  codigo_interno TEXT NOT NULL,
  ministerio_cod TEXT NOT NULL,
  org_cod        TEXT NOT NULL,
  fecha_inicio   DATE,
  fecha_fin      DATE
) ON COMMIT DROP;

INSERT INTO _stg_asig (codigo_interno, ministerio_cod, org_cod, fecha_inicio, fecha_fin) VALUES
  ('CCD-00003','TIMON','EQT','2025-08-14','2028-12-31'),
  ('CCD-00018','TIMON','EQT','2025-08-14','2028-12-31'),
  ('CCD-00513','TIMON','EQT','2025-08-14','2028-12-31'),
  ('CCD-00142','RCONFRA','CONF-BSAS','2024-04-13',NULL),
  ('CCD-00036','RCONFRA','CONF-BSAS','2024-04-13',NULL),
  ('CCD-00007','RCONFRA','CONF-BSAS','2024-04-13',NULL),
  ('CCD-00012','EFRATER','FRAT-DN','2024-04-14',NULL),
  ('CCD-00004','EFRATER','FRAT-DN','2024-04-14',NULL),
  ('CCD-00016','EFRATER','FRAT-JER','2024-04-14',NULL),
  ('CCD-00022','EFRATER','FRAT-JER','2026-03-12',NULL),
  ('CCD-00037','EFRATER','FRAT-JER','2026-03-12',NULL),
  ('CCD-00085','EFRATER','FRAT-JBP','2024-04-14',NULL),
  ('CCD-00076','EFRATER','FRAT-JBP','2024-04-14',NULL),
  ('CCD-00096','EFRATER','FRAT-MES','2024-04-14',NULL),
  ('CCD-00108','EFRATER','FRAT-MES','2024-04-14',NULL),
  ('CCD-00105','EFRATER','FRAT-MES','2024-04-14',NULL),
  ('CCD-00147','EFRATER','FRAT-SC','2024-04-14',NULL),
  ('CCD-00139','EFRATER','FRAT-SC','2024-04-14',NULL),
  ('CCD-01168','RCONFRA','CONF-SHE','2025-03-29',NULL),
  ('CCD-01187','RCONFRA','CONF-SHE','2025-03-29',NULL),
  ('CCD-01185','RCONFRA','CONF-SHE','2025-03-29',NULL),
  ('CCD-01182','EFRATER','FRAT-MAS','2025-03-29',NULL),
  ('CCD-01184','EFRATER','FRAT-MAS','2025-03-29',NULL),
  ('CCD-01175','EFRATER','FRAT-JUD','2025-03-29',NULL),
  ('CCD-01173','EFRATER','FRAT-JUD','2025-03-29',NULL),
  ('CCD-01400','RCONFRA','CONF-CB','2024-04-27',NULL),
  ('CCD-01276','RCONFRA','CONF-CB','2024-04-27',NULL),
  ('CCD-01281','RCONFRA','CONF-CB','2024-04-27',NULL),
  ('CCD-01349','EFRATER','FRAT-CORD','2024-04-27',NULL),
  ('CCD-01339','EFRATER','FRAT-CORD','2024-04-27',NULL),
  ('CCD-01266','EFRATER','FRAT-DFUN','2024-08-10',NULL),
  ('CCD-01291','EFRATER','FRAT-RIV','2024-04-27',NULL),
  ('CCD-01288','EFRATER','FRAT-RIV','2024-04-27',NULL),
  ('CCD-01402','EFRATER','FRAT-CRED','2024-04-27',NULL),
  ('CCD-01405','EFRATER','FRAT-CRED','2024-04-27',NULL),
  ('CCD-00405','RCONFRA','CONF-MAUX','2024-09-21',NULL),
  ('CCD-00431','RCONFRA','CONF-MAUX','2024-09-21',NULL),
  ('CCD-00426','RCONFRA','CONF-MAUX','2024-09-21',NULL),
  ('CCD-00430','EFRATER','FRAT-JPII','2026-04-17',NULL),
  ('CCD-00429','EFRATER','FRAT-JPII','2026-04-17',NULL),
  ('CCD-00440','EFRATER','FRAT-JPII','2026-04-17',NULL),
  ('CCD-00440','EFRATER','FRAT-LVIC','2026-04-17',NULL),
  ('CCD-00410','EFRATER','FRAT-LVIC','2024-09-21',NULL),
  ('CCD-00411','EFRATER','FRAT-LVIC','2024-09-21',NULL),
  ('CCD-00407','EFRATER','FRAT-LVIC','2024-09-21',NULL),
  ('CCD-00481','RCONFRA','CONF-MIS','2026-02-28',NULL),
  ('CCD-00445','RCONFRA','CONF-MIS','2026-02-28',NULL),
  ('CCD-00543','RCONFRA','CONF-MIS','2026-02-28',NULL),
  ('CCD-00450','EFRATER','FRAT-APO','2024-07-07',NULL),
  ('CCD-00446','EFRATER','FRAT-APO','2025-05-07',NULL),
  ('CCD-00483','EFRATER','FRAT-IGU','2026-05-09',NULL),
  ('CCD-00482','EFRATER','FRAT-IGU','2026-05-09',NULL),
  ('CCD-00571','EFRATER','FRAT-SJOS','2026-04-21',NULL),
  ('CCD-00566','EFRATER','FRAT-SJOS','2026-04-21',NULL),
  ('CCD-00584','EFRATER','FRAT-SJOS','2026-04-21',NULL),
  ('CCD-00517','EFRATER','FRAT-MPAD','2024-10-12',NULL),
  ('CCD-00507','EFRATER','FRAT-MPAD','2024-10-12',NULL),
  ('CCD-00547','EFRATER','FRAT-OBE','2026-03-21',NULL),
  ('CCD-00544','EFRATER','FRAT-OBE','2026-03-21',NULL),
  ('CCD-00831','RCONFRA','CONF-SDD','2024-04-13',NULL),
  ('CCD-00856','RCONFRA','CONF-SDD','2024-04-13',NULL),
  ('CCD-00896','RCONFRA','CONF-SDD','2024-04-13',NULL),
  ('CCD-00906','EFRATER','FRAT-FOR','2024-07-06',NULL),
  ('CCD-00906','EFRATER','FRAT-CTES','2024-07-06',NULL),
  ('CCD-00908','EFRATER','FRAT-FOR','2024-07-06',NULL),
  ('CCD-00824','EFRATER','FRAT-CTES','2024-05-25',NULL),
  ('CCD-00830','EFRATER','FRAT-CTES','2024-05-25',NULL),
  ('CCD-01546','EFRATER','FRAT-GOY','2026-04-11',NULL),
  ('CCD-01551','EFRATER','FRAT-GOY','2026-04-11',NULL),
  ('CCD-00207','RCONFRA','CONF-CSFN','2024-03-22',NULL),
  ('CCD-00209','RCONFRA','CONF-CSFN','2024-03-22',NULL),
  ('CCD-00214','RCONFRA','CONF-CSFN','2024-03-22',NULL),
  ('CCD-00227','EFRATER','FRAT-JMIS','2026-04-11',NULL),
  ('CCD-00225','EFRATER','FRAT-JMIS','2026-04-11',NULL),
  ('CCD-00275','EFRATER','FRAT-RCIA','2024-03-22',NULL),
  ('CCD-00279','EFRATER','FRAT-RCIA','2024-03-22',NULL),
  ('CCD-00285','EFRATER','FRAT-RCIA','2024-03-22',NULL),
  ('CCD-00215','EFRATER','FRAT-BQRAS','2026-03-08',NULL),
  ('CCD-00220','EFRATER','FRAT-BQRAS','2026-03-08',NULL),
  ('CCD-00218','EFRATER','FRAT-BQRAS','2026-03-08',NULL),
  ('CCD-00250','EFRATER','FRAT-VNIN','2024-03-22',NULL),
  ('CCD-00247','EFRATER','FRAT-VNIN','2024-03-22',NULL),
  ('CCD-00357','RCONFRA','CONF-NOA','2025-11-14',NULL),
  ('CCD-00295','RCONFRA','CONF-NOA','2025-11-14',NULL),
  ('CCD-00354','RCONFRA','CONF-NOA','2025-11-14',NULL),
  ('CCD-00291','EFRATER','FRAT-JUJ','2025-11-14',NULL),
  ('CCD-01544','EFRATER','FRAT-JUJ','2025-11-14',NULL),
  ('CCD-00360','EFRATER','FRAT-TUC','2025-11-14',NULL),
  ('CCD-00363','EFRATER','FRAT-TUC','2025-11-14',NULL),
  ('CCD-00329','EFRATER','FRAT-SAL','2025-11-14',NULL),
  ('CCD-00320','EFRATER','FRAT-SAL','2025-11-14',NULL),
  ('CCD-00775','RCONFRA','CONF-NSDR','2024-04-06',NULL),
  ('CCD-00692','RCONFRA','CONF-NSDR','2024-04-06',NULL),
  ('CCD-00792','RCONFRA','CONF-NSDR','2024-04-06',NULL),
  ('CCD-00632','EFRATER','FRAT-MDP','2024-04-07',NULL),
  ('CCD-00628','EFRATER','FRAT-MDP','2024-04-07',NULL),
  ('CCD-00624','EFRATER','FRAT-MDP','2024-04-07',NULL),
  ('CCD-00661','EFRATER','FRAT-NSC','2024-04-07',NULL),
  ('CCD-00665','EFRATER','FRAT-NSC','2024-04-07',NULL),
  ('CCD-00649','EFRATER','FRAT-NSC','2024-04-07',NULL),
  ('CCD-00694','EFRATER','FRAT-ROS','2024-04-07',NULL),
  ('CCD-00697','EFRATER','FRAT-ROS','2024-04-07',NULL),
  ('CCD-00726','EFRATER','FRAT-ROS','2024-04-07',NULL),
  ('CCD-00776','EFRATER','FRAT-RSTA','2024-04-07',NULL),
  ('CCD-00782','EFRATER','FRAT-RSTA','2024-04-07',NULL),
  ('CCD-00791','EFRATER','FRAT-SLZO','2024-04-07',NULL),
  ('CCD-00797','EFRATER','FRAT-SLZO','2024-04-07',NULL),
  ('CCD-01199','RCONFRA','CONF-PAT','2025-03-29',NULL),
  ('CCD-01193','RCONFRA','CONF-PAT','2025-03-29',NULL),
  ('CCD-01222','RCONFRA','CONF-PAT','2025-03-29',NULL),
  ('CCD-01190','EFRATER','FRAT-CRIV','2025-03-29',NULL),
  ('CCD-01200','EFRATER','FRAT-CRIV','2025-03-29',NULL),
  ('CCD-01194','EFRATER','FRAT-CRIV','2025-03-29',NULL),
  ('CCD-01228','EFRATER','FRAT-ESQ',NULL,NULL),
  ('CCD-01055','RCONFRA','CONF-PDA','2024-05-18',NULL),
  ('CCD-01257','RCONFRA','CONF-PDA','2024-05-18',NULL),
  ('CCD-00961','RCONFRA','CONF-PDA','2024-05-18',NULL),
  ('CCD-00999','RCONFRA','CONF-PDA','2024-05-18',NULL),
  ('CCD-00962','EFRATER','FRAT-CON','2024-05-19',NULL),
  ('CCD-00843','EFRATER','FRAT-CON','2024-05-19',NULL),
  ('CCD-01057','EFRATER','FRAT-LPAZ','2024-05-19',NULL),
  ('CCD-01049','EFRATER','FRAT-LPAZ','2024-05-19',NULL),
  ('CCD-01058','EFRATER','FRAT-LPAZ','2024-05-19',NULL),
  ('CCD-00997','EFRATER','FRAT-PAR','2024-05-19',NULL),
  ('CCD-01005','EFRATER','FRAT-PAR','2024-05-19',NULL),
  ('CCD-00984','EFRATER','FRAT-FDD','2024-05-19',NULL),
  ('CCD-00982','EFRATER','FRAT-FDD','2024-05-19',NULL),
  ('CCD-01120','RCONFRA','CONF-SFVC','2024-05-02',NULL),
  ('CCD-01145','RCONFRA','CONF-SFVC','2024-05-02',NULL),
  ('CCD-01090','RCONFRA','CONF-SFVC','2024-05-02',NULL),
  ('CCD-01064','EFRATER','FRAT-ESPE','2024-05-02',NULL),
  ('CCD-01121','EFRATER','FRAT-RAF','2024-05-02',NULL),
  ('CCD-01125','EFRATER','FRAT-RAF','2024-05-02',NULL),
  ('CCD-01094','EFRATER','FRAT-SFE','2026-02-02',NULL),
  ('CCD-01086','EFRATER','FRAT-SFE','2025-05-02',NULL),
  ('CCD-01146','EFRATER','FRAT-SUN','2024-05-02',NULL),
  ('CCD-01144','EFRATER','FRAT-SUN','2024-05-02',NULL),
  ('CCD-01716','RCONFRA','CONF-PY','2024-03-16',NULL),
  ('CCD-01725','RCONFRA','CONF-PY','2024-03-16',NULL),
  ('CCD-01736','RCONFRA','CONF-PY','2024-03-16',NULL),
  ('CCD-01782','EFRATER','FRAT-MANG','2024-03-16',NULL),
  ('CCD-01781','EFRATER','FRAT-MANG','2024-03-16',NULL),
  ('CCD-01722','EFRATER','FRAT-NSM','2024-03-16',NULL),
  ('CCD-01733','EFRATER','FRAT-NSM','2024-03-16',NULL),
  ('CCD-01715','EFRATER','FRAT-NSM','2024-03-16',NULL),
  ('CCD-00152','EFRATER','FRAT-DEQT','2025-12-14',NULL),
  ('CCD-00159','EFRATER','FRAT-DEQT','2025-12-14',NULL),
  ('CCD-00165','EFRATER','FRAT-DEQT','2025-12-14',NULL),
  ('CCD-00959','DEQT','FRAT-MERC','2025-08-15',NULL),
  ('CCD-00959','DEQT','FRAT-MONT','2025-08-15',NULL),
  ('CCD-00057','DEQT','FRAT-SCRU','2025-08-15',NULL),
  ('CCD-00057','DEQT','FRAT-COCH','2025-08-15',NULL),
  ('CCD-00823','ADEDI','FRAT-CTES','2025-06-21',NULL),
  ('CCD-01102','ADEDI','FRAT-ESPE','2025-06-21',NULL),
  ('CCD-00208','ADEDI','FRAT-BQRAS','2025-06-21',NULL),
  ('CCD-00650','AJOV','FRAT-ROS','2025-09-26',NULL),
  ('CCD-01089','AJOV','FRAT-SFE','2025-09-26',NULL),
  ('CCD-00455','GFAM','FRAT-APO','2025-06-21',NULL),
  ('CCD-00829','FFFAM','FRAT-CTES','2025-08-15',NULL),
  ('CCD-01062','DEQT','FRAT-HAMB','2025-08-15',NULL),
  ('CCD-00515','DEQT','FRAT-CHIC','2025-08-15',NULL),
  ('CCD-01052','DEQT','FRAT-EPEN','2025-08-15',NULL),
  ('CCD-00024','DEQT','FRAT-EPEN','2025-08-15',NULL),
  ('CCD-00031','DEQT','FRAT-MCAF','2025-08-15',NULL),
  ('CCD-00031','DEQT','FRAT-LIMA','2025-08-15',NULL),
  ('CCD-00101','DEQT','FRAT-SMG','2025-08-15',NULL),
  ('CCD-00100','CEDIT','EQT','2025-08-15',NULL),
  ('CCD-00289','TICR','EQT','2025-06-21',NULL),
  ('CCD-01650','EFRATER','FRAT-CHIC','2024-01-15',NULL),
  ('CCD-01640','EFRATER','FRAT-CHIC','2024-01-15',NULL),
  ('CCD-01853','EFRATER','FRAT-SCRU','2023-07-14',NULL),
  ('CCD-01823','EFRATER','FRAT-COCH','2023-07-14',NULL),
  ('CCD-01827','EFRATER','FRAT-COCH','2023-07-14',NULL),
  ('CCD-01063','EFRATER','FRAT-ESPE','2026-06-02',NULL),
  ('CCD-01900','EFRATER','FRAT-MIPE','2024-11-28',NULL),
  ('CCD-01930','EFRATER','FRAT-SJBA','2026-06-29',NULL),
  ('CCD-01626','EFRATER','FRAT-SMG','2023-05-13',NULL),
  ('CCD-01623','EFRATER','FRAT-SMG','2023-05-13',NULL),
  ('CCD-01861','EFRATER','FRAT-LIMA','2026-06-29',NULL),
  ('CCD-01673','EFRATER','FRAT-MCAF',NULL,NULL),
  ('CCD-01863','EFRATER','FRAT-HAMB','2024-08-04',NULL),
  ('CCD-01864','EFRATER','FRAT-HAMB','2024-08-04',NULL),
  ('CCD-01865','EFRATER','FRAT-HAMB','2024-08-04',NULL),
  ('CCD-01866','EFRATER','FRAT-EPEN','2025-08-07',NULL),
  ('CCD-00306','EFRATER','FRAT-EPEN','2025-08-07',NULL),
  ('CCD-01868','EFRATER','FRAT-EPEN','2025-08-07',NULL),
  ('CCD-00211','DEQT','FRAT-REFM','2025-08-15',NULL),
  ('CCD-00211','DEQT','FRAT-SAHU','2025-08-15',NULL),
  ('CCD-01790','EFRATER','FRAT-SAHU','2023-04-28',NULL),
  ('CCD-01792','EFRATER','FRAT-SAHU','2023-04-28',NULL),
  ('CCD-01879','EFRATER','FRAT-ITA','2025-03-16',NULL),
  ('CCD-01208','DEQT','FRAT-DOM','2025-08-15',NULL),
  ('CCD-01208','DEQT','FRAT-SJBA','2025-08-15',NULL),
  ('CCD-01208','DEQT','FRAT-MIPE','2025-08-15',NULL),
  ('CCD-01860','EFRATER','FRAT-MIPE','2024-11-28',NULL),
  ('CCD-01858','EFRATER','FRAT-SJBA','2026-06-29',NULL),
  ('CCD-01933','EFRATER','FRAT-ICAN',NULL,NULL),
  ('CCD-01934','EFRATER','FRAT-ICAN',NULL,NULL),
  ('CCD-01674','EFRATER','FRAT-MCAF',NULL,NULL);

-- ─── 2. Insertar solo lo que falta ────────────────────────────────────────────
-- asignaciones_ministerio no tiene índice único, así que ON CONFLICT no aplica:
-- la idempotencia va por NOT EXISTS sobre la asignación vigente.

CREATE TEMP TABLE _ins_asig (id UUID) ON COMMIT DROP;

WITH ins AS (
  INSERT INTO public.asignaciones_ministerio
    (persona_id, ministerio_id, organizacion_id, fecha_inicio, fecha_fin, estado, notas)
  SELECT
    p.id,
    m.id,
    o.id,
    COALESCE(s.fecha_inicio, CURRENT_DATE),
    s.fecha_fin,
    'activo',
    'Importado de planilla Ministerios y Personas (migración 067)'
  FROM _stg_asig s
  JOIN public.personas       p ON p.codigo_interno = s.codigo_interno
  JOIN public.ministerios    m ON m.codigo_interno = s.ministerio_cod AND m.activo
  JOIN public.organizaciones o ON o.codigo         = s.org_cod
  WHERE p.fecha_baja IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.asignaciones_ministerio am
      WHERE am.persona_id      = p.id
        AND am.ministerio_id   = m.id
        AND am.organizacion_id IS NOT DISTINCT FROM o.id
        AND am.estado = 'activo'
        AND (am.fecha_fin IS NULL OR am.fecha_fin > CURRENT_DATE)
    )
  RETURNING id
)
INSERT INTO _ins_asig (id) SELECT id FROM ins;

-- ─── 3. Reporte de lo insertado y de lo que no resolvió ───────────────────────

DO $$
DECLARE
  v_staged     INTEGER;
  v_insertadas INTEGER;
  v_sin_persona    TEXT;
  v_sin_org        TEXT;
  v_sin_ministerio TEXT;
BEGIN
  SELECT COUNT(*) INTO v_staged FROM _stg_asig;

  SELECT COUNT(*) INTO v_insertadas FROM _ins_asig;

  SELECT string_agg(DISTINCT s.codigo_interno, ', ' ORDER BY s.codigo_interno)
    INTO v_sin_persona
  FROM _stg_asig s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.personas p
    WHERE p.codigo_interno = s.codigo_interno AND p.fecha_baja IS NULL
  );

  SELECT string_agg(DISTINCT s.org_cod, ', ' ORDER BY s.org_cod) INTO v_sin_org
  FROM _stg_asig s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organizaciones o WHERE o.codigo = s.org_cod
  );

  SELECT string_agg(DISTINCT s.ministerio_cod, ', ' ORDER BY s.ministerio_cod)
    INTO v_sin_ministerio
  FROM _stg_asig s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ministerios m
    WHERE m.codigo_interno = s.ministerio_cod AND m.activo
  );

  RAISE NOTICE 'Filas en la planilla: %  |  Asignaciones insertadas ahora: %',
    v_staged, v_insertadas;

  IF v_sin_persona IS NOT NULL THEN
    RAISE NOTICE 'SIN PERSONA (correr 054 primero?): %', v_sin_persona;
  END IF;
  IF v_sin_org IS NOT NULL THEN
    RAISE NOTICE 'SIN ORGANIZACION (correr 043 primero?): %', v_sin_org;
  END IF;
  IF v_sin_ministerio IS NOT NULL THEN
    RAISE NOTICE 'SIN MINISTERIO ACTIVO (correr 047 primero?): %', v_sin_ministerio;
  END IF;
  IF v_sin_persona IS NULL AND v_sin_org IS NULL AND v_sin_ministerio IS NULL THEN
    RAISE NOTICE 'Todos los codigos resolvieron correctamente.';
  END IF;
END $$;

COMMIT;

-- ─── Verificación (correr aparte, después del COMMIT) ─────────────────────────
--
-- Reparto por ministerio de lo importado (esperado: EFRATER 131 · RCONFRA 40 · DEQT 16 · TIMON 3 · ADEDI 3 · AJOV 2 · GFAM 1 · FFFAM 1 · CEDIT 1 · TICR 1):
-- SELECT m.codigo_interno, count(*)
--   FROM public.asignaciones_ministerio am
--   JOIN public.ministerios m ON m.id = am.ministerio_id
--  WHERE am.notas LIKE '%migración 067%'
--  GROUP BY 1 ORDER BY 2 DESC;
--
-- Quiénes quedaron con conducción y en qué organización:
-- SELECT p.codigo_interno, p.nombre_usuario, m.nombre AS ministerio, o.nombre AS organizacion,
--        am.fecha_inicio, am.fecha_fin
--   FROM public.asignaciones_ministerio am
--   JOIN public.personas p       ON p.id = am.persona_id
--   JOIN public.ministerios m    ON m.id = am.ministerio_id
--   LEFT JOIN public.organizaciones o ON o.id = am.organizacion_id
--  WHERE am.notas LIKE '%migración 067%'
--  ORDER BY m.nombre, o.nombre, p.nombre_usuario;
--
-- Deshacer el lote completo (si hiciera falta):
-- UPDATE public.asignaciones_ministerio
--    SET estado = 'inactivo', fecha_fin = CURRENT_DATE, motivo_fin = 'Revertida migración 067'
--  WHERE notas LIKE '%migración 067%' AND estado = 'activo';
