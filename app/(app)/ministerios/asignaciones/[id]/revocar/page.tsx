'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { UserCheck, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface Asignacion {
  id: string
  fecha_inicio: string | null
  organizacion: { nombre: string } | null
  rol_sistema: { nombre: string; nivel_acceso: number } | null
  persona: { nombre: string; apellido: string; email: string | null } | null
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

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('usuario_roles')
        .select(`
          id, fecha_inicio,
          organizacion:organizaciones!organizacion_id(nombre),
          rol_sistema:roles_sistema!rol_sistema_id(nombre, nivel_acceso),
          persona:personas!persona_id(nombre, apellido, email)
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

    const hoy = new Date().toISOString().split('T')[0]
    const { error: err } = await supabase
      .from('usuario_roles')
      .update({ activo: false, fecha_fin: hoy })
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
    ? `${persona.nombre} ${persona.apellido}`
    : 'Usuario sin perfil'

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
              <span className="text-muted-foreground">Usuario</span>
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
                {asignacion.rol_sistema?.nombre ?? '—'}
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
              <span className="text-foreground">{asignacion.fecha_inicio ?? '—'}</span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={handleRevocar}
              disabled={revoking}
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
