DATA MODEL – Plataforma CcD

Versión 2.0
Formato optimizado para generación de código con IA (Claude Code)

1. Principios de diseño

El modelo sigue estas reglas fundamentales:

No se eliminan registros con historial.

Toda asignación institucional es histórica.

Cecista y No Cecista es una categoría de persona, no un rol.

Rol técnico ≠ ministerio ≠ rol en evento.

La estructura organizacional es jerárquica.

Las relaciones importantes deben conservar histórico.

El estado actual se calcula desde los históricos.

2. Entidad: PERSONA

Representa a cualquier individuo dentro del sistema.

Campos
id (UUID, PK)

fecha_alta
fecha_baja

nombre
apellido

email (unique)
telefono

tipo_documento
documento

fecha_nacimiento

direccion
localidad
provincia
pais

categoria_persona
ENUM: - cecista - no_cecista

es_sacerdote BOOLEAN
es_obispo BOOLEAN

diocesis
parroquia

socio_asociacion BOOLEAN
referente_comunidad BOOLEAN
cecista_dedicado BOOLEAN

acepta_comunicaciones BOOLEAN

estado
ENUM: - activo - inactivo

created_at
updated_at 3. PERSONA_CATEGORIA_NO_CECISTA

Subcategorías posibles cuando la persona no es cecista.

Una persona puede tener múltiples.

Campos
id (UUID)

persona_id (FK → persona.id)

categoria
ENUM: - voluntario - convivente - cooperador

created_at 4. PERSONA_MODO_PARTICIPACION

Histórico de modos de participación solo para cecistas.

Modos posibles

colaborador

servidor

asesor

familiar

orante

intercesor

Campos
id (UUID)

persona_id (FK)

modo

fecha_inicio
fecha_fin

estado
motivo_fin

notas
documento_url

created_at
Reglas

No puede haber dos modos activos simultáneamente si son incompatibles.

El modo actual es el que tiene fecha_fin = NULL.

5. ORGANIZACION

Representa cualquier nodo estructural del sistema.

Tipos posibles:

comunidad

confraternidad

fraternidad

casa_retiro

eqt

Campos
id (UUID)

parent_id (FK → organizacion.id)

nombre
codigo

tipo
ENUM: - comunidad - confraternidad - fraternidad - casa_retiro - eqt

direccion
localidad
provincia
pais

telefono_1
telefono_2

estado
ENUM: - activa - inactiva

fecha_creacion
fecha_baja

created_at 6. PERSONA_ORGANIZACION

Histórico de pertenencia de personas a fraternidades o confraternidades.

Permite registrar mudanzas o cambios de estructura.

Campos
id (UUID)

persona_id (FK)

organizacion_id (FK)

tipo_relacion
ENUM: - confraternidad - fraternidad

fecha_inicio
fecha_fin

motivo_fin
notas

created_at 7. MINISTERIO_TIPO

Define categorías conceptuales de ministerios.

Ejemplos:

música

logística

cocina

coordinación

pastoral

Campos
id (UUID)

nombre
descripcion

activo BOOLEAN
created_at 8. MINISTERIO

Equipo funcional dentro de una organización.

Campos
id (UUID)

ministerio_tipo_id (FK)

organizacion_id (FK)

codigo
nombre

tipo
ENUM: - conduccion - pastoral - servicio

nivel_influencia
ENUM: - comunidad - confraternidad - fraternidad - evento

estado
ENUM: - activo - inactivo

fecha_creacion
created_at 9. ASIGNACION_MINISTERIO

Histórico de participación de personas en ministerios.

Campos
id (UUID)

persona_id (FK)
ministerio_id (FK)

organizacion_id (FK)

rol_en_ministerio
ENUM: - responsable - enlace - timonel - miembro

fecha_inicio
fecha_fin

estado
motivo_fin

notas
documento_url

asignado_por
created_at 10. EVENTO

Representa convivencias, retiros y talleres.

Tipos

convivencia

retiro

taller

Campos
id (UUID)

organizacion_id (FK)

casa_retiro_id (FK → organizacion)

codigo
nombre

tipo
ENUM: - convivencia - retiro - taller

audiencia
ENUM: - abierto - cerrado

modalidad
ENUM: - presencial - virtual - bimodal

estado
ENUM: - borrador - nuevo - solicitado - aprobado - en_preparacion - publicado - cerrado - finalizado

fecha_solicitud
fecha_aprobacion
aprobado_por

cupo_maximo

cuota_inscripcion
pension

banner_url

created_at 11. EVENTO_FECHAS

Permite múltiples periodos para un evento.

Campos
id (UUID)

evento_id (FK)

fecha_inicio
fecha_fin 12. EVENTO_PARTICIPANTE

Vincula personas con eventos.

Roles en evento

convivente

coordinador

asesor

centralizador

equipo_auxiliar

Campos
id (UUID)

evento_id (FK)
persona_id (FK)

rol_evento

estado_inscripcion
ENUM: - pendiente - confirmada - cancelada

fecha_inscripcion
created_at 13. EVENTO_MINISTERIO

Asignación de ministerios o personas a eventos.

Campos
id (UUID)

evento_id (FK)

persona_id (FK)

ministerio_id (FK)

estado
ENUM: - activo - inactivo

fecha_asignacion
fecha_fin

motivo_fin
notas

asignado_por
created_at 14. USUARIO

Cuenta de acceso al sistema.

Campos
id (UUID)

persona_id (FK)

username
password_hash

estado
ENUM: - activo - bloqueado

ultimo_login

created_at 15. ROL_SISTEMA

Roles técnicos del sistema.

Ejemplos:

admin_general

administrador_confraternidad

tecnico_fraternidad

solo_lectura

Campos
id (UUID)

nombre
descripcion
activo 16. USUARIO_ROL

Permisos contextuales del sistema.

Campos
id (UUID)

usuario_id (FK)

rol_sistema_id (FK)

organizacion_id (FK nullable)

ministerio_id (FK nullable)

created_at 17. Reglas críticas de negocio
Cecistas

Solo cecistas pueden tener ministerios.

Solo cecistas pueden ser coordinadores o asesores.

No Cecistas

Los no cecistas pueden:

participar en convivencias

colaborar en eventos

ser voluntarios

Pero no forman parte de la estructura pastoral.

Eventos

Un evento pertenece a una organización.

Un evento puede tener múltiples fechas.

Un evento puede tener múltiples participantes.

Histórico obligatorio

Se debe guardar histórico en:

modos de participación

pertenencia organizacional

ministerios

roles

eventos

18. Relaciones principales
    PERSONA
    → PERSONA_MODO_PARTICIPACION
    → PERSONA_CATEGORIA_NO_CECISTA
    → PERSONA_ORGANIZACION
    → ASIGNACION_MINISTERIO
    → EVENTO_PARTICIPANTE

ORGANIZACION
→ ORGANIZACION (jerarquía)
→ MINISTERIO
→ EVENTO

EVENTO
→ EVENTO_FECHAS
→ EVENTO_PARTICIPANTE
→ EVENTO_MINISTERIO

USUARIO
→ USUARIO_ROL
