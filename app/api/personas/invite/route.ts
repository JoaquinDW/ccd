import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { internalEmailFor, normalizeUsername } from '@/lib/auth/username'

export async function POST(request: Request) {
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (!canPerform(ctx, 'person.create')) {
    return NextResponse.json(
      { error: 'No tenés permiso para crear personas' },
      { status: 403 }
    )
  }

  const { nombre_usuario, persona_id, password, rol_sistema_id, organizacion_id } = await request.json()

  if (!nombre_usuario || !persona_id || !password) {
    return NextResponse.json(
      { error: 'El nombre de usuario, la persona y la contraseña son requeridos' },
      { status: 400 }
    )
  }

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'La contraseña inicial debe tener al menos 8 caracteres' },
      { status: 400 }
    )
  }

  if (typeof nombre_usuario !== 'string' || typeof persona_id !== 'string') {
    return NextResponse.json(
      { error: 'Los datos para crear el acceso no son válidos' },
      { status: 400 }
    )
  }

  const username = normalizeUsername(nombre_usuario)
  if (username.length < 3 || username.length > 30 || !/^[a-z0-9._-]+$/.test(username)) {
    return NextResponse.json(
      { error: 'El nombre de usuario debe tener entre 3 y 30 caracteres y solo puede contener letras, números, puntos, guiones y guiones bajos.' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Persist nombre_usuario to personas table
  const { data: persona, error: usernameError } = await supabaseAdmin
    .from('personas')
    .update({ nombre_usuario: username, debe_cambiar_password: true })
    .eq('id', persona_id)
    .select('id')
    .maybeSingle()

  if (usernameError) {
    // Check for unique constraint violation
    if (usernameError.code === '23505') {
      return NextResponse.json(
        { error: 'El nombre de usuario ya está en uso. Elegí otro.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: usernameError.message }, { status: 400 })
  }

  if (!persona) {
    return NextResponse.json({ error: 'No se encontró la persona' }, { status: 404 })
  }

  // Construct fake internal email — never exposed to users.
  // Convention: {username}@ccd.internal (non-routable domain)
  const fakeEmail = internalEmailFor(username)

  // Create user directly with the explicitly assigned temporary password.
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: fakeEmail,
    password,
    email_confirm: true,
    user_metadata: { persona_id },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya está en uso. Elegí otro.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // If a rol_sistema_id was provided, assign it after the trigger creates perfiles_usuario.
  // We wait a moment for the DB trigger to run, then look up the perfil and assign the role.
  if (rol_sistema_id && authData.user) {
    // Poll for the perfil_usuario created by the trigger (up to ~2s)
    let perfilId: string | null = null
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 400))
      const { data: perfil } = await supabaseAdmin
        .from('perfiles_usuario')
        .select('id')
        .eq('id', authData.user.id)
        .single()
      if (perfil) { perfilId = perfil.id; break }
    }

    if (perfilId) {
      // Remove the default solo_lectura role assigned by the trigger, then insert the chosen one
      await supabaseAdmin
        .from('usuario_roles')
        .delete()
        .eq('usuario_id', perfilId)

      const rolePayload: Record<string, unknown> = {
        usuario_id: perfilId,
        rol_sistema_id,
      }
      if (organizacion_id) rolePayload.organizacion_id = organizacion_id

      const { error: rolError } = await supabaseAdmin
        .from('usuario_roles')
        .insert(rolePayload)

      if (rolError) {
        // Non-fatal: user was created, log the error
        console.error('Error asignando rol:', rolError.message)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
