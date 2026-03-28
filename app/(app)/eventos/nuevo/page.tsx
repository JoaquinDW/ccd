export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import NuevoEventoForm from './form'

export default async function NuevoEventoPage() {
  const ctx = await getUserContext()

  if (!ctx) redirect('/auth/login')

  if (!canPerform(ctx, 'event.create')) {
    redirect('/eventos')
  }

  const supabase = await createClient()

  // Load tipos de eventos
  const { data: tiposEventos } = await supabase
    .from('tipos_eventos')
    .select('id, nombre, categoria, requiere_discernimiento_confra, requiere_discernimiento_eqt')
    .order('nombre')

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
          personaNombre={personaNombre}
          isAdmin={false}
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

  return (
    <NuevoEventoForm
      fraternidades={fraternidades}
      confraternidades={confraternidades}
      tiposEventos={tiposEventos ?? []}
      personaNombre={personaNombre}
      isAdmin={ctx.is_admin}
    />
  )
}
