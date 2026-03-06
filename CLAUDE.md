# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run start     # Start production server
```

No test runner is configured yet.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Tailwind CSS v4** + **shadcn/ui** (style: new-york, base: neutral)
- **React Hook Form** + **Zod** for forms/validation
- **Vercel** for hosting + `@vercel/analytics`

## Architecture

### Auth & Middleware

`middleware.ts` refreshes the Supabase session on every request and redirects unauthenticated users away from protected routes. Two Supabase client instances exist:
- `lib/supabase/server.ts` — for Server Components and Route Handlers
- `lib/supabase/client.ts` — for Client Components

### Routing

Uses Next.js App Router. Routes mirror the business domain:
- `/auth/*` — login, sign-up, sign-up-success
- `/dashboard` — main overview
- `/admin/*` — admin-only views (cofradias, inscripciones, retiros)
- `/personas`, `/organizaciones`, `/eventos`, `/retiros`, `/inscripciones`, `/pagos`, `/documentos`, `/reportes`, `/settings`

### UI Conventions

All shadcn/ui components live in `components/ui/`. Use the `cn()` utility from `lib/utils.ts` for class merging. Layout components (sidebar, header, footer) are in `components/layout/`.

---

## Domain Model (Critical for all features)

The platform manages the **Comunidad CcD** (Convivencia con Dios) — a Catholic community organization. The model has 4 distinct role/assignment concepts that must never be conflated:

| Concept | Table | Purpose |
|---|---|---|
| Modo de participación | `persona_modos` | Institutional membership state (servidor, familiar, asesor, colaborador, orante, intercesor) |
| Ministerio institucional | `asignaciones_ministerio` | Formal function assigned to a person in an org |
| Rol técnico del sistema | `usuario_roles` | Technical access permissions (admin_general, solo_lectura, etc.) |
| Rol en evento | `evento_participantes` | Operational role within a specific event (convivente, coordinador, asesor, centralizador, equipo_auxiliar) |

### Core Data Principles

1. **No physical deletion** — use logical soft-deletes (`fecha_baja`, `estado: inactivo`).
2. **All institutional assignments are historical** — never overwrite; add new record with `fecha_fin` on previous.
3. **Current state is derived from history** — current mode/ministry = record where `fecha_fin IS NULL`.
4. **Permissions are contextual** — scoped to `organizacion_id` via RLS. Hierarchy determines access scope.

### Organizational Hierarchy

`organizacion` is self-referencing (`parent_id`). Types: `comunidad → confraternidad → fraternidad / casa_retiro / eqt`. RLS policies must respect this hierarchy.

### Event Workflow States

`borrador → solicitado → aprobado → publicado → finalizado`

Events (`evento`) support fragmented dates via the `evento_fechas` table. Types: `convivencia`, `retiro`, `taller`.

### User Types

- **Equipo Timón** — global access, event approval
- **Responsable de Confraternidad** — scoped to their confraternidad
- **Enlace de Fraternidad** — scoped to their fraternidad
- **Ministerios Pastorales** — contextual access by designation
- **Administrador Técnico** — system-wide technical access (no pastoral authority)
- **Usuario Participante** — event registration + limited visibility

## Key Files

- [docs/PRD.md](docs/PRD.md) — Full product requirements
- [docs/data-model.md](docs/data-model.md) — Complete data model specification
- [scripts/001_create_tables.sql](scripts/001_create_tables.sql) — Initial DB schema
- [scripts/002_restructure_schema.sql](scripts/002_restructure_schema.sql) — Schema evolution
- [middleware.ts](middleware.ts) — Auth session refresh + route protection
- [lib/supabase/](lib/supabase/) — Supabase client factory (server, client, proxy)
- [next.config.mjs](next.config.mjs) — TypeScript errors ignored in build, images unoptimized
