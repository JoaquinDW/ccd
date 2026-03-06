# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Plataforma de Gestión Integral – Comunidad CcD

---

# 1. Visión del Producto

Desarrollar una plataforma web centralizada para la gestión organizacional, institucional y operativa de la Comunidad CcD.

El sistema permitirá:

- Administración de personas
- Gestión jerárquica de la estructura territorial
- Gestión histórica de modos de participación
- Gestión de ministerios institucionales
- Gestión de eventos (convivencias, retiros, talleres)
- Sistema de roles y permisos por contexto organizacional
- Trazabilidad completa y no destructiva de la información

El sistema debe ser:

- Escalable
- Auditable
- Histórico
- Multi-país
- Basado en roles contextuales

---

# 2. Objetivos del Producto

## Objetivos Primarios

1. Centralizar la información institucional.
2. Reemplazar sistemas manuales y dispersos (Excel, papel).
3. Garantizar trazabilidad histórica.
4. Permitir descentralización progresiva del ABM.
5. Gestionar eventos de manera estructurada.

## Objetivos Secundarios

- Reducir errores administrativos.
- Facilitar transición de autoridades.
- Mejorar visibilidad organizacional.
- Permitir exportación futura de datos.

---

# 3. Tipos de Usuarios

## 3.1 Equipo Timón (Autoridad Máxima)

- Acceso global
- Visualización completa
- Aprobación de eventos
- Asignación de ministerios superiores

## 3.2 Responsable de Confraternidad

- Acceso a su confraternidad
- Gestión de fraternidades dependientes
- Gestión de eventos de su territorio

## 3.3 Enlace de Fraternidad

- Gestión local de su fraternidad
- Gestión de eventos locales

## 3.4 Ministerios Pastorales

- Acceso contextual según designación

## 3.5 Administrador Técnico

- Gestión técnica global
- Sin autoridad pastoral necesariamente

## 3.6 Usuario Participante

- Inscripción a eventos
- Visualización limitada

---

# 4. Alcance Funcional (MVP)

---

## 4.1 Gestión de Personas

El sistema deberá permitir:

- Alta de personas
- Edición de datos personales
- Baja lógica (no eliminación física)
- Fusión de duplicados
- Registro de:
  - Datos personales
  - Estado eclesial
  - País
- Asociación a organización

### Reglas

- No se puede eliminar persona con historial activo.
- Cambios deben quedar auditados.
- Toda persona puede tener múltiples roles históricos.

---

## 4.2 Modos de Participación

El sistema deberá:

- Registrar cambios históricos de modo.
- Permitir los siguientes modos:
  - Servidor
  - Familiar
  - Asesor
  - Colaborador
  - Orante
  - Intercesor
- Guardar:
  - Fecha inicio
  - Fecha fin
  - Motivo
  - Documento adjunto opcional

### Reglas

- No se deben sobrescribir modos.
- El estado actual debe derivarse del histórico.
- Una persona no puede tener dos modos excluyentes activos simultáneamente.

---

## 4.3 Estructura Organizacional

Debe soportar:

- Comunidad
- Confraternidad
- Fraternidad
- Casa de retiro

Características:

- Jerarquía autorreferenciada
- Estado activa/inactiva
- Código identificador
- Multi-país

---

## 4.4 Ministerios Institucionales

El sistema deberá:

- Definir catálogo de ministerios
- Permitir asignación histórica
- Asociar ministerios a:
  - Organización
  - Evento
- Guardar documentación de designación
- Registrar fecha inicio y fin

### Regla Clave

Ministerio ≠ Rol técnico del sistema.

---

## 4.5 Gestión de Eventos

Tipos:

- Convivencia
- Retiro
- Taller

Cada evento debe permitir:

- Asociación a organización
- Fechas fragmentadas
- Modalidad (presencial / virtual / bimodal)
- Cupo máximo
- Estado de workflow
- Gestión de participantes
- Gestión de roles operativos

Estados mínimos:

- Borrador
- Solicitado
- Aprobado
- Publicado
- Finalizado

---

## 4.6 Participación en Eventos

Debe permitir:

- Preinscripción
- Confirmación
- Cancelación
- Asignación de rol en evento:
  - Convivente
  - Coordinador
  - Asesor
  - Centralizador
  - Equipo auxiliar

### Regla Clave

Rol en evento es independiente del modo institucional.

---

## 4.7 Sistema de Usuarios y Permisos

Basado en:

- Supabase Auth
- Roles técnicos
- Contexto organizacional
- Row Level Security (RLS)

Permisos deben:

- Ser contextuales
- Respetar jerarquía organizacional
- Ser auditables

---

# 5. Requisitos No Funcionales

---

## 5.1 Seguridad

- Autenticación email/password
- OAuth opcional
- Row Level Security obligatoria
- Encriptación de datos sensibles

---

## 5.2 Trazabilidad

- No eliminación física de datos históricos
- Auditoría básica de cambios
- Registro de asignaciones

---

## 5.3 Escalabilidad

- Multi-país
- Soportar más de 5000 personas
- Soportar crecimiento estructural

---

## 5.4 Exportación de Datos

- Exportación CSV
- Portabilidad garantizada

---

# 6. Stack Tecnológico

- Frontend: Next.js (App Router)
- Backend: Supabase (PostgreSQL)
- Autenticación: Supabase Auth
- Permisos: Row Level Security
- Storage: Supabase Storage
- Hosting: Vercel

---

# 7. Principios de Diseño del Sistema

1. Todo es histórico.
2. No se eliminan datos con relevancia institucional.
3. Roles técnicos ≠ Ministerios institucionales.
4. La jerarquía organizacional es clave para permisos.
5. El estado actual debe derivarse de históricos.
6. El sistema debe sobrevivir cambios de autoridades.

---

# 8. Roadmap Sugerido

## Fase 1 – Núcleo

- Personas
- Organización
- Modos históricos
- Usuarios
- Permisos básicos

## Fase 2 – Ministerios

- Catálogo
- Asignaciones históricas

## Fase 3 – Eventos

- Creación
- Inscripciones
- Roles en evento

## Fase 4 – Workflow avanzado y reportes

---

# 9. Riesgos Identificados

- Mezclar permisos técnicos con ministerios
- No diseñar correctamente históricos
- No implementar bien jerarquía para RLS
- Crecimiento sin normalización

---

# 10. Criterios de Éxito

- Equipo Timón puede ver estructura completa.
- Responsable solo ve su territorio.
- Historial de cambios trazable.
- Eventos gestionados sin planillas externas.
- Exportación funcional.

---

# 11. Definiciones Clave

- **Modo de Participación:** Estado institucional del miembro dentro de la comunidad.
- **Ministerio:** Función institucional asignada formalmente.
- **Rol Técnico:** Permiso de acceso dentro del sistema.
- **Organización:** Nodo estructural jerárquico.
- **Evento:** Convivencia, retiro o taller.

---

Documento Base v1.0
