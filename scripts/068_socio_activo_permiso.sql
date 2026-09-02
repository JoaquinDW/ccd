-- Migración 068: Permiso para editar "Socio Activo de la Asociación Civil"
--
-- Contexto: el campo personas.socio_asociacion (checkbox "Socio Activo de la
-- Asociación Civil", visible en Configuración > Datos Personales para
-- Servidores/Familiares) hoy lo puede tildar cualquier cecista sobre su propio
-- perfil, sin ninguna validación de rol. Se pide que solo lo puedan tildar
-- quienes ejercen un ministerio de conducción/tesorería: Enlace de
-- Fraternidad, Delegado de Fraternidad Dependiente del EqT, Responsable de
-- Confraternidad, Tesorero de Confraternidad, Tesorero de Fraternidad y
-- Timonel (Equipo Timón). admin_general accede siempre (bypass).
--
-- Mismo patrón que la migración 055 (votos.edit): permiso de catálogo,
-- asignado a admin_general por rol_permisos, y a los ministerios puntuales
-- por ministerio_permisos.

-- 1. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('person.edit_socio_activo',
   'Editar Socio Activo de la Asociación Civil',
   'Permite tildar/destildar el campo "Socio Activo de la Asociación Civil" en el propio perfil (Configuración > Datos Personales). Para Enlaces, Delegados, Responsables, Tesoreros y Timonel.',
   'personas')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar a admin_general
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'person.edit_socio_activo'
ON CONFLICT DO NOTHING;

-- 3. Asignar a los ministerios de conducción/tesorería
INSERT INTO public.ministerio_permisos (ministerio_id, permiso_id)
SELECT m.id, p.id
FROM public.ministerios m
CROSS JOIN public.permisos p
WHERE m.codigo_interno IN ('TIMON', 'RCONFRA', 'EFRATER', 'DEQT', 'TCONFRA', 'TFRATER')
  AND p.clave = 'person.edit_socio_activo'
ON CONFLICT DO NOTHING;
