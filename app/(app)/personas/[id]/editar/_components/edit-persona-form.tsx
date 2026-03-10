"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

type Persona = {
  id: string
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  tipo_documento: string | null
  documento: string | null
  fecha_nacimiento: string | null
  direccion: string | null
  localidad: string | null
  provincia: string | null
  pais: string | null
  acepta_comunicaciones: boolean | null
  notas: string | null
  estado_eclesial: string | null
  diocesis: string | null
  categoria_persona: string | null
  parroquia: string | null
  socio_asociacion: boolean | null
  referente_comunidad: boolean | null
  cecista_dedicado: boolean | null
}

type ModoActual = { id: string; modo: string; fecha_inicio: string } | null

type HistorialModo = {
  id: string
  modo: string
  fecha_inicio: string
  fecha_fin: string | null
  motivo_fin: string | null
}

type AsignacionActiva = {
  id: string
  fecha_inicio: string
  estado: string
  ministerio: { nombre: string; tipo: string; nivel: string } | null
  organizacion: { nombre: string; tipo: string } | null
}

type HistorialAsignacion = {
  id: string
  fecha_inicio: string
  fecha_fin: string | null
  estado: string
  ministerio: { nombre: string } | null
  organizacion: { nombre: string } | null
}

type Ministerio = { id: string; nombre: string; tipo: string; nivel: string }
type Organizacion = { id: string; nombre: string; tipo: string }

type RolActivo = {
  id: string
  fecha_inicio: string
  organizacion_id: string | null
  rol_sistema: { id: string; nombre: string; nivel_acceso: number } | null
  organizacion: { nombre: string } | null
} | null

type HistorialRol = {
  id: string
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  rol_sistema: { nombre: string } | null
  organizacion: { nombre: string } | null
}

type RolSistema = { id: string; nombre: string; nivel_acceso: number }

interface Props {
  persona: Persona
  modoActual: ModoActual
  historialModos: HistorialModo[]
  asignacionesActivas: AsignacionActiva[]
  historialAsignaciones: HistorialAsignacion[]
  ministerios: Ministerio[]
  organizaciones: Organizacion[]
  rolActivo: RolActivo
  historialRoles: HistorialRol[]
  rolesSistema: RolSistema[]
  canAssignRoles: boolean
}

const modoLabels: Record<string, string> = {
  colaborador: "Colaborador",
  servidor: "Servidor",
  asesor: "Asesor",
  familiar: "Familiar",
  orante: "Orante",
  intercesor: "Intercesor",
}

export function EditPersonaForm({
  persona,
  modoActual,
  historialModos,
  asignacionesActivas,
  historialAsignaciones,
  ministerios,
  organizaciones,
  rolActivo,
  historialRoles,
  rolesSistema,
  canAssignRoles,
}: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  // Section A: Basic data
  const [basicData, setBasicData] = useState({
    nombre: persona.nombre ?? "",
    apellido: persona.apellido ?? "",
    email: persona.email ?? "",
    telefono: persona.telefono ?? "",
    tipo_documento: persona.tipo_documento ?? "",
    documento: persona.documento ?? "",
    fecha_nacimiento: persona.fecha_nacimiento ?? "",
    direccion: persona.direccion ?? "",
    localidad: persona.localidad ?? "",
    provincia: persona.provincia ?? "",
    pais: persona.pais ?? "Argentina",
    acepta_comunicaciones: persona.acepta_comunicaciones ?? true,
    notas: persona.notas ?? "",
    estado_eclesial: persona.estado_eclesial ?? "laico",
    diocesis: persona.diocesis ?? "",
    categoria_persona: persona.categoria_persona ?? "",
    parroquia: persona.parroquia ?? "",
    socio_asociacion: persona.socio_asociacion ?? false,
    referente_comunidad: persona.referente_comunidad ?? false,
    cecista_dedicado: persona.cecista_dedicado ?? false,
  })
  const [basicLoading, setBasicLoading] = useState(false)
  const [basicError, setBasicError] = useState<string | null>(null)
  const [basicSuccess, setBasicSuccess] = useState(false)

  // Section B: Participation mode
  const [nuevoModo, setNuevoModo] = useState("")
  const [motivoFin, setMotivoFin] = useState("")
  const [modoLoading, setModoLoading] = useState(false)
  const [modoError, setModoError] = useState<string | null>(null)

  // Section D: System role
  const [newRolId, setNewRolId] = useState("")
  const [newRolOrgId, setNewRolOrgId] = useState("")
  const [rolLoading, setRolLoading] = useState(false)
  const [rolError, setRolError] = useState<string | null>(null)
  const [rolSuccess, setRolSuccess] = useState(false)

  // Section C: Ministry assignments
  const [newAsig, setNewAsig] = useState({
    ministerio_id: "",
    organizacion_id: "",
    fecha_inicio: today,
  })
  const [asigLoading, setAsigLoading] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [asigError, setAsigError] = useState<string | null>(null)

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setBasicData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBasicError(null)
    setBasicSuccess(false)
    setBasicLoading(true)

    const res = await fetch(`/api/personas/${persona.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basicData),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setBasicError(error ?? 'Error al actualizar')
    } else {
      setBasicSuccess(true)
      router.refresh()
    }
    setBasicLoading(false)
  }

  const handleModoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoModo) return
    setModoError(null)
    setModoLoading(true)

    const supabase = createClient()

    if (modoActual) {
      const { error: closeError } = await supabase
        .from("persona_modos")
        .update({ fecha_fin: today, estado: "inactivo", motivo_fin: motivoFin || null })
        .eq("id", modoActual.id)

      if (closeError) {
        setModoError(closeError.message)
        setModoLoading(false)
        return
      }
    }

    const { error: insertError } = await supabase.from("persona_modos").insert({
      persona_id: persona.id,
      modo: nuevoModo,
      fecha_inicio: today,
    })

    if (insertError) {
      setModoError(insertError.message)
    } else {
      setNuevoModo("")
      setMotivoFin("")
      router.refresh()
    }
    setModoLoading(false)
  }

  const handleCloseAsignacion = async (asigId: string) => {
    setAsigError(null)
    setClosingId(asigId)
    const supabase = createClient()

    const { error } = await supabase
      .from("asignaciones_ministerio")
      .update({ fecha_fin: today, estado: "inactivo" })
      .eq("id", asigId)

    if (error) {
      setAsigError(error.message)
    } else {
      router.refresh()
    }
    setClosingId(null)
  }

  const handleRolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRolId) return
    setRolError(null)
    setRolSuccess(false)
    setRolLoading(true)

    const supabase = createClient()

    if (rolActivo) {
      const { error: closeError } = await supabase
        .from("usuario_roles")
        .update({ activo: false, fecha_fin: today })
        .eq("id", rolActivo.id)

      if (closeError) {
        setRolError(closeError.message)
        setRolLoading(false)
        return
      }
    }

    const insertPayload: Record<string, unknown> = {
      persona_id: persona.id,
      rol_sistema_id: newRolId,
      fecha_inicio: today,
      activo: true,
    }
    if (newRolOrgId) insertPayload.organizacion_id = newRolOrgId

    const { error: insertError } = await supabase.from("usuario_roles").insert(insertPayload)

    if (insertError) {
      setRolError(insertError.message)
    } else {
      setNewRolId("")
      setNewRolOrgId("")
      setRolSuccess(true)
      router.refresh()
    }
    setRolLoading(false)
  }

  const handleAsigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAsig.ministerio_id) return
    setAsigError(null)
    setAsigLoading(true)

    const supabase = createClient()
    const insertData: Record<string, unknown> = {
      persona_id: persona.id,
      ministerio_id: newAsig.ministerio_id,
      fecha_inicio: newAsig.fecha_inicio,
    }
    if (newAsig.organizacion_id) insertData.organizacion_id = newAsig.organizacion_id

    const { error } = await supabase.from("asignaciones_ministerio").insert(insertData)

    if (error) {
      setAsigError(error.message)
    } else {
      setNewAsig({ ministerio_id: "", organizacion_id: "", fecha_inicio: today })
      router.refresh()
    }
    setAsigLoading(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/personas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a Personas
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          {persona.apellido}, {persona.nombre}
        </h1>
        <p className="mt-1 text-muted-foreground">Editar información de la persona</p>
      </div>

      {/* Section A: Basic data */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Datos Personales</CardTitle>
          <CardDescription>Información básica de la persona</CardDescription>
        </CardHeader>
        <form onSubmit={handleBasicSubmit}>
          <CardContent className="space-y-6">
            {basicError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{basicError}</div>
            )}
            {basicSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">Datos actualizados correctamente</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" name="nombre" value={basicData.nombre} onChange={handleBasicChange} required disabled={basicLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input id="apellido" name="apellido" value={basicData.apellido} onChange={handleBasicChange} required disabled={basicLoading} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={basicData.email} onChange={handleBasicChange} disabled={basicLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" value={basicData.telefono} onChange={handleBasicChange} disabled={basicLoading} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                <select
                  id="tipo_documento"
                  name="tipo_documento"
                  value={basicData.tipo_documento}
                  onChange={handleBasicChange}
                  disabled={basicLoading}
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
                <Label htmlFor="documento">Número de Documento</Label>
                <Input id="documento" name="documento" value={basicData.documento} onChange={handleBasicChange} disabled={basicLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={basicData.fecha_nacimiento} onChange={handleBasicChange} disabled={basicLoading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={basicData.direccion} onChange={handleBasicChange} disabled={basicLoading} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="localidad">Localidad</Label>
                <Input id="localidad" name="localidad" value={basicData.localidad} onChange={handleBasicChange} disabled={basicLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input id="provincia" name="provincia" value={basicData.provincia} onChange={handleBasicChange} disabled={basicLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input id="pais" name="pais" value={basicData.pais} onChange={handleBasicChange} disabled={basicLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                rows={3}
                value={basicData.notas}
                onChange={handleBasicChange}
                disabled={basicLoading}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estado_eclesial">Estado Eclesiástico</Label>
                <select
                  id="estado_eclesial"
                  name="estado_eclesial"
                  value={basicData.estado_eclesial}
                  onChange={handleBasicChange}
                  disabled={basicLoading}
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
                  value={basicData.diocesis}
                  onChange={handleBasicChange}
                  disabled={basicLoading}
                />
              </div>
            </div>

            {/* Categoría y Parroquia */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoria_persona">Categoría</Label>
                <select
                  id="categoria_persona"
                  name="categoria_persona"
                  value={basicData.categoria_persona}
                  onChange={handleBasicChange}
                  disabled={basicLoading}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Sin especificar</option>
                  <option value="cecista">Cecista</option>
                  <option value="no_cecista">No Cecista</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parroquia">Parroquia</Label>
                <Input
                  id="parroquia"
                  name="parroquia"
                  placeholder="Ej: Parroquia San José"
                  value={basicData.parroquia}
                  onChange={handleBasicChange}
                  disabled={basicLoading}
                />
              </div>
            </div>

            {/* Flags institucionales */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="socio_asociacion"
                  name="socio_asociacion"
                  type="checkbox"
                  checked={basicData.socio_asociacion}
                  onChange={handleBasicChange}
                  disabled={basicLoading}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="socio_asociacion">Socio de la asociación</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="referente_comunidad"
                  name="referente_comunidad"
                  type="checkbox"
                  checked={basicData.referente_comunidad}
                  onChange={handleBasicChange}
                  disabled={basicLoading}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="referente_comunidad">Referente de comunidad</Label>
              </div>
              {basicData.categoria_persona === "cecista" && (
                <div className="flex items-center gap-2">
                  <input
                    id="cecista_dedicado"
                    name="cecista_dedicado"
                    type="checkbox"
                    checked={basicData.cecista_dedicado}
                    onChange={handleBasicChange}
                    disabled={basicLoading}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="cecista_dedicado">Cecista dedicado</Label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="acepta_comunicaciones"
                name="acepta_comunicaciones"
                type="checkbox"
                checked={basicData.acepta_comunicaciones}
                onChange={handleBasicChange}
                disabled={basicLoading}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="acepta_comunicaciones">Acepta recibir comunicaciones</Label>
            </div>

            <Button type="submit" disabled={basicLoading}>
              {basicLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Datos"
              )}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Section B: Participation mode */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Modo de Participación</CardTitle>
          <CardDescription>Estado institucional de la persona en la comunidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Modo actual:</span>
            {modoActual ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {modoLabels[modoActual.modo] ?? modoActual.modo}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground italic">Sin modo asignado</span>
            )}
            {modoActual && (
              <span className="text-xs text-muted-foreground">desde {modoActual.fecha_inicio}</span>
            )}
          </div>

          <form onSubmit={handleModoSubmit} className="space-y-4">
            {modoError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{modoError}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nuevoModo">Nuevo Modo</Label>
                <select
                  id="nuevoModo"
                  value={nuevoModo}
                  onChange={e => setNuevoModo(e.target.value)}
                  disabled={modoLoading}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Seleccionar modo...</option>
                  <option value="colaborador">Colaborador</option>
                  <option value="servidor">Servidor</option>
                  <option value="asesor">Asesor</option>
                  <option value="familiar">Familiar</option>
                  <option value="orante">Orante</option>
                  <option value="intercesor">Intercesor</option>
                </select>
              </div>
              {modoActual && (
                <div className="space-y-2">
                  <Label htmlFor="motivoFin">Motivo del cambio</Label>
                  <Input
                    id="motivoFin"
                    value={motivoFin}
                    onChange={e => setMotivoFin(e.target.value)}
                    placeholder="Opcional"
                    disabled={modoLoading}
                  />
                </div>
              )}
            </div>
            <Button type="submit" variant="outline" disabled={modoLoading || !nuevoModo}>
              {modoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                modoActual ? "Cambiar Modo" : "Asignar Modo"
              )}
            </Button>
          </form>

          {historialModos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Historial</p>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Modo</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Desde</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Hasta</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historialModos.map(m => (
                      <tr key={m.id}>
                        <td className="px-4 py-2 text-foreground">{modoLabels[m.modo] ?? m.modo}</td>
                        <td className="px-4 py-2 text-muted-foreground">{m.fecha_inicio}</td>
                        <td className="px-4 py-2 text-muted-foreground">{m.fecha_fin ?? "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{m.motivo_fin ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C: Ministry assignments */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Ministerios y Organización</CardTitle>
          <CardDescription>Asignaciones institucionales activas e históricas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {asigError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{asigError}</div>
          )}

          {/* Active assignments */}
          {asignacionesActivas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Asignaciones Activas</p>
              <div className="space-y-2">
                {asignacionesActivas.map(asig => (
                  <div key={asig.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {asig.ministerio?.nombre ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {asig.organizacion?.nombre ?? "Sin organización"} · desde {asig.fecha_inicio}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleCloseAsignacion(asig.id)}
                      disabled={closingId === asig.id}
                    >
                      {closingId === asig.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New assignment form */}
          <form onSubmit={handleAsigSubmit} className="space-y-4">
            <p className="text-sm font-medium text-foreground">Nueva Asignación</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ministerio_id">Ministerio *</Label>
                <select
                  id="ministerio_id"
                  value={newAsig.ministerio_id}
                  onChange={e => setNewAsig(prev => ({ ...prev, ministerio_id: e.target.value }))}
                  disabled={asigLoading}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Seleccionar ministerio...</option>
                  {ministerios.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.nivel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizacion_id">Organización</Label>
                <select
                  id="organizacion_id"
                  value={newAsig.organizacion_id}
                  onChange={e => setNewAsig(prev => ({ ...prev, organizacion_id: e.target.value }))}
                  disabled={asigLoading}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Sin organización</option>
                  {organizaciones.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.nombre} ({o.tipo})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2 sm:w-48">
              <Label htmlFor="fecha_inicio_asig">Fecha de Inicio</Label>
              <Input
                id="fecha_inicio_asig"
                type="date"
                value={newAsig.fecha_inicio}
                onChange={e => setNewAsig(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                disabled={asigLoading}
              />
            </div>
            <Button type="submit" variant="outline" disabled={asigLoading || !newAsig.ministerio_id}>
              {asigLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Agregar Asignación"
              )}
            </Button>
          </form>

          {/* Assignment history */}
          {historialAsignaciones.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Historial de Asignaciones</p>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Ministerio</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Organización</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Desde</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Hasta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historialAsignaciones.map(a => (
                      <tr key={a.id}>
                        <td className="px-4 py-2 text-foreground">{a.ministerio?.nombre ?? "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{a.organizacion?.nombre ?? "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{a.fecha_inicio}</td>
                        <td className="px-4 py-2 text-muted-foreground">{a.fecha_fin ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section D: System role — only visible to users with roles.assign */}
      {canAssignRoles && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Rol de Acceso al Sistema</CardTitle>
            <CardDescription>Controla qué puede ver y hacer esta persona en la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rolError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{rolError}</div>
            )}
            {rolSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">Rol actualizado correctamente</div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Rol actual:</span>
              {rolActivo ? (
                <>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {rolActivo.rol_sistema?.nombre ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    desde {rolActivo.fecha_inicio}
                    {rolActivo.organizacion && ` · ${rolActivo.organizacion.nombre}`}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground italic">Sin rol asignado</span>
              )}
            </div>

            <form onSubmit={handleRolSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newRolId">{rolActivo ? "Cambiar a rol" : "Asignar rol"}</Label>
                  <select
                    id="newRolId"
                    value={newRolId}
                    onChange={e => setNewRolId(e.target.value)}
                    disabled={rolLoading}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                  >
                    <option value="">Seleccionar rol...</option>
                    {rolesSistema.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} (nivel {r.nivel_acceso})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newRolOrgId">Organización (opcional)</Label>
                  <select
                    id="newRolOrgId"
                    value={newRolOrgId}
                    onChange={e => setNewRolOrgId(e.target.value)}
                    disabled={rolLoading}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                  >
                    <option value="">Global (sin restricción)</option>
                    {organizaciones.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.nombre} ({o.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" variant="outline" disabled={rolLoading || !newRolId}>
                {rolLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  rolActivo ? "Cambiar Rol" : "Asignar Rol"
                )}
              </Button>
            </form>

            {historialRoles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Historial de Acceso</p>
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Rol</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Organización</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Desde</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Hasta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {historialRoles.map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-2 text-foreground">{r.rol_sistema?.nombre ?? "—"}</td>
                          <td className="px-4 py-2 text-muted-foreground">{r.organizacion?.nombre ?? "Global"}</td>
                          <td className="px-4 py-2 text-muted-foreground">{r.fecha_inicio}</td>
                          <td className="px-4 py-2 text-muted-foreground">{r.fecha_fin ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
