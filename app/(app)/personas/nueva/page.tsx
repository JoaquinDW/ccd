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

interface RolSistema {
  id: string
  nombre: string
  descripcion: string | null
}

interface Organizacion {
  id: string
  nombre: string
  tipo: string
}

export default function NewPersonaPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [roles, setRoles] = useState<RolSistema[]>([])
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    tipo_documento: '',
    documento: '',
    fecha_nacimiento: '',
    direccion: '',
    localidad: '',
    provincia: '',
    pais: 'Argentina',
    acepta_comunicaciones: true,
    modo_inicial: '',
    rol_sistema_id: '',
    organizacion_id: '',
    estado_eclesial: 'laico',
    diocesis: '',
    categoria_persona: '',
    parroquia: '',
    socio_asociacion: false,
    referente_comunidad: false,
    cecista_dedicado: false,
  })

  useEffect(() => {
    const load = async () => {
      const [{ data: rolesData }, { data: orgsData }] = await Promise.all([
        supabase.from('roles_sistema').select('id, nombre, descripcion').eq('activo', true).order('nivel_acceso', { ascending: false }),
        supabase.from('organizaciones').select('id, nombre, tipo').eq('estado', 'activa').order('nombre'),
      ])
      if (rolesData) setRoles(rolesData)
      if (orgsData) setOrganizaciones(orgsData)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.email) throw new Error('El email es requerido para crear el acceso al sistema')
      if (!formData.documento) throw new Error('El número de documento es requerido (se usará como contraseña inicial)')

      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al crear la persona')
      }

      const { id: personaId } = await res.json()

      // Create system access
      const inviteRes = await fetch('/api/personas/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          persona_id: personaId,
          rol_sistema_id: formData.rol_sistema_id || null,
          organizacion_id: formData.organizacion_id || null,
        }),
      })
      if (!inviteRes.ok) {
        const { error: inviteError } = await inviteRes.json()
        throw new Error(`Persona creada, pero no se pudo crear el acceso: ${inviteError}`)
      }

      router.push('/personas')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la persona'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div className="space-y-6">
      <Link href="/personas" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Personas
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nueva Persona</CardTitle>
          <CardDescription>Completa el formulario para registrar una nueva persona en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Nombre y Apellido */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  placeholder="García"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="juan@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
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
            </div>

            {/* Tipo Documento y Documento */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                <select
                  id="tipo_documento"
                  name="tipo_documento"
                  value={formData.tipo_documento}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="dni">DNI</option>
                  <option value="pasaporte">Pasaporte</option>
                  <option value="cedula">Cédula</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento">Número de Documento *</Label>
                <Input
                  id="documento"
                  name="documento"
                  placeholder="12345678"
                  value={formData.documento}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                placeholder="Calle Principal 123"
                value={formData.direccion}
                onChange={handleChange}
              />
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

            {/* Modo de Participación */}
            <div className="space-y-2">
              <Label htmlFor="modo_inicial">Modo de Participación</Label>
              <select
                id="modo_inicial"
                name="modo_inicial"
                value={formData.modo_inicial}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Sin asignar</option>
                <option value="colaborador">Colaborador</option>
                <option value="servidor">Servidor</option>
                <option value="asesor">Asesor</option>
                <option value="familiar">Familiar</option>
                <option value="orante">Orante</option>
                <option value="intercesor">Intercesor</option>
              </select>
            </div>

            {/* Estado Eclesiástico y Diócesis */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estado_eclesial">Estado Eclesiástico</Label>
                <select
                  id="estado_eclesial"
                  name="estado_eclesial"
                  value={formData.estado_eclesial}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="laico">Laico</option>
                  <option value="religioso">Religioso/a</option>
                  <option value="diacono">Diácono</option>
                  <option value="sacerdote">Sacerdote</option>
                  <option value="obispo">Obispo</option>
                  <option value="cardenal">Cardenal</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diocesis">Diócesis</Label>
                <Input
                  id="diocesis"
                  name="diocesis"
                  placeholder="Ej: Diócesis de Corrientes"
                  value={formData.diocesis}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Categoría de Persona */}
            <div className="space-y-2">
              <Label htmlFor="categoria_persona">Categoría</Label>
              <select
                id="categoria_persona"
                name="categoria_persona"
                value={formData.categoria_persona}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Sin especificar</option>
                <option value="cecista">Cecista</option>
                <option value="no_cecista">No Cecista</option>
              </select>
            </div>

            {/* Parroquia */}
            <div className="space-y-2">
              <Label htmlFor="parroquia">Parroquia</Label>
              <Input
                id="parroquia"
                name="parroquia"
                placeholder="Ej: Parroquia San José"
                value={formData.parroquia}
                onChange={handleChange}
              />
            </div>

            {/* Flags institucionales */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="socio_asociacion"
                  name="socio_asociacion"
                  type="checkbox"
                  checked={formData.socio_asociacion}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="socio_asociacion">Socio de la asociación</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="referente_comunidad"
                  name="referente_comunidad"
                  type="checkbox"
                  checked={formData.referente_comunidad}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="referente_comunidad">Referente de comunidad</Label>
              </div>
              {formData.categoria_persona === 'cecista' && (
                <div className="flex items-center gap-2">
                  <input
                    id="cecista_dedicado"
                    name="cecista_dedicado"
                    type="checkbox"
                    checked={formData.cecista_dedicado}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="cecista_dedicado">Cecista dedicado</Label>
                </div>
              )}
            </div>

            {/* Acepta Comunicaciones */}
            <div className="flex items-center gap-2">
              <input
                id="acepta_comunicaciones"
                name="acepta_comunicaciones"
                type="checkbox"
                checked={formData.acepta_comunicaciones}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="acepta_comunicaciones">Acepta recibir comunicaciones</Label>
            </div>

            {/* Acceso al Sistema */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Acceso al Sistema</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se creará acceso con el documento como contraseña inicial.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rol_sistema_id">Rol del Sistema</Label>
                  <select
                    id="rol_sistema_id"
                    name="rol_sistema_id"
                    value={formData.rol_sistema_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                  >
                    <option value="">Sin rol del sistema</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}{r.descripcion ? ` — ${r.descripcion}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizacion_id">Organización</Label>
                  <select
                    id="organizacion_id"
                    name="organizacion_id"
                    value={formData.organizacion_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                  >
                    <option value="">Global (sin organización)</option>
                    {organizaciones.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.nombre} ({o.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Persona'}
              </Button>
              <Link href="/personas">
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
