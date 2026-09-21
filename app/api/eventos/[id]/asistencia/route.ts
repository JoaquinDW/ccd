import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { esCentralizadorDeEvento } from '@/lib/eventos/cierre'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const participanteId = body?.participante_id as string | undefined
  const metodo = body?.metodo as string | undefined

  if (!participanteId || (metodo !== 'qr' && metodo !== 'manual')) {
    return NextResponse.json(
      { error: 'Parámetros inválidos: se requiere participante_id y metodo (qr|manual).' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // The event must be publishable/running to take attendance
  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select('id, estado, organizacion_id, centralizador_1_persona_id, centralizador_2_persona_id, centralizador_3_persona_id')
    .eq('id', id)
    .single()

  if (eventoError || !evento) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  // Esta ruta solo validaba que hubiera sesión: cualquier usuario logueado
  // podía marcar la asistencia de un participante de cualquier evento. El
  // control replica el de la página /eventos/[id]/asistencia.
  if (
    !canPerform(ctx, 'event.update', evento.organizacion_id ?? null) &&
    !esCentralizadorDeEvento(ctx, evento)
  ) {
    return NextResponse.json(
      { error: 'No tenés permiso para tomar asistencia en este evento' },
      { status: 403 }
    )
  }

  if (evento.estado !== 'publicado' && evento.estado !== 'en_curso') {
    return NextResponse.json(
      { error: `Solo se puede tomar asistencia en eventos publicados o en curso. Estado actual: "${evento.estado}".` },
      { status: 422 }
    )
  }

  // The QR must belong to a participant of THIS event
  const { data: participante, error: partError } = await supabase
    .from('evento_participantes')
    .select('id, evento_id, estado_participacion, persona:personas!persona_id(id, nombre, apellido)')
    .eq('id', participanteId)
    .eq('evento_id', id)
    .single()

  if (partError || !participante) {
    return NextResponse.json(
      { error: 'El código no corresponde a un inscripto de este evento.' },
      { status: 404 }
    )
  }

  const persona = participante.persona as unknown as { nombre: string; apellido: string } | null
  const nombre = persona ? `${persona.nombre} ${persona.apellido}` : 'Participante'

  // Already present → idempotent success
  if (participante.estado_participacion === 'en_curso') {
    return NextResponse.json({ estado: 'en_curso', nombre, already: true })
  }

  if (participante.estado_participacion !== 'inscripto') {
    return NextResponse.json(
      {
        error: `${nombre} no está en estado "inscripto" (estado actual: "${participante.estado_participacion}"). No se puede marcar asistencia.`,
      },
      { status: 422 }
    )
  }

  const { error: updateError } = await supabase
    .from('evento_participantes')
    .update({
      estado_participacion: 'en_curso',
      fecha_asistencia: new Date().toISOString(),
      asistencia_metodo: metodo,
      asistencia_por: ctx.persona_id ?? null,
    })
    .eq('id', participanteId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ estado: 'en_curso', nombre, already: false })
}
