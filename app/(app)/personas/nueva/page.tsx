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

const NO_CECISTA_CATEGORIAS = [
  { value: 'voluntario', label: 'Voluntario' },
  { value: 'convivente', label: 'Convivente' },
  { value: 'cooperador', label: 'Cooperador' },
  { value: 'contacto_casa_retiro', label: 'Contacto Casa Retiro' },
]

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
    email_ccd: '',
    telefono: '',
    tipo_documento: '',
    documento: '',
    fecha_nacimiento: '',
    direccion: '',
    direccion_nro: '',
    localidad: '',
    codigo_postal: '',
    provincia: '',
    pais: 'Argentina',
    acepta_comunicaciones: true,
    modo_inicial: '',
    rol_sistema_id: '',
    organizacion_id: '',
    estado_eclesial: 'laico',
    estado_vida: '',
    diocesis: '',
    categoria_persona: '',
    parroquia: '',
    socio_asociacion: false,
    referente_comunidad: false,
    cecista_dedicado: false,
    intercesor_dies_natalis: '',
  })

  const [categoriasNoCecista, setCategoriasNoCecista] = useState<string[]>([])

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
        body: JSON.stringify({ ...formData, categorias_no_cecista: categoriasNoCecista }),
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleToggleCategoriaNoCecista = (categoria: string) => {
    setCategoriasNoCecista(prev =>
      prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/personas" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Personas
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Nueva Persona</h1>
        <p className="mt-1 text-muted-foreground">Completa el formulario para registrar una nueva persona en el sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Datos Personales */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Datos Personales</CardTitle>
            <CardDescription>Información básica de la persona</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" name="nombre" placeholder="Juan" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input id="apellido" name="apellido" placeholder="García" value={formData.apellido} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" placeholder="+54 9 11 1234 5678" value={formData.telefono} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Mail Personal *</Label>
                <Input id="email" name="email" type="email" placeholder="juan@example.com" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_ccd">Mail CcD</Label>
                <Input id="email_ccd" name="email_ccd" type="email" placeholder="juan@ccd.org" value={formData.email_ccd} onChange={handleChange} />
              </div>
            </div>

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
                <Label htmlFor="documento">Nro Documento *</Label>
                <Input id="documento" name="documento" placeholder="12345678" value={formData.documento} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección Calle</Label>
                <Input id="direccion" name="direccion" placeholder="Calle Principal" value={formData.direccion} onChange={handleChange} />
              </div>
              <div className="space-y-2 w-28">
                <Label htmlFor="direccion_nro">Dirección Nro</Label>
                <Input id="direccion_nro" name="direccion_nro" placeholder="123" value={formData.direccion_nro} onChange={handleChange} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="localidad">Ciudad</Label>
                <Input id="localidad" name="localidad" placeholder="Corrientes" value={formData.localidad} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_postal">CP</Label>
                <Input id="codigo_postal" name="codigo_postal" placeholder="3400" value={formData.codigo_postal} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diocesis">Diócesis</Label>
              <Input id="diocesis" name="diocesis" placeholder="Ej: Diócesis de Corrientes" value={formData.diocesis} onChange={handleChange} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input id="provincia" name="provincia" placeholder="Corrientes" value={formData.provincia} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input id="pais" name="pais" placeholder="Argentina" value={formData.pais} onChange={handleChange} />
              </div>
            </div>

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
                <Label htmlFor="parroquia">Parroquia</Label>
                <Input id="parroquia" name="parroquia" placeholder="Ej: Parroquia San José" value={formData.parroquia} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado_vida">Estado de Vida</Label>
              <select
                id="estado_vida"
                name="estado_vida"
                value={formData.estado_vida}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Sin especificar</option>
                <option value="soltero">Soltero/a</option>
                <option value="casado">Casado/a</option>
                <option value="viudo">Viudo/a</option>
                <option value="separado">Separado/a</option>
                <option value="consagrado">Consagrado/a</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Relación con CcD */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Relación con CcD</CardTitle>
            <CardDescription>Categoría institucional y pertenencia a la comunidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="categoria_persona">Categoría</Label>
                <select
                  id="categoria_persona"
                  name="categoria_persona"
                  value={formData.categoria_persona}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Otro</option>
                  <option value="cecista">Cecista</option>
                  <option value="no_cecista">No Cecista</option>
                </select>
              </div>
              <div className="flex items-end gap-4 md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    id="referente_comunidad"
                    name="referente_comunidad"
                    type="checkbox"
                    checked={formData.referente_comunidad}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="referente_comunidad">Referente de Comunidad</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="socio_asociacion"
                    name="socio_asociacion"
                    type="checkbox"
                    checked={formData.socio_asociacion}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="socio_asociacion">Socio Activo</Label>
                </div>
              </div>
            </div>

            {formData.categoria_persona === 'no_cecista' && (
              <div className="space-y-2">
                <Label>Si es No Cecista</Label>
                <div className="flex flex-wrap gap-4">
                  {NO_CECISTA_CATEGORIAS.map(cat => (
                    <div key={cat.value} className="flex items-center gap-2">
                      <input
                        id={`cat_nc_${cat.value}`}
                        type="checkbox"
                        checked={categoriasNoCecista.includes(cat.value)}
                        onChange={() => handleToggleCategoriaNoCecista(cat.value)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor={`cat_nc_${cat.value}`}>{cat.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <Label htmlFor="cecista_dedicado">Dedicado</Label>
              </div>
            )}

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
          </CardContent>
        </Card>

        {/* Modo de Participación */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Modo de Participación</CardTitle>
            <CardDescription>Estado institucional inicial en la comunidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modo_inicial">Modo inicial</Label>
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

            {formData.modo_inicial === 'intercesor' && (
              <div className="space-y-2">
                <Label htmlFor="intercesor_dies_natalis">Intercesor Dies Natalis</Label>
                <Input
                  id="intercesor_dies_natalis"
                  name="intercesor_dies_natalis"
                  type="date"
                  value={formData.intercesor_dies_natalis}
                  onChange={handleChange}
                  className="w-48"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acceso al Sistema */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Acceso al Sistema</CardTitle>
            <CardDescription>Se creará acceso con el documento como contraseña inicial.</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <div className="flex gap-3">
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
    </div>
  )
}
