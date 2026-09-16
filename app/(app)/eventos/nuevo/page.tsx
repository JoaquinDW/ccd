export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { getTiposEventoPermitidos } from '@/lib/auth/tipos-eventos-permitidos'
import NuevoEventoForm from './form'

export default async function NuevoEventoPage() {
  const ctx = await getUserContext()

  if (!ctx) redirect('/auth/login')

  if (!canPerform(ctx, 'event.create')) {
    redirect('/eventos')
  }

  const supabase = await createClient()

  // Load casas de retiro activas
  const { data: casasRetiro } = await supabase
    .from('casas_retiro')
    .select('id, nombre')
    .is('fecha_baja', null)
    .eq('estado', 'activa')
    .order('nombre')

  // Load tipos de eventos activos solamente
  const { data: tiposEventosData } = await supabase
    .from('tipos_eventos')
    .select('id, nombre, categoria, requiere_discernimiento_confra, requiere_discernimiento_eqt, requisitos, activo')
    .eq('activo', true)
    .order('nombre')

  // Filtrar por los que el usuario puede solicitar según tipo_evento_roles_solicitantes
  const tiposEventoPermitidos = await getTiposEventoPermitidos(
    supabase,
    ctx,
    (tiposEventosData ?? []).map(t => t.id)
  )
  const tiposEventos = (tiposEventosData ?? []).filter(t => tiposEventoPermitidos.has(t.id))

  // Load personas cecistas con modo servidor o familiar (para coordinadores)
  const { data: personasModos } = await supabase
    .from('persona_modos')
    .select('persona_id, modo, personas(id, nombre, apellido)')
    .in('modo', ['servidor', 'familiar'])
    .is('fecha_fin', null)
    .is('personas.fecha_baja', null)

  const personasCoordinadores = (personasModos ?? [])
    .filter((pm): pm is typeof pm & { personas: { id: string; nombre: string; apellido: string } } =>
      pm.personas !== null && typeof pm.personas === 'object' && !Array.isArray(pm.personas)
    )
    .map(pm => ({
      id: (pm.personas as { id: string; nombre: string; apellido: string }).id,
      nombre: `${(pm.personas as { id: string; nombre: string; apellido: string }).nombre} ${(pm.personas as { id: string; nombre: string; apellido: string }).apellido}`.trim(),
    }))
    // Deduplicate by id (a person can have multiple active modos)
    .filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  // Load organizations the user has access to
  let fraternidades: { id: string; nombre: string; parent_id: string | null }[] = []
  let confraternidades: { id: string; nombre: string }[] = []
  let personaNombre = ''

  // Get the user's persona name
  if (ctx.persona_id) {
    const { data: persona } = await supabase
      .from('personas')
      .select('nombre, apellido')
      .eq('id', ctx.persona_id)
      .single()
    if (persona) {
      personaNombre = `${persona.nombre} ${persona.apellido}`.trim()
    }
  }

  if (ctx.is_admin) {
    // Admins can pick any fraternidad
    const { data: orgs } = await supabase
      .from('organizaciones')
      .select('id, nombre, tipo, parent_id')
      .is('fecha_baja', null)
      .in('tipo', ['fraternidad', 'confraternidad'])
      .order('nombre')

    fraternidades = (orgs ?? []).filter(o => o.tipo === 'fraternidad')
    confraternidades = (orgs ?? []).filter(o => o.tipo === 'confraternidad')
  } else {
    // Load only the orgs the user has explicit access to
    if (ctx.org_ids.length === 0) {
      // No orgs — show empty form with warning
      return (
        <NuevoEventoForm
          fraternidades={[]}
          confraternidades={[]}
          tiposEventos={tiposEventos ?? []}
          casasRetiro={casasRetiro ?? []}
          personasCoordinadores={personasCoordinadores}
          personaNombre={personaNombre}
          isAdmin={false}
          canEditConfra={false}
        />
      )
    }

    const { data: orgs } = await supabase
      .from('organizaciones')
      .select('id, nombre, tipo, parent_id')
      .in('id', ctx.org_ids)
      .is('fecha_baja', null)
      .order('nombre')

    const userFraternidades = (orgs ?? []).filter(o => o.tipo === 'fraternidad')
    fraternidades = userFraternidades

    // Load confraternidades (parents of the user's fraternidades)
    const parentIds = userFraternidades
      .map(f => f.parent_id)
      .filter(Boolean) as string[]

    if (parentIds.length > 0) {
      const { data: confras } = await supabase
        .from('organizaciones')
        .select('id, nombre')
        .in('id', parentIds)
        .is('fecha_baja', null)
        .order('nombre')
      confraternidades = confras ?? []
    }
  }

  const canEditConfra = canPerform(ctx, 'event.approve_confra') || canPerform(ctx, 'event.approve_eqt')

  return (
    <NuevoEventoForm
      fraternidades={fraternidades}
      confraternidades={confraternidades}
      tiposEventos={tiposEventos ?? []}
      casasRetiro={casasRetiro ?? []}
      personasCoordinadores={personasCoordinadores}
      personaNombre={personaNombre}
      isAdmin={ctx.is_admin}
      canEditConfra={canEditConfra}
    />
  )
}
