import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (!canPerform(ctx, 'person.update')) {
    return NextResponse.json({ error: 'No tenés permiso para editar personas' }, { status: 403 })
  }

  const { id } = await params
  const { nombre_usuario } = await request.json()

  if (!nombre_usuario || typeof nombre_usuario !== 'string') {
    return NextResponse.json({ error: 'nombre_usuario es requerido' }, { status: 400 })
  }

  const normalizado = nombre_usuario.toLowerCase().trim()

  if (!/^[a-z0-9._-]+$/.test(normalizado)) {
    return NextResponse.json(
      { error: 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Update personas table
  const { error: personaError } = await supabaseAdmin
    .from('personas')
    .update({ nombre_usuario: normalizado })
    .eq('id', id)

  if (personaError) {
    if (personaError.code === '23505') {
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso. Elegí otro.' }, { status: 409 })
    }
    return NextResponse.json({ error: personaError.message }, { status: 400 })
  }

  // Find the Supabase auth user via perfiles_usuario
  const { data: perfil } = await supabaseAdmin
    .from('perfiles_usuario')
    .select('id')
    .eq('persona_id', id)
    .single()

  if (perfil) {
    const nuevaFakeEmail = `${normalizado}@ccd.internal`
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(perfil.id, {
      email: nuevaFakeEmail,
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        // Revert personas table change
        const supabase = await createClient()
        await supabase.from('personas').update({ nombre_usuario: null }).eq('id', id)
        return NextResponse.json({ error: 'El nombre de usuario ya está en uso. Elegí otro.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
