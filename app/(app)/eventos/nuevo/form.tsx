'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

type OrgOption = { id: string; nombre: string; tipo: string }

type Props = {
  organizaciones: OrgOption[]
  casasRetiro: OrgOption[]
  defaultOrgId?: string
}

export default function NuevoEventoForm({ organizaciones, casasRetiro, defaultOrgId = '' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'convivencia',
    fecha_inicio: '',
    fecha_fin: '',
    organizacion_id: defaultOrgId,
    casa_retiro_id: '',
    cupo_maximo: '30',
    precio: '',
    audiencia: 'cerrado',
    modalidad: 'presencial',
    estado: 'borrador',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al crear el evento')
      }

      router.push('/eventos')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el evento')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-6">
      <Link href="/eventos" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Eventos
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nuevo Evento</CardTitle>
          <CardDescription>Registra un nuevo evento en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {organizaciones.length === 0 && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-400">
                No tenés organizaciones asignadas. Contactá al administrador para que te asigne permisos.
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Convivencia San José 2026"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* Tipo y Estado */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="convivencia">Convivencia</option>
                  <option value="retiro">Retiro</option>
                  <option value="taller">Taller</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="borrador">Borrador</option>
                  <option value="solicitado">Solicitado</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="publicado">Publicado</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                <Input
                  id="fecha_inicio"
                  name="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                <Input
                  id="fecha_fin"
                  name="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Organización — solo las permitidas */}
            <div className="space-y-2">
              <Label htmlFor="organizacion_id">Organización</Label>
              <select
                id="organizacion_id"
                name="organizacion_id"
                value={formData.organizacion_id}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Sin organización</option>
                {organizaciones.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.nombre} ({org.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Casa de Retiro */}
            <div className="space-y-2">
              <Label htmlFor="casa_retiro_id">Casa de Retiro</Label>
              <select
                id="casa_retiro_id"
                name="casa_retiro_id"
                value={formData.casa_retiro_id}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Sin casa de retiro</option>
                {casasRetiro.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Cupo y Precio */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cupo_maximo">Cupo Máximo</Label>
                <Input
                  id="cupo_maximo"
                  name="cupo_maximo"
                  type="number"
                  min="1"
                  value={formData.cupo_maximo}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.precio}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Audiencia y Modalidad */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audiencia">Audiencia</Label>
                <select
                  id="audiencia"
                  name="audiencia"
                  value={formData.audiencia}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="cerrado">Cerrado</option>
                  <option value="abierto">Abierto</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modalidad">Modalidad</Label>
                <select
                  id="modalidad"
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="bimodal">Bimodal</option>
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                placeholder="Descripción del evento..."
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm min-h-20"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={loading || organizaciones.length === 0}>
                {loading ? 'Guardando...' : 'Crear Evento'}
              </Button>
              <Link href="/eventos">
                <Button type="button" variant="outline" className="bg-transparent">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
