'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { LocationFields } from '@/components/location-fields'
import { formatDateAR } from '@/lib/utils'
import { Combobox } from '@/components/ui/combobox'

type OrgOption = { id: string; nombre: string; parent_id?: string | null }
type TipoEvento = {
  id: string
  nombre: string
  categoria: string
  requiere_discernimiento_confra: boolean
  requiere_discernimiento_eqt: boolean
}

type Props = {
  fraternidades: OrgOption[]
  confraternidades: OrgOption[]
  tiposEventos: TipoEvento[]
  personaNombre: string
  isAdmin?: boolean
}

const today = new Date().toISOString().split('T')[0]

export default function NuevoEventoForm({ fraternidades, confraternidades, tiposEventos, personaNombre, isAdmin = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fraternidadId, setFraternidadId] = useState(fraternidades[0]?.id ?? '')
  const [tipoEventoId, setTipoEventoId] = useState(tiposEventos[0]?.id ?? '')

  const tipoSeleccionado = tiposEventos.find(t => t.id === tipoEventoId) ?? null

  const [formData, setFormData] = useState({
    nombre: '',
    modalidad: 'presencial',
    es_apv: false,
    fecha_inicio: '',
    fecha_fin: '',
    coordinadores_propuestos: '',
    asesor_propuesto: '',
    asesor_voluntario: false,
    ciudad: '',
    codigo_postal: '',
    diocesis: '',
    provincia_evento: '',
    pais_evento: 'Argentina',
    notas: '',
  })

  // Derive confraternidad from selected fraternidad
  const fraternidadSeleccionada = fraternidades.find(f => f.id === fraternidadId)
  const confraternidadId = fraternidadSeleccionada?.parent_id ?? confraternidades[0]?.id ?? ''
  const confraternidadNombre = confraternidades.find(c => c.id === confraternidadId)?.nombre ?? '—'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    setFormData(prev => ({ ...prev, [target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        tipo: tipoSeleccionado?.categoria ?? '',
        tipo_evento_id: tipoEventoId || null,
        fraternidad_id: fraternidadId,
        organizacion_id: confraternidadId,
        requiere_discernimiento_confra: tipoSeleccionado?.requiere_discernimiento_confra ?? false,
        requiere_discernimiento_eqt: tipoSeleccionado?.requiere_discernimiento_eqt ?? false,
        estado: 'solicitud',
      }

      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al enviar la solicitud')
      }

      const { id } = await res.json()
      router.push(`/eventos/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm'
  const readonlyClass = 'w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-sm'

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/eventos" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Eventos
      </Link>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground uppercase tracking-wide text-sm">Solicitud de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            {fraternidades.length === 0 && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-400">
                No tenés fraternidades asignadas. Contactá al administrador para que te asigne permisos.
              </div>
            )}

            {/* Fecha solicitud + Solicitado por */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Fecha Solicitud</Label>
                <div className={readonlyClass}>{formatDateAR(today)}</div>
              </div>
              <div className="space-y-1">
                <Label>Solicitado por</Label>
                <div className={readonlyClass}>{personaNombre || '—'}</div>
              </div>
            </div>

            {/* Fraternidad */}
            <div className="space-y-1">
              <Label htmlFor="fraternidad_id">Fraternidad *</Label>
              {fraternidades.length === 1 ? (
                <div className={readonlyClass}>{fraternidades[0].nombre}</div>
              ) : (
                <select
                  id="fraternidad_id"
                  value={fraternidadId}
                  onChange={e => setFraternidadId(e.target.value)}
                  required
                  className={fieldClass}
                >
                  <option value="">— Seleccionar fraternidad —</option>
                  {fraternidades.map(f => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Confraternidad (derived, readonly) */}
            <div className="space-y-1">
              <Label>Confraternidad</Label>
              <div className={readonlyClass}>{confraternidadNombre}</div>
            </div>

            {/* Tipo de evento */}
            <div className="space-y-1">
              <Label>Tipo de evento solicitado *</Label>
              {tiposEventos.length === 0 ? (
                <div className={readonlyClass}>No hay tipos de eventos configurados</div>
              ) : (
                <Combobox
                  value={tipoEventoId}
                  onSelect={setTipoEventoId}
                  options={tiposEventos.map(t => ({ label: t.nombre, value: t.id }))}
                  placeholder="Seleccionar tipo de evento..."
                  searchPlaceholder="Buscar tipo..."
                  emptyText="No se encontraron tipos de eventos."
                />
              )}
            </div>

            {/* Niveles de discernimiento (readonly, derivados del tipo) */}
            {tipoSeleccionado && (
              <div className="rounded-md border border-border p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Niveles de discernimiento</p>
                <div className="flex items-center gap-2">
                  {tipoSeleccionado.requiere_discernimiento_confra
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className={`text-sm ${tipoSeleccionado.requiere_discernimiento_confra ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Requiere discernimiento Confraternidad / Delegado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tipoSeleccionado.requiere_discernimiento_eqt
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className={`text-sm ${tipoSeleccionado.requiere_discernimiento_eqt ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Requiere discernimiento Equipo Timón
                  </span>
                </div>
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-1">
              <Label htmlFor="nombre">Nombre del evento *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Convivencia San José 2026"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* Modalidad + APV */}
            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <div className="space-y-1">
                <Label htmlFor="modalidad">Modalidad solicitada</Label>
                <select
                  id="modalidad"
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="bimodal">Bimodal</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pb-2">
                <input
                  type="checkbox"
                  id="es_apv"
                  name="es_apv"
                  checked={formData.es_apv}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="es_apv" className="text-sm text-foreground cursor-pointer">
                  Es de aporte voluntario APV
                </label>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fecha_inicio">Fecha inicio propuesta *</Label>
                <Input
                  id="fecha_inicio"
                  name="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fecha_fin">Fecha fin propuesta *</Label>
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

            {/* Coordinadores */}
            <div className="space-y-1">
              <Label htmlFor="coordinadores_propuestos">Coordinador/es propuesto/s</Label>
              <Input
                id="coordinadores_propuestos"
                name="coordinadores_propuestos"
                placeholder="Nombre y apellido (hasta 3, separados por coma)"
                value={formData.coordinadores_propuestos}
                onChange={handleChange}
              />
            </div>

            {/* Asesor + voluntario */}
            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <div className="space-y-1">
                <Label htmlFor="asesor_propuesto">Asesor propuesto</Label>
                <Input
                  id="asesor_propuesto"
                  name="asesor_propuesto"
                  placeholder="Texto — puede ser persona externa"
                  value={formData.asesor_propuesto}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center gap-3 pb-2">
                <input
                  type="checkbox"
                  id="asesor_voluntario"
                  name="asesor_voluntario"
                  checked={formData.asesor_voluntario}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="asesor_voluntario" className="text-sm text-foreground cursor-pointer">
                  Es voluntario el asesor
                </label>
              </div>
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

            {/* Notas */}
            <div className="space-y-1">
              <Label htmlFor="notas">Notas aclaratorias y observaciones</Label>
              <textarea
                id="notas"
                name="notas"
                placeholder="Notas adicionales..."
                value={formData.notas}
                onChange={handleChange}
                className={`${fieldClass} min-h-24`}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading || fraternidades.length === 0 || !fraternidadId || !tipoEventoId}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
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
