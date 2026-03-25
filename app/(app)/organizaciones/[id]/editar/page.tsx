'use client'

export const dynamic = 'force-dynamic'


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
type OrgDependiente = { id: string; nombre: string; tipo: string }
type Asignacion = {
  id: string
  estado: string
  fecha_inicio: string | null
  fecha_fin: string | null
  personas: { nombre_completo: string } | null
  ministerios: { nombre: string } | null
  eventos: { nombre: string } | null
}

export default function EditarOrganizacionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [orgsParent, setOrgsParent] = useState<OrgOption[]>([])
  const [orgsDependientes, setOrgsDependientes] = useState<OrgDependiente[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
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

    Promise.all([
      supabase
        .from('organizaciones')
        .select('id, nombre, tipo, codigo, parent_id, estado, mail_org, sede_fisica, direccion_calle, direccion_nro, ciudad, cp, diocesis, localidad, provincia, pais, notas, telefono_1, telefono_2')
        .eq('id', id)
        .single(),
      supabase
        .from('organizaciones')
        .select('id, nombre, tipo')
        .is('fecha_baja', null)
        .neq('id', id)
        .order('nombre'),
      supabase
        .from('organizaciones')
        .select('id, nombre, tipo')
        .eq('parent_id', id)
        .is('fecha_baja', null)
        .order('nombre'),
      supabase
        .from('asignaciones_ministerio')
        .select('id, estado, fecha_inicio, fecha_fin, personas(nombre_completo), ministerios(nombre), eventos(nombre)')
        .eq('organizacion_id', id)
        .is('fecha_fin', null)
        .order('fecha_inicio'),
    ]).then(([{ data: org, error: orgError }, { data: parents }, { data: dependientes }, { data: asig }]) => {
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
        estado: org.estado ?? 'activa',
        mail_org: org.mail_org ?? '',
        sede_fisica: org.sede_fisica ?? false,
        direccion_calle: org.direccion_calle ?? '',
        direccion_nro: org.direccion_nro ?? '',
        ciudad: org.ciudad ?? '',
        cp: org.cp ?? '',
        diocesis: org.diocesis ?? '',
        localidad: org.localidad ?? '',
        provincia: org.provincia ?? '',
        pais: org.pais ?? 'Argentina',
        notas: org.notas ?? '',
        telefono_1: org.telefono_1 ?? '',
        telefono_2: org.telefono_2 ?? '',
      })
      if (parents) setOrgsParent(parents as OrgOption[])
      if (dependientes) setOrgsDependientes(dependientes as OrgDependiente[])
      if (asig) setAsignaciones(asig as unknown as Asignacion[])
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
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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

      <Card className="border-border bg-card max-w-3xl">
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

            {/* Estado y Mail */}
            <div className="grid gap-4 md:grid-cols-2">
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

      {/* Organizaciones Dependientes */}
      <Card className="border-border bg-card max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Confraternidades o Fraternidades Relacionadas (Org. Dependientes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgsDependientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin organizaciones dependientes</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Organización</th>
                  <th className="pb-2 font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {orgsDependientes.map(dep => (
                  <tr key={dep.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2">
                      <Link href={`/organizaciones/${dep.id}`} className="text-primary hover:underline">
                        {dep.nombre}
                      </Link>
                    </td>
                    <td className="py-2 capitalize text-muted-foreground">{dep.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Roles y Ministerios */}
      <Card className="border-border bg-card max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Roles y Ministerios de la Organización
          </CardTitle>
        </CardHeader>
        <CardContent>
          {asignaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin asignaciones activas</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Persona</th>
                  <th className="pb-2 font-medium">Rol</th>
                  <th className="pb-2 font-medium">Evento</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Inicio</th>
                  <th className="pb-2 font-medium">Fin</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map(asig => (
                  <tr key={asig.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2">{asig.personas?.nombre_completo ?? '—'}</td>
                    <td className="py-2">{asig.ministerios?.nombre ?? '—'}</td>
                    <td className="py-2 text-muted-foreground">{asig.eventos?.nombre ?? '—'}</td>
                    <td className="py-2 capitalize">{asig.estado}</td>
                    <td className="py-2 text-muted-foreground">
                      {asig.fecha_inicio ?? '—'}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {asig.fecha_fin ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
