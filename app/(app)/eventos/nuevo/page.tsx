import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import NuevoEventoForm from './form'

export default async function NuevoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ organizacion_id?: string }>
}) {
  const ctx = await getUserContext()

  if (!ctx) redirect('/auth/login')

  // Only users with event.create permission can access this page
  if (!canPerform(ctx, 'event.create')) {
    redirect('/eventos')
  }

  const supabase = await createClient()
  // null = all orgs (admin), [] = none, [...ids] = scoped
  const allowedOrgIds = ctx.is_admin ? null : (ctx.org_ids.length > 0 ? ctx.org_ids : [])

  // Load organizations filtered by permission
  let orgsQuery = supabase
    .from('organizaciones')
    .select('id, nombre, tipo')
    .is('fecha_baja', null)
    .order('nombre')

  if (allowedOrgIds !== null && allowedOrgIds.length > 0) {
    orgsQuery = orgsQuery.in('id', allowedOrgIds)
  } else if (allowedOrgIds !== null && allowedOrgIds.length === 0) {
    // No orgs allowed — pass empty list
    const { searchParams: sp } = { searchParams: await searchParams }
    return (
      <NuevoEventoForm
        organizaciones={[]}
        casasRetiro={[]}
        defaultOrgId={sp?.organizacion_id ?? ''}
      />
    )
  }

  const [{ data: orgs }, sp] = await Promise.all([
    orgsQuery,
    searchParams,
  ])

  const organizaciones = (orgs ?? []).filter(o => o.tipo !== 'casa_retiro')
  const casasRetiro = (orgs ?? []).filter(o => o.tipo === 'casa_retiro')

  // Also load all casas_retiro regardless of permission (they are venues, not scoped)
  let casasRetiroAll = casasRetiro
  if (allowedOrgIds !== null) {
    const { data: allCasas } = await supabase
      .from('organizaciones')
      .select('id, nombre, tipo')
      .eq('tipo', 'casa_retiro')
      .is('fecha_baja', null)
      .order('nombre')
    casasRetiroAll = allCasas ?? []
  }

  return (
    <NuevoEventoForm
      organizaciones={organizaciones}
      casasRetiro={casasRetiroAll}
      defaultOrgId={sp?.organizacion_id ?? ''}
    />
  )
}
