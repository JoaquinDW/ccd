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
import { LocationFields } from '@/components/location-fields'

type OrgOption = { id: string; nombre: string; tipo: string }

export default function EditarEventoForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [organizaciones, setOrganizaciones] = useState<OrgOption[]>([])
  const [casasRetiro, setCasasRetiro] = useState<OrgOption[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'convivencia',
    fecha_inicio: '',
    fecha_fin: '',
    organizacion_id: '',
    casa_retiro_id: '',
    cupo_maximo: '30',
    precio: '',
    audiencia: 'cerrado',
    modalidad: 'presencial',
    estado: 'borrador',
    descripcion: '',
    ciudad: '',
    codigo_postal: '',
    diocesis: '',
    provincia_evento: '',
    pais_evento: 'Argentina',
  })

  useEffect(() => {
    const supabase = createClient()

    Promise.all([
      supabase
        .from('eventos')
        .select('id, nombre, tipo, fecha_inicio, fecha_fin, organizacion_id, casa_retiro_id, cupo_maximo, precio, audiencia, modalidad, estado, descripcion, ciudad, codigo_postal, diocesis, provincia_evento, pais_evento')
        .eq('id', id)
        .single(),
      supabase
        .from('organizaciones')
        .select('id, nombre, tipo')
        .is('fecha_baja', null)
        .order('nombre'),
    ]).then(([{ data: evento, error: eventoError }, { data: orgs }]) => {
      if (eventoError || !evento) {
        setError('No se encontró el evento')
        setLoadingData(false)
        return
      }
      setFormData({
        nombre: evento.nombre ?? '',
        tipo: evento.tipo ?? 'convivencia',
        fecha_inicio: evento.fecha_inicio ?? '',
        fecha_fin: evento.fecha_fin ?? '',
        organizacion_id: evento.organizacion_id ?? '',
        casa_retiro_id: evento.casa_retiro_id ?? '',
        cupo_maximo: evento.cupo_maximo?.toString() ?? '30',
        precio: evento.precio?.toString() ?? '',
        audiencia: evento.audiencia ?? 'cerrado',
        modalidad: evento.modalidad ?? 'presencial',
        estado: evento.estado ?? 'borrador',
        descripcion: evento.descripcion ?? '',
        ciudad: evento.ciudad ?? '',
        codigo_postal: evento.codigo_postal ?? '',
        diocesis: evento.diocesis ?? '',
        provincia_evento: evento.provincia_evento ?? '',
        pais_evento: evento.pais_evento ?? 'Argentina',
      })
      if (orgs) {
        setOrganizaciones(orgs.filter(o => o.tipo !== 'casa_retiro'))
        setCasasRetiro(orgs.filter(o => o.tipo === 'casa_retiro'))
      }
      setLoadingData(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const updateData: Record<string, unknown> = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        audiencia: formData.audiencia,
        modalidad: formData.modalidad,
        estado: formData.estado,
        organizacion_id: formData.organizacion_id || null,
        casa_retiro_id: formData.casa_retiro_id || null,
        cupo_maximo: formData.cupo_maximo ? parseInt(formData.cupo_maximo) : null,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        descripcion: formData.descripcion || null,
        ciudad: formData.ciudad || null,
        codigo_postal: formData.codigo_postal || null,
        diocesis: formData.diocesis || null,
        provincia_evento: formData.provincia_evento || null,
        pais_evento: formData.pais_evento || 'Argentina',
      }

      const { error: updateError } = await supabase
        .from('eventos')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      router.push('/eventos')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el evento'
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
        <p className="text-muted-foreground">Cargando evento...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/eventos" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Eventos
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Editar Evento</CardTitle>
          <CardDescription>Modifica los datos del evento</CardDescription>
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
              {isAdmin ? (
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
                    <option value="discernimiento_confra">Discernimiento Confra</option>
                    <option value="discernimiento_timon">Discernimiento Timón</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="publicado">Publicado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground capitalize">
                    {formData.estado.replace('_', ' ')}
                    <span className="ml-2 text-xs">(gestionado por el flujo de aprobación)</span>
                  </div>
                </div>
              )}
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

            {/* Organización */}
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

            {/* Ubicación */}
            <LocationFields
              pais={formData.pais_evento}
              provincia={formData.provincia_evento}
              localidad={formData.ciudad}
              codigoPostal={formData.codigo_postal}
              diocesis={formData.diocesis}
              onPaisChange={(val) => setFormData(prev => ({ ...prev, pais_evento: val }))}
              onProvinciaChange={(val) => setFormData(prev => ({ ...prev, provincia_evento: val }))}
              onLocalidadChange={(val) => setFormData(prev => ({ ...prev, ciudad: val }))}
              onCodigoPostalChange={(val) => setFormData(prev => ({ ...prev, codigo_postal: val }))}
              onDiocesisChange={(val) => setFormData(prev => ({ ...prev, diocesis: val }))}
            />

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
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
