'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { UserCheck, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { formatDateAR } from '@/lib/utils'
import { nombreCompletoConApodo } from '@/lib/personas/nombre'

interface Asignacion {
  id: string
  fecha_inicio: string | null
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

export default function RevocarAsignacionPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [asignacion, setAsignacion] = useState<Asignacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0])
  const [motivoFin, setMotivoFin] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('asignaciones_ministerio')
        .select(`
          id, fecha_inicio,
          organizacion:organizaciones!organizacion_id(nombre),
          ministerio:ministerios!ministerio_id(nombre, tipo),
          persona:personas!persona_id(nombre, apellido, apodo, email)
        `)
        .eq('id', id)
        .single()
      setAsignacion(data as Asignacion | null)
      setLoading(false)
    }
    load()
  }, [id])

  const handleRevocar = async () => {
    setRevoking(true)
    setError(null)

    const { error: err } = await supabase
      .from('asignaciones_ministerio')
      .update({ estado: 'inactivo', fecha_fin: fechaFin, motivo_fin: motivoFin || null })
      .eq('id', id)

    if (err) {
      setError('Error al revocar la asignación: ' + err.message)
      setRevoking(false)
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
          Revocar Asignación
        </h1>
      </div>

      <Card className="border-border bg-card max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-foreground">Confirmar Revocación</CardTitle>
          </div>
          <CardDescription>
            Esta acción cerrará la asignación de rol. El registro histórico se conservará.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Persona</span>
              <span className="font-medium text-foreground">{nombreCompleto}</span>
            </div>
            {persona?.email && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground">{persona.email}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Organización</span>
              <span className="text-foreground">
                {asignacion.organizacion?.nombre ?? 'Global'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Asignado desde</span>
              <span className="text-foreground">{formatDateAR(asignacion.fecha_inicio)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="fechaFin">Fecha de fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="motivoFin">Motivo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                id="motivoFin"
                placeholder="Describir el motivo de la revocación..."
                value={motivoFin}
                onChange={(e) => setMotivoFin(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={handleRevocar}
              disabled={revoking || !fechaFin}
            >
              {revoking ? 'Revocando...' : 'Revocar Asignación'}
            </Button>
            <Link href="/ministerios/asignaciones">
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
