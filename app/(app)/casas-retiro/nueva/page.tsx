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
type PersonaOption = { id: string; nombre: string; apellido: string }

const AMENITY_LABELS: Record<string, string> = {
  estacionamiento: 'Estacionamiento',
  rampa_discapacitados: 'Rampa para discapacitados',
  capilla: 'Capilla',
  comedor_amplio: 'Comedor amplio',
  salon: 'Salón',
  banos_en_habit: 'Baños en habitación',
}

export default function NuevaCasaRetiroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [personas, setPersonas] = useState<PersonaOption[]>([])

  const [formData, setFormData] = useState({
    nombre: '',
    codigo_interno: '',
    tipo_propiedad: 'terceros',
    contacto_persona_id: '',
    telefono: '',
    mail: '',
    aforo: '',
    direccion_calle: '',
    direccion_nro: '',
    ciudad: '',
    cp: '',
    diocesis: '',
    provincia: '',
    pais: 'Argentina',
    estacionamiento: false,
    rampa_discapacitados: false,
    capilla: false,
    comedor_amplio: false,
    salon: false,
    banos_en_habit: false,
    cant_hab_x2: '',
    cant_hab_x3: '',
    cant_hab_x4: '',
    cant_banos: '',
    notas: '',
    organizaciones_cercanas: [] as string[],
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('organizaciones').select('id, nombre, tipo').is('fecha_baja', null).order('nombre'),
      supabase.from('personas').select('id, nombre, apellido').is('fecha_baja', null).order('apellido'),
    ]).then(([{ data: orgData }, { data: personaData }]) => {
      if (orgData) setOrgs(orgData)
      if (personaData) setPersonas(personaData)
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const toggleOrg = (orgId: string) => {
    setFormData(prev => ({
      ...prev,
      organizaciones_cercanas: prev.organizaciones_cercanas.includes(orgId)
        ? prev.organizaciones_cercanas.filter(id => id !== orgId)
        : [...prev.organizaciones_cercanas, orgId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/casas-retiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al crear la casa de retiro')
      }

      const { id } = await res.json()
      router.push(`/casas-retiro/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la casa de retiro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/casas-retiro" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Casas de Retiro
      </Link>

      <Card className="border-border bg-card max-w-4xl">
        <CardHeader>
          <CardTitle className="text-foreground">Nueva Casa de Retiro</CardTitle>
          <CardDescription>Completá el formulario para registrar una nueva casa de retiro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Identificación */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
                Identificación
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Casa de Retiro San José"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_interno">Código interno</Label>
                  <Input
                    id="codigo_interno"
                    name="codigo_interno"
                    placeholder="ej. CR-001"
                    value={formData.codigo_interno}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="tipo_propiedad">Tipo de propiedad</Label>
                <select
                  id="tipo_propiedad"
                  name="tipo_propiedad"
                  value={formData.tipo_propiedad}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="propia">Propia</option>
                  <option value="terceros">De terceros</option>
                </select>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
                Contacto
              </h3>
              <div className="space-y-2">
                <Label htmlFor="contacto_persona_id">Persona de contacto</Label>
                <select
                  id="contacto_persona_id"
                  name="contacto_persona_id"
                  value={formData.contacto_persona_id}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Sin persona de contacto</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.apellido}, {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    placeholder="+54 9 11 1234 5678"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mail">Mail</Label>
                  <Input
                    id="mail"
                    name="mail"
                    type="email"
                    placeholder="contacto@casaretiro.org"
                    value={formData.mail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
                Ubicación
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="direccion_calle">Dirección</Label>
                  <Input
                    id="direccion_calle"
                    name="direccion_calle"
                    placeholder="Av. San Martín"
                    value={formData.direccion_calle}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion_nro">Número</Label>
                  <Input
                    id="direccion_nro"
                    name="direccion_nro"
                    placeholder="1234"
                    value={formData.direccion_nro}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
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
                  <Label htmlFor="cp">Código postal</Label>
                  <Input
                    id="cp"
                    name="cp"
                    placeholder="3400"
                    value={formData.cp}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aforo">Aforo</Label>
                  <Input
                    id="aforo"
                    name="aforo"
                    type="number"
                    min="0"
                    placeholder="100"
                    value={formData.aforo}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
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

            {/* Habitaciones */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
                Habitaciones
              </h3>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="cant_hab_x2">Hab. dobles</Label>
                  <Input
                    id="cant_hab_x2"
                    name="cant_hab_x2"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.cant_hab_x2}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cant_hab_x3">Hab. triples</Label>
                  <Input
                    id="cant_hab_x3"
                    name="cant_hab_x3"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.cant_hab_x3}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cant_hab_x4">Hab. cuádruples</Label>
                  <Input
                    id="cant_hab_x4"
                    name="cant_hab_x4"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.cant_hab_x4}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cant_banos">Baños</Label>
                  <Input
                    id="cant_banos"
                    name="cant_banos"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.cant_banos}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Servicios */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
                Servicios
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(AMENITY_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name={key}
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Organizaciones cercanas */}
            {orgs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
                  Organizaciones Cercanas
                </h3>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border p-3 space-y-2">
                  {orgs.map(org => (
                    <label key={org.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.organizaciones_cercanas.includes(org.id)}
                        onChange={() => toggleOrg(org.id)}
                        className="h-4 w-4 rounded border-border text-primary"
                      />
                      <span className="text-sm text-foreground">{org.nombre}</span>
                      <span className="text-xs text-muted-foreground">({org.tipo})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Casa de Retiro'}
              </Button>
              <Link href="/casas-retiro">
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
