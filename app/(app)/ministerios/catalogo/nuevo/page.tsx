'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function NuevoMinisterioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'pastoral',
    nivel: 'fraternidad',
    nivel_acceso: '0',
    requiere_acta: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const nivelAcceso = parseInt(form.nivel_acceso, 10)
    if (isNaN(nivelAcceso) || nivelAcceso < 0 || nivelAcceso > 99) {
      setError('El nivel de acceso debe ser un número entre 0 y 99 (100 está reservado para admin_general)')
      setLoading(false)
      return
    }

    const nombre = form.nombre.trim()
    if (!nombre) {
      setError('El nombre es obligatorio')
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase
      .from('ministerios')
      .insert({
        nombre,
        tipo: form.tipo,
        nivel: form.nivel,
        nivel_acceso: nivelAcceso,
        requiere_acta: form.requiere_acta,
        activo: true,
      })
      .select('id')
      .single()

    if (err) {
      setError(err.message.includes('unique') ? 'Ya existe un ministerio con ese nombre' : 'Error al crear el ministerio: ' + err.message)
      setLoading(false)
      return
    }

    router.push(`/ministerios/catalogo/${data.id}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/ministerios/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al Catálogo
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          Nuevo Ministerio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Crea un nuevo ministerio y luego configura sus permisos de acceso al sistema
        </p>
      </div>

      <Card className="border-border bg-card max-w-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Datos del Ministerio</CardTitle>
          <CardDescription>
            El nivel de acceso al sistema (0 = sin acceso técnico, 1–99 = acceso configurable).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                required
                placeholder="ej: Coordinador de Zona"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                required
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="conduccion">Conducción</option>
                <option value="pastoral">Pastoral</option>
                <option value="servicio">Servicio</option>
                <option value="sistema">Sistema (acceso técnico)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel">Nivel organizacional *</Label>
              <select
                id="nivel"
                required
                value={form.nivel}
                onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="comunidad">Comunidad</option>
                <option value="confraternidad">Confraternidad</option>
                <option value="fraternidad">Fraternidad</option>
                <option value="evento">Evento</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel_acceso">Nivel de acceso al sistema (0–99)</Label>
              <Input
                id="nivel_acceso"
                type="number"
                min={0}
                max={99}
                value={form.nivel_acceso}
                onChange={e => setForm(f => ({ ...f, nivel_acceso: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                0 = sin acceso técnico (ministerio pastoral sin permisos de sistema)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiere_acta"
                checked={form.requiere_acta}
                onChange={e => setForm(f => ({ ...f, requiere_acta: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="requiere_acta" className="cursor-pointer">
                Requiere acta de asignación
              </Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Ministerio'}
              </Button>
              <Link href="/ministerios/catalogo">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
