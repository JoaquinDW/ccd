# Informe de Avance — Plataforma Convivencia con Dios

**Proyecto:** Sistema de gestión integral para la Comunidad CcD
**Período:** 3 de marzo al 16 de marzo de 2026
**Total de días:** 13 días calendario
**Total estimado de horas:** ~35 horas
**Ritmo de trabajo:** ~4 h/día × 5 días/semana (~1.75 semanas de trabajo efectivo)

---

## Resumen ejecutivo

En menos de dos semanas se construyó desde cero una plataforma web completa para la gestión organizacional de la Comunidad CcD. El sistema cubre personas, organizaciones, ministerios, eventos, retiros, inscripciones y pagos, con autenticación, permisos por rol, migraciones de base de datos y documentación técnica.

**Volumen de trabajo entregado:**
- **109 archivos creados o modificados** en total
- **~17.500 líneas de código nuevas** (netas, excluyendo eliminaciones)
- **11 scripts SQL** de migración de base de datos
- **62 páginas y componentes** React/Next.js
- **11 API Routes** (endpoints REST)
- **4 documentos técnicos** (PRD, data model, data model v2, reglas de negocio)

---

## Semana 1 — 3 al 6 de marzo

**Horas estimadas: ~14–16 horas**
**Promedio: ~7–8 h/día (2 días activos)**

### 3 de marzo — Setup completo + estructura base
**Horas: ~7–8 h**

Se creó toda la estructura del proyecto desde cero. Un solo commit incluyó 120 archivos y 12.922 líneas de código.

**Lo que se hizo:**

**Infraestructura y configuración**
- Inicialización del proyecto Next.js 15 con App Router y TypeScript
- Integración completa de Supabase (Auth, base de datos, Storage)
- Configuración de Tailwind CSS v4 con shadcn/ui (tema new-york, base neutral)
- Middleware de sesión: refresca el token en cada request y redirige usuarios no autenticados
- Dos instancias de cliente Supabase separadas: server (Server Components) y client (Client Components)
- Configuración de Vercel Analytics
- 50+ componentes UI de shadcn/ui instalados y configurados

**Sistema de autenticación**
- Página de login con manejo de errores
- Página de registro de usuario
- Página de confirmación post-registro
- Redirección automática según estado de sesión

**Layout y navegación**
- Sidebar con navegación completa por módulos
- Header con información de usuario y acciones
- Footer
- Layout diferenciado para área pública vs. área protegida vs. área admin

**Módulos base (versión inicial, conectados a Supabase real)**
- `/personas` — listado y alta de personas
- `/organizaciones` — listado y alta de organizaciones
- `/eventos` — listado y alta de eventos
- `/retiros` — listado, detalle y formulario de inscripción a retiro
- `/retiros/[id]/inscripcion` — flujo completo de inscripción
- `/inscripciones` — listado e inscripción manual
- `/pagos` — listado y registro de pagos
- `/documentos` — módulo base
- `/reportes` — módulo base con KPIs y gráficos
- `/settings` — configuración de perfil
- `/dashboard` — vista general con estadísticas

**Área Admin**
- `/admin` — panel de administración
- `/admin/cofradias` — gestión de confraternidades con alta
- `/admin/inscripciones` — gestión de inscripciones con acciones
- `/admin/retiros` — gestión y creación de retiros

**Base de datos**
- `001_create_tables.sql` — schema inicial completo con todas las tablas del dominio

---

### 6 de marzo — Arquitectura canónica + permisos + documentación
**Horas: ~7–8 h**

El mayor commit técnico del proyecto: 68 archivos cambiados, cientos de líneas de lógica nueva.

**Modelo de datos y documentación**
- `docs/PRD.md` — Documento de Requerimientos del Producto (351 líneas): visión, objetivos, módulos, casos de uso, requisitos no funcionales
- `docs/data-model.md` — Especificación completa del modelo de datos (383 líneas): todas las tablas, campos, relaciones, constraints, RLS policies
- `CLAUDE.md` — Documentación de arquitectura para el proyecto (91 líneas)
- Definición precisa de los 4 conceptos de rol/asignación (nunca conflated): modo de participación, ministerio institucional, rol técnico, rol en evento

**Migraciones SQL ejecutadas**
- `003_align_to_data_model.sql` (500 líneas) — Alineación completa del schema al modelo canónico: columnas faltantes, nuevas tablas, constraints, RLS policies
- `004_fix_invite_trigger.sql` (97 líneas) — Fix del trigger `handle_new_user` para vincular personas existentes al invitar usuarios
- `005_dynamic_permissions.sql` (172 líneas) — Sistema de permisos dinámicos: tablas `permisos` y `rol_permisos`, constraints únicos en `usuario_roles`
- `006_persona_id_en_usuario_roles.sql` — Relación persona ↔ usuario_roles para roles sin cuenta de auth, triggers y policies actualizadas

**Reestructuración del App Router**
- Migración de todas las rutas a la estructura `(app)/` con route groups de Next.js
- Layout propio para el área autenticada con contexto de usuario

**Módulo Personas — versión completa**
- `/personas` — listado con búsqueda por nombre/apellido, filtros, paginación
- `/personas/nueva` — formulario completo de alta (377 líneas): datos personales, eclesiales, modo de participación
- `/personas/[id]/editar` — formulario de edición con todos los campos (616 líneas)
- API `GET/POST /api/personas` — listado con filtros + creación
- API `GET/PUT/DELETE /api/personas/[id]` — operaciones por ID

**Módulo Organizaciones — versión completa**
- `/organizaciones` — listado con búsqueda, tipos, jerarquía
- `/organizaciones/nueva` — formulario de alta con selector de tipo y organización padre
- `/organizaciones/[id]` — vista detalle con miembros y suborganizaciones
- `/organizaciones/[id]/editar` — formulario de edición completo (274 líneas)
- API `GET/POST /api/organizaciones` y `GET/PUT/DELETE /api/organizaciones/[id]`

**Módulo Ministerios — completo**
- `/ministerios` — hub de navegación del módulo
- `/ministerios/roles` — listado de roles del sistema
- `/ministerios/roles/nuevo` — creación de rol con permisos (134 líneas)
- `/ministerios/roles/[id]` — detalle de rol
- `/ministerios/roles/[id]/_components/edit-rol-form.tsx` — edición de rol
- `/ministerios/roles/[id]/_components/permisos-matrix.tsx` — matriz de permisos interactiva (134 líneas)
- `/ministerios/asignaciones` — listado de asignaciones ministeriales (197 líneas)
- `/ministerios/asignaciones/nueva` — asignación de ministerio a persona (276 líneas)
- `/ministerios/asignaciones/[id]/revocar` — revocación con confirmación (162 líneas)
- API `GET/POST /api/ministerios/roles`

**Módulo Eventos — completo**
- `/eventos` — listado con estados y tipos
- `/eventos/nuevo` — formulario de creación con fechas múltiples (294 líneas)
- `/eventos/[id]/editar` — edición completa (352 líneas)
- API `GET/POST /api/eventos`

**Sistema de autenticación y permisos**
- `lib/auth/context.ts` (116 líneas) — contexto de usuario con roles, ministerios y scope organizacional
- `lib/auth/permissions.ts` (138 líneas) — evaluación de permisos por contexto

---

## Semana 2 — 10 al 16 de marzo

**Horas estimadas: ~18–22 horas**
**Promedio: ~6–7 h/día (3 días activos)**

---

### 10 de marzo — Refactor masivo + exports + reglas de negocio
**Horas: ~8 h**
*(6 commits en el mismo día)*

**Refactor completo del módulo Personas**
- Nuevo componente `personas-table.tsx` (348 líneas) — tabla avanzada con columnas, ordenamiento, acciones en línea
- Nuevo componente `persona-detail-modal.tsx` (257 líneas) — modal de detalle sin salir del listado
- Nuevo componente `personas-filters.tsx` (138 líneas) — panel de filtros avanzados (modo, estado, organización, búsqueda)
- Nuevo componente `export-button.tsx` (49 líneas) — botón de exportación a Excel/PDF
- API `GET /api/personas/export` (137 líneas) — endpoint de exportación con filtros

**Refactor módulo Organizaciones**
- Nuevo componente `org-export-button.tsx` — exportación de organizaciones
- API `GET /api/organizaciones/export` (52 líneas) — endpoint de exportación
- Mejoras en listado y detalle

**Catálogo de Ministerios**
- `/ministerios/catalogo` — listado del catálogo de ministerios
- `/ministerios/catalogo/nuevo` — creación de ministerio (180 líneas)
- `/ministerios/catalogo/[id]` — detalle de ministerio
- Componentes: `edit-ministerio-form.tsx`, `ministerio-detail-client.tsx`, `permisos-matrix.tsx`, `ministerios-table.tsx`

**Dashboard mejorado**
- `dashboard/page.tsx` reescrito (287 líneas) — KPIs dinámicos desde Supabase, gráficos de actividad, resumen por módulo

**Documentación de negocio**
- `docs/negocio.md` (270 líneas) — reglas de negocio detalladas: clasificación de personas, jerarquía organizacional, flujos de eventos, reglas de participación
- `docs/data-model-2.0.md` (476 líneas) — modelo de datos v2 con todas las actualizaciones

**Migraciones SQL ejecutadas**
- `004_add_estado_eclesial.sql` — columnas `estado_eclesial` y `diocesis` en personas
- `005_data_model_v2.sql` — nuevas columnas en personas y organizaciones, tabla `persona_categoria_no_cecista`, tabla `persona_organizacion`

**Dependencias nuevas instaladas**
- `html2canvas-pro` — captura de pantalla para exportación PDF
- `jspdf` — generación de PDFs
- `xlsx` — exportación a Excel

**Fixes de build críticos (3 commits)**
- Corrección del crash de Supabase client durante static build
- `export const dynamic = 'force-dynamic'` agregado a 37 páginas Server Component
- Separación correcta: Client Components NO pueden tener force-dynamic, Server Components sí

---

### 14 de marzo — Módulo Casas de Retiro completo
**Horas: ~7 h**

26 archivos modificados, módulo completo de cero más refactor de ministerios y permisos.

**Módulo Casas de Retiro — completo desde cero**
- `/casas-retiro` — listado con búsqueda, capacidad, servicios disponibles (198 líneas)
- `/casas-retiro/nueva` — formulario de alta completo: datos generales, contacto, capacidad, servicios, ubicación (454 líneas)
- `/casas-retiro/[id]` — vista detalle con todos los campos y retiros asociados (230 líneas)
- `/casas-retiro/[id]/editar` — formulario de edición completo (441 líneas)
- API `GET/POST /api/casas-retiro` (71 líneas)
- API `GET/PUT/DELETE /api/casas-retiro/[id]` (112 líneas)

**Migraciones SQL**
- `007_unify_ministerios.sql` (137 líneas) — unificación del catálogo de ministerios, eliminación de duplicados, nuevas relaciones
- `008_casas_retiro.sql` (117 líneas) — tabla `casas_retiro` con todos sus campos y relaciones

**Refactor de Ministerios**
- Unificación de ministerios institucionales y roles del sistema en un solo flujo
- Componente `ministerios-table.tsx` (235 líneas) — tabla completa con filtros y acciones
- Refactor de asignaciones para soportar el nuevo modelo unificado

**Mejoras en Personas**
- Eliminación de gestión de roles legacy del formulario de edición
- Simplificación del formulario (`edit-persona-form.tsx` reducido)

**Mejoras en autenticación**
- Login page mejorado con mejor manejo de errores y UX
- Contexto de usuario (`lib/auth/context.ts`) actualizado para incluir permisos de ministerio

**Navegación**
- Sidebar actualizado con nuevo módulo Casas de Retiro y reorganización de ministerios

---

### 16 de marzo — Campos faltantes en Personas + RLS
**Horas: ~5 h**

7 archivos, 736 líneas nuevas netas. Extensión mayor de los formularios de personas.

**Nuevos campos en Personas**
- `email_ccd` — email institucional de la comunidad
- `direccion_nro` — número de la dirección (separado de la calle)
- `codigo_postal` — código postal
- `estado_vida` — estado de vida (soltero, casado, viudo, consagrado, etc.)
- `intercesor_dies_natalis` — fecha del santo patrón para intercesores
- Soporte completo para categorías no-cecistas extendidas

**Formularios actualizados**
- `personas/nueva/page.tsx` — reescritura parcial (512 líneas totales), nueva lógica para categorías no-cecistas, validaciones mejoradas
- `personas/[id]/editar/_components/edit-persona-form.tsx` — nuevos campos integrados (316 líneas de cambios)
- `personas/_components/persona-detail-modal.tsx` — muestra todos los campos nuevos (168 líneas de cambios)

**APIs actualizadas**
- `POST /api/personas` — acepta y guarda todos los campos nuevos
- `PUT /api/personas/[id]` — actualización con los nuevos campos

**Seguridad (RLS)**
- Políticas RLS para `persona_categoria_no_cecista`
- Políticas RLS para `persona_organizacion`

**Migración SQL**
- `009_persona_campos_faltantes.sql` (57 líneas) — columnas nuevas en tabla personas, extensión del enum de categorías no-cecistas

---

## Detalle de horas por semana

| Semana | Período | Días activos | Horas |
|---|---|---|---|
| Semana 1 | 3–6 marzo | 2 días (3 y 6) | ~15 h |
| Semana 2 | 10–16 marzo | 3 días (10, 14 y 16) | ~20 h |
| **Total** | | **5 días activos** | **~35 h** |

> Ritmo presupuestado: 4 h/día × 5 días/semana = 20 h/semana.
> El trabajo efectivo corresponde a ~1.75 semanas de ese ritmo, distribuidas en 13 días calendario.

---

## Inventario completo de entregables

### Páginas y componentes (62 archivos TSX)

| Módulo | Archivos | Descripción |
|---|---|---|
| Auth | 3 | Login, sign-up, confirmación |
| Dashboard | 1 | Vista general con KPIs |
| Personas | 8 | Listado, alta, edición, modal, filtros, tabla, export |
| Organizaciones | 5 | Listado, alta, detalle, edición, export |
| Ministerios | 12 | Hub, roles, catálogo, asignaciones, revocar, matrices de permisos |
| Eventos | 4 | Listado, alta, edición, form separado |
| Retiros | 3 | Listado, detalle, inscripción |
| Casas de Retiro | 4 | Listado, alta, detalle, edición |
| Inscripciones | 2 | Listado, nueva inscripción |
| Pagos | 2 | Listado, nuevo pago |
| Admin | 5 | Panel, cofradías, inscripciones, retiros, nuevo retiro |
| Otros | 3 | Documentos, Reportes, Settings |

### API Routes (11 archivos TS)

| Endpoint | Métodos | Propósito |
|---|---|---|
| `/api/personas` | GET, POST | Listado con filtros + creación |
| `/api/personas/[id]` | GET, PUT, DELETE | Operaciones por persona |
| `/api/personas/export` | GET | Exportación Excel/PDF |
| `/api/personas/invite` | POST | Invitación a crear cuenta |
| `/api/organizaciones` | GET, POST | Listado + creación |
| `/api/organizaciones/[id]` | GET, PUT, DELETE | Operaciones por org |
| `/api/organizaciones/export` | GET | Exportación |
| `/api/eventos` | GET, POST | Listado + creación |
| `/api/ministerios/roles` | GET, POST | Roles del sistema |
| `/api/casas-retiro` | GET, POST | Listado + creación |
| `/api/casas-retiro/[id]` | GET, PUT, DELETE | Operaciones por casa |

### Scripts SQL (11 archivos)

| Script | Líneas | Estado | Descripción |
|---|---|---|---|
| `001_create_tables.sql` | — | ✅ Ejecutado | Schema inicial completo |
| `002_restructure_schema.sql` | — | ✅ Ejecutado | Reestructuración |
| `003_align_to_data_model.sql` | 500 | ✅ Ejecutado | Alineación al modelo canónico |
| `004_add_estado_eclesial.sql` | — | ✅ Ejecutado | Estado eclesial en personas |
| `004_fix_invite_trigger.sql` | 97 | ✅ Ejecutado | Fix trigger de invitación |
| `005_data_model_v2.sql` | — | ✅ Ejecutado | Modelo v2 |
| `005_dynamic_permissions.sql` | 172 | ✅ Ejecutado | Permisos dinámicos |
| `006_persona_id_en_usuario_roles.sql` | — | ✅ Ejecutado | Relación persona-roles |
| `007_unify_ministerios.sql` | 137 | ✅ Ejecutado | Unificación ministerios |
| `008_casas_retiro.sql` | 117 | ✅ Ejecutado | Tabla casas de retiro |
| `009_persona_campos_faltantes.sql` | 57 | ⏳ Pendiente | Campos nuevos en personas |

### Documentación técnica (4 documentos)

| Archivo | Líneas | Contenido |
|---|---|---|
| `docs/PRD.md` | 351 | Requerimientos completos del producto |
| `docs/data-model.md` | 383 | Modelo de datos v1 |
| `docs/data-model-2.0.md` | 476 | Modelo de datos v2 actualizado |
| `docs/negocio.md` | 270 | Reglas de negocio de la comunidad |

---

## Pendientes

- [ ] Ejecutar `009_persona_campos_faltantes.sql` en producción
- [ ] Módulo Documentos (lógica real de gestión documental)
- [ ] Módulo Reportes (generación real de reportes)
- [ ] Settings de perfil de usuario
- [ ] RLS policies completas por jerarquía organizacional
- [ ] Tests automatizados
- [ ] Sistema de notificaciones
