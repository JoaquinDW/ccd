'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  nivel_acceso: number
  activo: boolean
}

export function EditRolForm({ rol }: { rol: Rol }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    descripcion: rol.descripcion ?? '',
    nivel_acceso: String(rol.nivel_acceso),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const nivel = parseInt(form.nivel_acceso, 10)
    if (isNaN(nivel) || nivel < 1 || nivel > 99) {
      // admin_general is always 100, don't allow changing
      if (rol.nivel_acceso !== 100) {
        setError('El nivel de acceso debe ser un número entre 1 y 99')
        setLoading(false)
        return
      }
    }

    const { error: err } = await supabase
      .from('roles_sistema')
      .update({
        descripcion: form.descripcion.trim() || null,
        nivel_acceso: rol.nivel_acceso === 100 ? 100 : nivel,
      })
      .eq('id', rol.id)

    if (err) {
      setError('Error al guardar los cambios')
    } else {
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Datos del Rol</CardTitle>
        <CardDescription>El nombre del rol no puede modificarse</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={rol.nombre} disabled className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descripcion">Descripción</Label>
            <Textarea
              id="edit-descripcion"
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              placeholder="Describe las responsabilidades..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-nivel">Nivel de acceso</Label>
            <Input
              id="edit-nivel"
              type="number"
              min={1}
              max={100}
              value={form.nivel_acceso}
              disabled={rol.nivel_acceso === 100}
              onChange={e => setForm(f => ({ ...f, nivel_acceso: e.target.value }))}
            />
            {rol.nivel_acceso === 100 && (
              <p className="text-xs text-muted-foreground">El nivel 100 está reservado para admin_general</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-600 dark:text-green-400">Guardado correctamente</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
