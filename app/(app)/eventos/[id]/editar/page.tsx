export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import EditarEventoForm from './form'

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, ctx] = await Promise.all([createClient(), getUserContext()])

  if (!ctx) redirect('/auth/login')

  const { data: evento } = await supabase
    .from('eventos')
    .select('id, organizacion_id, fraternidad_id')
    .eq('id', id)
    .single()

  if (!evento) notFound()

  // Mismo criterio que el botón "Editar" del detalle: event.update scopeado a la
  // organización del evento o a su fraternidad.
  const canEdit =
    canPerform(ctx, 'event.update', evento.organizacion_id ?? null) ||
    (evento.fraternidad_id
      ? canPerform(ctx, 'event.update', evento.fraternidad_id)
      : false)

  if (!canEdit) notFound()

  return <EditarEventoForm isAdmin={ctx.is_admin} />
}
