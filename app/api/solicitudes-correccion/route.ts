import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/context'
import { sendEmail, block } from '@/lib/email'

export async function POST(request: NextRequest) {
  const ctx = await getUserContext()
  if (!ctx || !ctx.persona_id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const campo = typeof body.campo === 'string' ? body.campo.trim() : ''
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : ''

  if (!campo || !descripcion) {
    return NextResponse.json({ error: 'Falta indicar el campo y la descripción' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('nombre, apellido, email')
    .eq('id', ctx.persona_id)
    .single()

  const { error } = await supabase.from('solicitudes_correccion').insert({
    persona_id: ctx.persona_id,
    creado_por: ctx.auth_user_id,
    campo,
    descripcion,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Best-effort: si no hay EMAIL_ADMIN_CONTACTO configurada, sendEmail
  // devuelve skipped: 'no_recipients' sin romper el flujo.
  await sendEmail({
    to: process.env.EMAIL_ADMIN_CONTACTO ?? '',
    subject: 'Nueva solicitud de corrección de datos',
    blocks: [
      block.heading('Nueva solicitud de corrección de datos'),
      block.facts([
        { label: 'Persona', value: persona ? `${persona.nombre} ${persona.apellido}` : ctx.persona_id },
        { label: 'Email', value: persona?.email ?? '—' },
        { label: 'Campo reportado', value: campo },
      ]),
      block.paragraph(descripcion),
    ],
  })

  return NextResponse.json({ ok: true })
}
