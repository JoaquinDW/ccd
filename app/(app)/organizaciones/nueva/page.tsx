'use client'

export const dynamic = 'force-dynamic'


import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type OrgOption = { id: string; nombre: string; tipo: string }

export default function NewOrganizacionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgsParent, setOrgsParent] = useState<OrgOption[]>([])
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'fraternidad',
    codigo: '',
    parent_id: '',
    estado: 'activa',
    mail_org: '',
    sede_fisica: false,
    direccion_calle: '',
    direccion_nro: '',
    ciudad: '',
    cp: '',
    diocesis: '',
    localidad: '',
    provincia: '',
    pais: 'Argentina',
    notas: '',
    telefono_1: '',
    telefono_2: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('organizaciones')
      .select('id, nombre, tipo')
      .is('fecha_baja', null)
      .order('nombre')
      .then(({ data }: { data: OrgOption[] | null }) => {
        if (data) setOrgsParent(data)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/organizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al crear la organización')
      }

      router.push('/organizaciones')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la organización'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <div className="space-y-6">
      <Link href="/organizaciones" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Organizaciones
      </Link>

      <Card className="border-border bg-card max-w-3xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nueva Organización</CardTitle>
          <CardDescription>Completa el formulario para registrar una nueva organización en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Nombre y Código */}
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Fraternidad San José"
                  maxLength={50}
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código Interno</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  placeholder="FRA001"
                  value={formData.codigo}
                  onChange={handleChange}
                  className="w-32"
                />
              </div>
            </div>

            {/* Tipo y Organización Padre */}
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
            </div>

            {/* Mail */}
            <div className="space-y-2">
              <Label htmlFor="mail_org">Mail Organización</Label>
              <Input
                id="mail_org"
                name="mail_org"
                type="email"
                placeholder="fraternidad@ejemplo.org"
                value={formData.mail_org}
                onChange={handleChange}
              />
            </div>

            {/* Sede Física */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sede_fisica"
                name="sede_fisica"
                checked={formData.sede_fisica}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="sede_fisica" className="cursor-pointer">Sede Física</Label>
            </div>

            {/* Dirección (condicional) */}
            {formData.sede_fisica && (
              <div className="space-y-4 rounded-md border border-border p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="direccion_calle">Dirección Calle</Label>
                    <Input
                      id="direccion_calle"
                      name="direccion_calle"
                      placeholder="Av. San Martín"
                      value={formData.direccion_calle}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion_nro">Nro.</Label>
                    <Input
                      id="direccion_nro"
                      name="direccion_nro"
                      placeholder="1234"
                      value={formData.direccion_nro}
                      onChange={handleChange}
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      name="ciudad"
                      placeholder="Corrientes"
                      value={formData.ciudad}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cp">CP</Label>
                    <Input
                      id="cp"
                      name="cp"
                      placeholder="3400"
                      value={formData.cp}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diocesis">Diócesis</Label>
                  <Input
                    id="diocesis"
                    name="diocesis"
                    placeholder="Diócesis de Corrientes"
                    value={formData.diocesis}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            )}

            {/* Localidad y Provincia (si no hay sede física) */}
            {!formData.sede_fisica && (
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
            )}

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
                {loading ? 'Guardando...' : 'Crear Organización'}
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
