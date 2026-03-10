'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type OrgOption = { id: string; nombre: string; tipo: string }

export default function EditarOrganizacionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [orgsParent, setOrgsParent] = useState<OrgOption[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'fraternidad',
    codigo: '',
    parent_id: '',
    localidad: '',
    provincia: '',
    pais: 'Argentina',
    estado: 'activa',
    notas: '',
    telefono_1: '',
    telefono_2: '',
  })

  useEffect(() => {
    const supabase = createClient()

    // Load org data and parent options in parallel
    Promise.all([
      supabase
        .from('organizaciones')
        .select('id, nombre, tipo, codigo, parent_id, localidad, provincia, pais, estado, notas, telefono_1, telefono_2')
        .eq('id', id)
        .single(),
      supabase
        .from('organizaciones')
        .select('id, nombre, tipo')
        .is('fecha_baja', null)
        .neq('id', id)
        .order('nombre'),
    ]).then(([{ data: org, error: orgError }, { data: parents }]) => {
      if (orgError || !org) {
        setError('No se encontró la organización')
        setLoadingData(false)
        return
      }
      setFormData({
        nombre: org.nombre ?? '',
        tipo: org.tipo ?? 'fraternidad',
        codigo: org.codigo ?? '',
        parent_id: org.parent_id ?? '',
        localidad: org.localidad ?? '',
        provincia: org.provincia ?? '',
        pais: org.pais ?? 'Argentina',
        estado: org.estado ?? 'activa',
        notas: org.notas ?? '',
        telefono_1: org.telefono_1 ?? '',
        telefono_2: org.telefono_2 ?? '',
      })
      if (parents) setOrgsParent(parents)
      setLoadingData(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/organizaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al actualizar la organización')
      }

      router.push('/organizaciones')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar la organización'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Cargando organización...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/organizaciones" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Organizaciones
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Editar Organización</CardTitle>
          <CardDescription>Modifica los datos de la organización</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Fraternidad San José"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* Tipo y Código */}
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
                  <option value="comunidad">Comunidad</option>
                  <option value="confraternidad">Confraternidad</option>
                  <option value="fraternidad">Fraternidad</option>
                  <option value="casa_retiro">Casa de Retiro</option>
                  <option value="eqt">EQT</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  placeholder="ej. FRAT-001"
                  value={formData.codigo}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="activa">Activa</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>

            {/* Organización Padre */}
            <div className="space-y-2">
              <Label htmlFor="parent_id">Organización Padre</Label>
              <select
                id="parent_id"
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Sin organización padre</option>
                {orgsParent.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.nombre} ({org.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Localidad, Provincia y País */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="localidad">Localidad</Label>
                <Input
                  id="localidad"
                  name="localidad"
                  placeholder="Corrientes"
                  value={formData.localidad}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  name="provincia"
                  placeholder="Corrientes"
                  value={formData.provincia}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input
                  id="pais"
                  name="pais"
                  placeholder="Argentina"
                  value={formData.pais}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Teléfonos */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefono_1">Teléfono</Label>
                <Input
                  id="telefono_1"
                  name="telefono_1"
                  placeholder="+54 9 11 1234 5678"
                  value={formData.telefono_1}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono_2">Teléfono 2</Label>
                <Input
                  id="telefono_2"
                  name="telefono_2"
                  placeholder="+54 9 11 8765 4321"
                  value={formData.telefono_2}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                placeholder="Información adicional..."
                value={formData.notas}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm min-h-20"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Link href="/organizaciones">
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
