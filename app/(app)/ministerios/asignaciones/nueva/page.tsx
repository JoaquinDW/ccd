'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

interface Persona {
  id: string
  nombre: string
  apellido: string
  email: string | null
}

interface Rol {
  id: string
  nombre: string
  nivel_acceso: number
}

interface Org {
  id: string
  nombre: string
}

export default function NuevaAsignacionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [organizaciones, setOrganizaciones] = useState<Org[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [form, setForm] = useState({
    persona_id: '',
    rol_sistema_id: '',
    organizacion_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: personasData, error: personasError }, { data: rolesData }, { data: orgsData }] = await Promise.all([
        supabase
          .from('personas')
          .select('id, nombre, apellido, email')
          .is('fecha_baja', null)
          .order('apellido')
          .order('nombre'),
        supabase
          .from('roles_sistema')
          .select('id, nombre, nivel_acceso')
          .eq('activo', true)
          .order('nivel_acceso', { ascending: false }),
        supabase
          .from('organizaciones')
          .select('id, nombre')
          .is('fecha_baja', null)
          .order('nombre'),
      ])
      if (personasError) console.error('Error cargando personas:', personasError)
      setPersonas(personasData ?? [])
      setRoles(rolesData ?? [])
      setOrganizaciones(orgsData ?? [])
      setLoadingData(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.persona_id || !form.rol_sistema_id) {
      setError('Debes seleccionar una persona y un rol')
      setLoading(false)
      return
    }

    const orgId = form.organizacion_id || null
    const hoy = new Date().toISOString().split('T')[0]

    // Buscar si la persona ya tiene perfiles_usuario (cuenta activa)
    const { data: perfil } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .eq('persona_id', form.persona_id)
      .single()

    const usuarioId = perfil?.id ?? null

    // Cerrar asignación activa existente para la misma combinación (patrón histórico)
    // Buscar tanto por persona_id como por usuario_id
    const closeFilters: Record<string, any> = {
      rol_sistema_id: form.rol_sistema_id,
      activo: true,
    }

    let closeQuery = supabase
      .from('usuario_roles')
      .update({ activo: false, fecha_fin: hoy })
      .eq('rol_sistema_id', form.rol_sistema_id)
      .eq('activo', true)

    if (orgId) {
      closeQuery = closeQuery.eq('organizacion_id', orgId)
    } else {
      closeQuery = closeQuery.is('organizacion_id', null)
    }

    // Cerrar por persona_id
    await closeQuery.eq('persona_id', form.persona_id)

    // También cerrar por usuario_id si tiene cuenta
    if (usuarioId) {
      let closeByUser = supabase
        .from('usuario_roles')
        .update({ activo: false, fecha_fin: hoy })
        .eq('usuario_id', usuarioId)
        .eq('rol_sistema_id', form.rol_sistema_id)
        .eq('activo', true)

      if (orgId) {
        closeByUser = closeByUser.eq('organizacion_id', orgId)
      } else {
        closeByUser = closeByUser.is('organizacion_id', null)
      }

      await closeByUser
    }

    // Insertar nueva asignación con persona_id (y usuario_id si tiene cuenta)
    const { error: insertError } = await supabase
      .from('usuario_roles')
      .insert({
        persona_id: form.persona_id,
        usuario_id: usuarioId,
        rol_sistema_id: form.rol_sistema_id,
        organizacion_id: orgId,
        fecha_inicio: form.fecha_inicio || hoy,
        activo: true,
      })

    if (insertError) {
      setError('Error al crear la asignación: ' + insertError.message)
      setLoading(false)
      return
    }

    router.push('/ministerios/asignaciones')
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/ministerios/asignaciones" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a Asignaciones
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="h-8 w-8 text-primary" />
          Nueva Asignación de Rol
        </h1>
        <p className="mt-2 text-muted-foreground">
          Asigna un rol del sistema a una persona
        </p>
      </div>

      <Card className="border-border bg-card max-w-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Datos de la Asignación</CardTitle>
          <CardDescription>
            Podés asignar roles a cualquier persona, incluso si aún no tiene cuenta en el sistema.
            Cuando haga su primer login, los roles se activarán automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="persona_id">Persona *</Label>
              <select
                id="persona_id"
                required
                value={form.persona_id}
                onChange={e => setForm(f => ({ ...f, persona_id: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Selecciona una persona...</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.apellido}, {p.nombre}{p.email ? ` — ${p.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol_sistema_id">Rol *</Label>
              <select
                id="rol_sistema_id"
                required
                value={form.rol_sistema_id}
                onChange={e => setForm(f => ({ ...f, rol_sistema_id: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Selecciona un rol...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} (nivel {r.nivel_acceso})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizacion_id">Organización (opcional)</Label>
              <select
                id="organizacion_id"
                value={form.organizacion_id}
                onChange={e => setForm(f => ({ ...f, organizacion_id: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Global (sin restricción de organización)</option>
                {organizaciones.map(o => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Dejar vacío para acceso global; seleccionar para limitar el acceso a una organización específica.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de inicio *</Label>
              <Input
                id="fecha_inicio"
                type="date"
                required
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Asignando...' : 'Asignar Rol'}
              </Button>
              <Link href="/ministerios/asignaciones">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
