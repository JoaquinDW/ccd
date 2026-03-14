'use client'

export const dynamic = 'force-dynamic'

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

interface Ministerio {
  id: string
  nombre: string
  tipo: string
  nivel_acceso: number
}

interface Org {
  id: string
  nombre: string
}

const tipoLabel: Record<string, string> = {
  conduccion: 'Conducción',
  pastoral: 'Pastoral',
  servicio: 'Servicio',
  sistema: 'Sistema',
}

export default function NuevaAsignacionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [ministerios, setMinisterios] = useState<Ministerio[]>([])
  const [organizaciones, setOrganizaciones] = useState<Org[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [form, setForm] = useState({
    persona_id: '',
    ministerio_id: '',
    organizacion_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: personasData, error: personasError }, { data: ministeriosData }, { data: orgsData }] = await Promise.all([
        supabase
          .from('personas')
          .select('id, nombre, apellido, email')
          .is('fecha_baja', null)
          .order('apellido')
          .order('nombre'),
        supabase
          .from('ministerios')
          .select('id, nombre, tipo, nivel_acceso')
          .eq('activo', true)
          .order('tipo')
          .order('nombre'),
        supabase
          .from('organizaciones')
          .select('id, nombre')
          .is('fecha_baja', null)
          .order('nombre'),
      ])
      if (personasError) console.error('Error cargando personas:', personasError)
      setPersonas(personasData ?? [])
      setMinisterios(ministeriosData ?? [])
      setOrganizaciones(orgsData ?? [])
      setLoadingData(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.persona_id || !form.ministerio_id) {
      setError('Debes seleccionar una persona y un ministerio')
      setLoading(false)
      return
    }

    const orgId = form.organizacion_id || null
    const hoy = new Date().toISOString().split('T')[0]

    // Cerrar asignación activa existente para la misma combinación (patrón histórico)
    let closeQuery = supabase
      .from('asignaciones_ministerio')
      .update({ estado: 'inactivo', fecha_fin: hoy })
      .eq('persona_id', form.persona_id)
      .eq('ministerio_id', form.ministerio_id)
      .eq('estado', 'activo')

    if (orgId) {
      closeQuery = closeQuery.eq('organizacion_id', orgId)
    } else {
      closeQuery = closeQuery.is('organizacion_id', null)
    }

    await closeQuery

    // Insertar nueva asignación
    const { error: insertError } = await supabase
      .from('asignaciones_ministerio')
      .insert({
        persona_id: form.persona_id,
        ministerio_id: form.ministerio_id,
        organizacion_id: orgId,
        fecha_inicio: form.fecha_inicio || hoy,
        estado: 'activo',
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
          Nueva Asignación de Ministerio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Asigna un ministerio a una persona. Los permisos de sistema del ministerio se activan automáticamente.
        </p>
      </div>

      <Card className="border-border bg-card max-w-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Datos de la Asignación</CardTitle>
          <CardDescription>
            Podés asignar ministerios a cualquier persona. Si el ministerio tiene permisos de sistema configurados, se aplicarán al hacer login.
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
              <Label htmlFor="ministerio_id">Ministerio *</Label>
              <select
                id="ministerio_id"
                required
                value={form.ministerio_id}
                onChange={e => setForm(f => ({ ...f, ministerio_id: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Selecciona un ministerio...</option>
                {ministerios.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {tipoLabel[m.tipo] ?? m.tipo}{m.nivel_acceso > 0 ? ` (acceso nivel ${m.nivel_acceso})` : ''}
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
                Dejar vacío para acceso global; seleccionar para limitar el ministerio a una organización específica.
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
                {loading ? 'Asignando...' : 'Asignar Ministerio'}
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
