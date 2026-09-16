'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { UserCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { nombreCompletoConApodo } from '@/lib/personas/nombre'

interface Asignacion {
  id: string
  fecha_inicio: string | null
  fecha_fin: string | null
  organizacion: { nombre: string } | null
  ministerio: { nombre: string; tipo: string } | null
  persona: { nombre: string; apellido: string; apodo?: string | null; email: string | null } | null
}

const tipoLabel: Record<string, string> = {
  conduccion: 'Conducción',
  pastoral: 'Pastoral',
  servicio: 'Servicio',
  sistema: 'Sistema',
}

export default function EditarAsignacionPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [asignacion, setAsignacion] = useState<Asignacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('asignaciones_ministerio')
        .select(`
          id, fecha_inicio, fecha_fin,
          organizacion:organizaciones!organizacion_id(nombre),
          ministerio:ministerios!ministerio_id(nombre, tipo),
          persona:personas!persona_id(nombre, apellido, apodo, email)
        `)
        .eq('id', id)
        .single()
      if (data) {
        setAsignacion(data as Asignacion)
        setFechaInicio(data.fecha_inicio ?? '')
        setFechaFin(data.fecha_fin ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('asignaciones_ministerio')
      .update({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
      })
      .eq('id', id)

    if (err) {
      setError('Error al guardar: ' + err.message)
      setSaving(false)
      return
    }

    router.push('/ministerios/asignaciones')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!asignacion) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Asignación no encontrada.</p>
        <Link href="/ministerios/asignaciones">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    )
  }

  const persona = asignacion.persona
  const nombreCompleto = persona
    ? nombreCompletoConApodo(persona)
    : 'Persona sin perfil'

  return (
    <div className="space-y-8">
      <div>
        <Link href="/ministerios/asignaciones" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a Asignaciones
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="h-8 w-8 text-primary" />
          Editar Asignación
        </h1>
      </div>

      <Card className="border-border bg-card max-w-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Modificar Fechas</CardTitle>
          <CardDescription>
            Ajusta las fechas de inicio y fin de la asignación para el historial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumen de la asignación */}
          <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Persona</span>
              <span className="font-medium text-foreground">{nombreCompleto}</span>
            </div>
            {persona?.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground">{persona.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-medium text-foreground">
                {asignacion.ministerio?.nombre ?? '—'}
                {asignacion.ministerio?.tipo && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({tipoLabel[asignacion.ministerio.tipo] ?? asignacion.ministerio.tipo})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organización</span>
              <span className="text-foreground">
                {asignacion.organizacion?.nombre ?? 'Global'}
              </span>
            </div>
          </div>

          {/* Formulario de fechas */}
          <form onSubmit={handleGuardar} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="fecha_inicio">
                Fecha de inicio <span className="text-destructive">*</span>
              </label>
              <input
                id="fecha_inicio"
                type="date"
                required
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="fecha_fin">
                Fecha de fin
                <span className="ml-1 text-xs text-muted-foreground">(dejar vacío si sigue activo)</span>
              </label>
              <input
                id="fecha_fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Link href="/ministerios/asignaciones">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
