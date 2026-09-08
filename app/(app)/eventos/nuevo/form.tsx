"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react"
import { LocationFields } from "@/components/location-fields"
import { Combobox } from "@/components/ui/combobox"
import { formatDateAR } from "@/lib/utils"
import FlyerUploadPanel from "../[id]/_components/flyer-upload-panel"

type OrgOption = { id: string; nombre: string; parent_id?: string | null }
type TipoEvento = {
  id: string
  nombre: string
  categoria: string
  requiere_discernimiento_confra: boolean
  requiere_discernimiento_eqt: boolean
  requisitos?: string | null
  activo: boolean
}

const CATEGORIAS = [
  { value: "convivencia", label: "Convivencia" },
  { value: "retiro", label: "Retiro" },
  { value: "taller", label: "Taller" },
  { value: "encuentro", label: "Encuentro" },
  { value: "otro", label: "Otro" },
]

type Props = {
  fraternidades: OrgOption[]
  confraternidades: OrgOption[]
  tiposEventos: TipoEvento[]
  personaNombre: string
  isAdmin?: boolean
  canEditConfra?: boolean
}

const today = new Date().toISOString().split("T")[0]

export default function NuevoEventoForm({
  fraternidades,
  confraternidades,
  tiposEventos,
  personaNombre,
  isAdmin = false,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdEventoId, setCreatedEventoId] = useState<string | null>(null)

  const [confraternidadId, setConfraternidadId] = useState(
    fraternidades[0]?.parent_id ?? confraternidades[0]?.id ?? "",
  )
  const [fraternidadId, setFraternidadId] = useState(fraternidades[0]?.id ?? "")

  // Tipo: primero elegir categoría, luego nombre filtrado
  const [categoria, setCategoria] = useState("")
  const [tipoEventoId, setTipoEventoId] = useState("")

  // Períodos de ejecución: siempre el primero visible, adicionales al presionar el botón
  type FechaEjecucion = { fecha_inicio: string; fecha_fin: string }
  const [fechasEjecucion, setFechasEjecucion] = useState<FechaEjecucion[]>([
    { fecha_inicio: "", fecha_fin: "" },
  ])
  const [mostrarPeriodosExtra, setMostrarPeriodosExtra] = useState(false)

  const tiposFiltrados = categoria
    ? tiposEventos.filter((t) => t.categoria === categoria)
    : tiposEventos

  const tipoSeleccionado =
    tiposEventos.find((t) => t.id === tipoEventoId) ?? null

  const confraternidadSeleccionada =
    confraternidades.find((c) => c.id === confraternidadId) ?? null

  const handleCategoriaChange = (val: string) => {
    setCategoria(val)
    setTipoEventoId("")
  }

  const [formData, setFormData] = useState({
    es_apv: false,
    fecha_inicio: "",
    fecha_fin: "",
    fecha_solicitud: today,
    casa_retiro_id: "",
    cupo_maximo: "30",
    precio: "",
    pension: "",
    audiencia: "cerrado",
    modalidad: "presencial",
    asesor_voluntario: false,
    ciudad: "",
    codigo_postal: "",
    diocesis: "",
    provincia_evento: "",
    pais_evento: "Argentina",
    notas: "",
  })

  const nombreEvento =
    tipoSeleccionado && confraternidadSeleccionada && formData.fecha_inicio
      ? `${tipoSeleccionado.nombre} - ${confraternidadSeleccionada.nombre} - ${formatDateAR(formData.fecha_inicio)}`
      : ""

  const fraternidadesFiltradas = confraternidadId
    ? fraternidades.filter((f) => f.parent_id === confraternidadId)
    : fraternidades

  const handleConfraternidadChange = (id: string) => {
    setConfraternidadId(id)
    const frat = fraternidades.find((f) => f.id === fraternidadId)
    if (frat?.parent_id !== id) setFraternidadId("")
  }

  const handleFraternidadChange = (id: string) => {
    setFraternidadId(id)
    const frat = fraternidades.find((f) => f.id === id)
    if (frat?.parent_id) setConfraternidadId(frat.parent_id)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const target = e.target
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value
    setFormData((prev) => ({ ...prev, [target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const fechasCompletas = fechasEjecucion.filter(
        (f) => f.fecha_inicio && f.fecha_fin,
      )
      for (const f of fechasCompletas) {
        if (formData.fecha_inicio && f.fecha_inicio < formData.fecha_inicio) {
          setError(
            "Las fechas de ejecución no pueden comenzar antes de la fecha de inicio propuesta.",
          )
          setLoading(false)
          return
        }
        if (formData.fecha_fin && f.fecha_fin > formData.fecha_fin) {
          setError(
            "Las fechas de ejecución no pueden terminar después de la fecha de fin propuesta.",
          )
          setLoading(false)
          return
        }
      }

      const payload = {
        ...formData,
        tipo: tipoSeleccionado?.categoria ?? categoria ?? "",
        tipo_evento_id: tipoEventoId || null,
        fraternidad_id: fraternidadId,
        organizacion_id: confraternidadId,
        requiere_discernimiento_confra:
          tipoSeleccionado?.requiere_discernimiento_confra ?? false,
        requiere_discernimiento_eqt:
          tipoSeleccionado?.requiere_discernimiento_eqt ?? false,
        estado: "solicitud",
        fecha_solicitud: formData.fecha_solicitud || today,
        fechas_ejecucion: fechasCompletas,
        nombre: nombreEvento,
      }

      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? "Error al enviar la solicitud")
      }

      const { id } = await res.json()
      if (isAdmin) {
        setCreatedEventoId(id)
      } else {
        router.push(`/eventos/${id}`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  // Admin step 2: flyers after event creation
  if (createdEventoId) {
    return (
      <div className="space-y-6">
        <Link
          href="/eventos"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Eventos
        </Link>

        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-4 py-3">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Solicitud creada correctamente.
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            Podés subir los flyers ahora o hacerlo más tarde desde el evento.
          </p>
        </div>

        <FlyerUploadPanel
          eventoId={createdEventoId}
          flyerHorizontalUrl={null}
          flyerCuadradoUrl={null}
        />

        <div className="flex gap-3">
          <Button onClick={() => router.push(`/eventos/${createdEventoId}`)}>
            Ir al evento
          </Button>
          <Button
            variant="outline"
            className="bg-transparent"
            onClick={() => router.push('/eventos')}
          >
            Volver a Eventos
          </Button>
        </div>
      </div>
    )
  }

  const fieldClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
  const readonlyClass =
    "w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-sm"

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/eventos"
        className="inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Eventos
      </Link>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground uppercase tracking-wide text-sm">
            Solicitud de Convivencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {fraternidades.length === 0 && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-400">
                No tenés fraternidades asignadas. Contactá al administrador para
                que te asigne permisos.
              </div>
            )}

            {/* Fecha solicitud + Solicitado por */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fecha_solicitud">Fecha Solicitud</Label>
                <input
                  id="fecha_solicitud"
                  type="date"
                  name="fecha_solicitud"
                  value={formData.fecha_solicitud}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1">
                <Label>Solicitado por</Label>
                <div className={readonlyClass}>{personaNombre || "—"}</div>
              </div>
            </div>

            {/* 1. Confraternidad */}
            <div className="space-y-1">
              <Label htmlFor="confraternidad_id">Confraternidad</Label>
              <select
                id="confraternidad_id"
                value={confraternidadId}
                onChange={(e) => handleConfraternidadChange(e.target.value)}
                className={fieldClass}
              >
                <option value="">— Seleccionar confraternidad —</option>
                {confraternidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Fraternidad filtrada por Confraternidad */}
            <div className="space-y-1">
              <Label htmlFor="fraternidad_id">Fraternidad *</Label>
              <select
                id="fraternidad_id"
                value={fraternidadId}
                onChange={(e) => handleFraternidadChange(e.target.value)}
                required
                className={fieldClass}
              >
                <option value="">— Seleccionar fraternidad —</option>
                {fraternidadesFiltradas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Tipo de evento (categoría) */}
            <div className="space-y-1">
              <Label htmlFor="categoria">
                Categoría de evento a solicitar *
              </Label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                required
                className={fieldClass}
              >
                <option value="">— Seleccionar Categoría —</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Nombre del evento (tipos filtrados por categoría) */}
            {categoria && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label>Tipo de evento *</Label>
                  {tiposFiltrados.length === 0 ? (
                    <div className={readonlyClass}>
                      No hay tipos de evento configurados para esta categoría
                    </div>
                  ) : (
                    <Combobox
                      value={tipoEventoId}
                      onSelect={setTipoEventoId}
                      options={tiposFiltrados.map((t) => ({
                        label: t.nombre,
                        value: t.id,
                      }))}
                      placeholder="Seleccionar tipo de evento..."
                      searchPlaceholder="Buscar..."
                      emptyText="No se encontraron eventos."
                    />
                  )}
                </div>
                {tipoSeleccionado?.requisitos && (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                    <p className="font-medium text-foreground mb-1">
                      Requisitos
                    </p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {tipoSeleccionado.requisitos}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Nombre del evento (calculado automáticamente) */}
            <div className="space-y-1">
              <Label>Nombre del evento</Label>
              <div className={readonlyClass}>
                {nombreEvento || "—"}
              </div>
              {!nombreEvento && (
                <p className="text-xs text-muted-foreground">
                  Se genera al seleccionar la confraternidad, el tipo de evento y la fecha de inicio.
                </p>
              )}
            </div>

            {/* Niveles de discernimiento (derivados del tipo) */}
            {tipoSeleccionado && (
              <div className="rounded-md border border-border p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Niveles de discernimiento
                </p>
                <div className="flex items-center gap-2">
                  {tipoSeleccionado.requiere_discernimiento_confra ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={`text-sm ${tipoSeleccionado.requiere_discernimiento_confra ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    Requiere discernimiento Confraternidad / Delegado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tipoSeleccionado.requiere_discernimiento_eqt ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={`text-sm ${tipoSeleccionado.requiere_discernimiento_eqt ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    Requiere discernimiento Equipo Timón
                  </span>
                </div>
              </div>
            )}

            {/* 5. Aporte Voluntario */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="es_apv"
                name="es_apv"
                checked={formData.es_apv}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border"
              />
              <label
                htmlFor="es_apv"
                className="text-sm text-foreground cursor-pointer"
              >
                Es de Aporte de Valor Voluntario (APV)
              </label>
            </div>

            {/* Precios */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="precio">Precio de Inscripción</Label>
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
              <div className="space-y-1">
                <Label htmlFor="pension">Precio de Pensión</Label>
                <Input
                  id="pension"
                  name="pension"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.pension}
                  onChange={handleChange}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-3">
              La landing pública del evento solo cobra el precio de inscripción. La pensión se registra y valida desde Pagos.
            </p>

            {/* 6–9. Ubicación */}
            <LocationFields
              pais={formData.pais_evento}
              provincia={formData.provincia_evento}
              localidad={formData.ciudad}
              codigoPostal={formData.codigo_postal}
              diocesis={formData.diocesis}
              onPaisChange={(val) =>
                setFormData((prev) => ({ ...prev, pais_evento: val }))
              }
              onProvinciaChange={(val) =>
                setFormData((prev) => ({ ...prev, provincia_evento: val }))
              }
              onLocalidadChange={(val) =>
                setFormData((prev) => ({ ...prev, ciudad: val }))
              }
              onCodigoPostalChange={(val) =>
                setFormData((prev) => ({ ...prev, codigo_postal: val }))
              }
              onDiocesisChange={(val) =>
                setFormData((prev) => ({ ...prev, diocesis: val }))
              }
            />

            {/* 10–11. Fecha inicio y fin (primer período) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fecha_inicio">Fecha de inicio *</Label>
                <Input
                  id="fecha_inicio"
                  name="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => {
                    handleChange(e)
                    setFechasEjecucion((prev) =>
                      prev.map((f, i) =>
                        i === 0 ? { ...f, fecha_inicio: e.target.value } : f,
                      ),
                    )
                  }}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fecha_fin">Fecha de fin *</Label>
                <Input
                  id="fecha_fin"
                  name="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => {
                    handleChange(e)
                    setFechasEjecucion((prev) =>
                      prev.map((f, i) =>
                        i === 0 ? { ...f, fecha_fin: e.target.value } : f,
                      ),
                    )
                  }}
                  required
                />
              </div>
            </div>

            {/* 12. Botón Períodos + períodos adicionales */}
            <div className="space-y-3">
              {!mostrarPeriodosExtra ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-transparent gap-1"
                  onClick={() => {
                    setMostrarPeriodosExtra(true)
                    setFechasEjecucion((prev) =>
                      prev.length < 2
                        ? [...prev, { fecha_inicio: "", fecha_fin: "" }]
                        : prev,
                    )
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Períodos
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Períodos adicionales</Label>
                    {fechasEjecucion.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-transparent h-7 text-xs"
                        disabled={
                          !fechasEjecucion[fechasEjecucion.length - 1]
                            .fecha_inicio ||
                          !fechasEjecucion[fechasEjecucion.length - 1].fecha_fin
                        }
                        onClick={() =>
                          setFechasEjecucion((prev) => [
                            ...prev,
                            { fecha_inicio: "", fecha_fin: "" },
                          ])
                        }
                      >
                        <Plus className="h-3 w-3" />
                        Agregar período
                      </Button>
                    )}
                  </div>
                  {fechasEjecucion.slice(1).map((fecha, relIdx) => {
                    const idx = relIdx + 1
                    return (
                      <div
                        key={idx}
                        className="grid gap-3 sm:grid-cols-2 items-end relative"
                      >
                        <div className="space-y-1">
                          <Label
                            htmlFor={`fe_inicio_${idx}`}
                            className="text-xs text-muted-foreground"
                          >
                            Fecha Desde {idx + 1}
                          </Label>
                          <Input
                            id={`fe_inicio_${idx}`}
                            type="date"
                            value={fecha.fecha_inicio}
                            min={formData.fecha_inicio || undefined}
                            max={formData.fecha_fin || undefined}
                            onChange={(e) =>
                              setFechasEjecucion((prev) =>
                                prev.map((f, i) =>
                                  i === idx
                                    ? { ...f, fecha_inicio: e.target.value }
                                    : f,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor={`fe_fin_${idx}`}
                            className="text-xs text-muted-foreground"
                          >
                            Fecha Hasta {idx + 1}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`fe_fin_${idx}`}
                              type="date"
                              value={fecha.fecha_fin}
                              min={
                                fecha.fecha_inicio ||
                                formData.fecha_inicio ||
                                undefined
                              }
                              max={formData.fecha_fin || undefined}
                              onChange={(e) =>
                                setFechasEjecucion((prev) =>
                                  prev.map((f, i) =>
                                    i === idx
                                      ? { ...f, fecha_fin: e.target.value }
                                      : f,
                                  ),
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const updated = fechasEjecucion.filter(
                                  (_, i) => i !== idx,
                                )
                                setFechasEjecucion(updated)
                                if (updated.length <= 1)
                                  setMostrarPeriodosExtra(false)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modalidad */}
            <div className="space-y-1">
              <Label htmlFor="modalidad">Modalidad</Label>
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
                disabled={
                  loading ||
                  fraternidades.length === 0 ||
                  !fraternidadId ||
                  !categoria
                }
              >
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
              <Link href="/eventos">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                >
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
