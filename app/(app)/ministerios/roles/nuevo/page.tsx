'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function NuevoRolPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    nivel_acceso: '10',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const nivel = parseInt(form.nivel_acceso, 10)
    if (isNaN(nivel) || nivel < 1 || nivel > 99) {
      setError('El nivel de acceso debe ser un número entre 1 y 99 (100 está reservado para admin_general)')
      setLoading(false)
      return
    }

    const res = await fetch('/api/ministerios/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        nivel_acceso: nivel,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear el rol')
      setLoading(false)
      return
    }

    router.push(`/ministerios/roles/${data.id}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/ministerios/roles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a Roles
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Nuevo Rol del Sistema
        </h1>
        <p className="mt-2 text-muted-foreground">
          Crea un nuevo rol y luego configura sus permisos
        </p>
      </div>

      <Card className="border-border bg-card max-w-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Datos del Rol</CardTitle>
          <CardDescription>
            El nivel de acceso determina la jerarquía del rol (1–99). Nivel 100 está reservado para admin_general.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del rol *</Label>
              <Input
                id="nombre"
                required
                placeholder="ej: coordinador_regional"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Sin espacios, en minúsculas. Ej: responsable_zona</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe las responsabilidades de este rol..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel_acceso">Nivel de acceso (1–99) *</Label>
              <Input
                id="nivel_acceso"
                type="number"
                min={1}
                max={99}
                required
                value={form.nivel_acceso}
                onChange={e => setForm(f => ({ ...f, nivel_acceso: e.target.value }))}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Rol'}
              </Button>
              <Link href="/ministerios/roles">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
