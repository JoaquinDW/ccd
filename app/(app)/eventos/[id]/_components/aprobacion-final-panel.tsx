'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'

type Centralizador = {
  personaId: string
  nombre: string
  email: string
  telefono: string
}

type Persona = {
  id: string
  nombre: string
  apellido: string
  email?: string | null
  telefono?: string | null
}

type Props = {
  eventoId: string
  inicial: {
    casa_retiro_id: string | null
    coordinador_asignado_id: string | null
    asesor_asignado_id: string | null
    centralizador_1_persona_id: string | null
    centralizador_1_nombre: string | null
    centralizador_1_email: string | null
    centralizador_1_telefono: string | null
    centralizador_2_persona_id: string | null
    centralizador_2_nombre: string | null
    centralizador_2_email: string | null
    centralizador_2_telefono: string | null
    centralizador_3_persona_id: string | null
    centralizador_3_nombre: string | null
    centralizador_3_email: string | null
    centralizador_3_telefono: string | null
    notas_aprobacion_final: string | null
  }
  casasRetiro: { id: string; nombre: string; ciudad?: string | null; provincia?: string | null }[]
  personas: Persona[]
}

function toStr(v: string | null | undefined): string {
  return v ?? ''
}

export default function AprobacionFinalPanel({ eventoId, inicial, casasRetiro, personas }: Props) {
  const router = useRouter()

  const [casaRetiroId, setCasaRetiroId] = useState(toStr(inicial.casa_retiro_id))
  const [coordinadorId, setCoordinadorId] = useState(toStr(inicial.coordinador_asignado_id))
  const [asesorId, setAsesorId] = useState(toStr(inicial.asesor_asignado_id))
  const [centralizadores, setCentralizadores] = useState<Centralizador[]>([
    { personaId: toStr(inicial.centralizador_1_persona_id), nombre: toStr(inicial.centralizador_1_nombre), email: toStr(inicial.centralizador_1_email), telefono: toStr(inicial.centralizador_1_telefono) },
    { personaId: toStr(inicial.centralizador_2_persona_id), nombre: toStr(inicial.centralizador_2_nombre), email: toStr(inicial.centralizador_2_email), telefono: toStr(inicial.centralizador_2_telefono) },
    { personaId: toStr(inicial.centralizador_3_persona_id), nombre: toStr(inicial.centralizador_3_nombre), email: toStr(inicial.centralizador_3_email), telefono: toStr(inicial.centralizador_3_telefono) },
  ])
  const [notas, setNotas] = useState(toStr(inicial.notas_aprobacion_final))
  const [loading, setLoading] = useState<'publicar' | 'suspender' | null>(null)
  const [error, setError] = useState('')

  const personaOptions = personas.map(p => ({ value: p.id, label: `${p.apellido}, ${p.nombre}` }))

  function selectCentralizador(i: number, personaId: string) {
    const p = personas.find(x => x.id === personaId)
    if (!p) {
      setCentralizadores(prev => {
        const next = [...prev]
        next[i] = { personaId: '', nombre: '', email: '', telefono: '' }
        return next
      })
      return
    }
    setCentralizadores(prev => {
      const next = [...prev]
      next[i] = {
        personaId: p.id,
        nombre: `${p.nombre} ${p.apellido}`,
        // Preserve existing value if persona has no contact info stored
        email: p.email ? toStr(p.email) : next[i].email,
        telefono: p.telefono ? toStr(p.telefono) : next[i].telefono,
      }
      return next
    })
  }

  function updateCentralizadorField(i: number, field: 'email' | 'telefono', value: string) {
    setCentralizadores(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  function buildPayload(accion: 'publicar' | 'suspender') {
    return {
      accion,
      notas_aprobacion_final: notas || null,
      casa_retiro_id: casaRetiroId || null,
      coordinador_asignado_id: coordinadorId || null,
      asesor_asignado_id: asesorId || null,
      centralizador_1_persona_id: centralizadores[0].personaId || null,
      centralizador_1_nombre: centralizadores[0].nombre || null,
      centralizador_1_email: centralizadores[0].email || null,
      centralizador_1_telefono: centralizadores[0].telefono || null,
      centralizador_2_persona_id: centralizadores[1].personaId || null,
      centralizador_2_nombre: centralizadores[1].nombre || null,
      centralizador_2_email: centralizadores[1].email || null,
      centralizador_2_telefono: centralizadores[1].telefono || null,
      centralizador_3_persona_id: centralizadores[2].personaId || null,
      centralizador_3_nombre: centralizadores[2].nombre || null,
      centralizador_3_email: centralizadores[2].email || null,
      centralizador_3_telefono: centralizadores[2].telefono || null,
    }
  }

  async function handleAccion(accion: 'publicar' | 'suspender') {
    if (accion === 'suspender') {
      const ok = window.confirm('¿Confirmás que querés suspender este evento? Esta acción cambiará el estado a Suspendido.')
      if (!ok) return
    }
    setLoading(accion)
    setError('')
    try {
      const res = await fetch(`/api/eventos/${eventoId}/aprobacion-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(accion)),
      })
      if (!res.ok) {
        const { error: e } = await res.json()
        throw new Error(e ?? 'Error inesperado')
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(null)
    }
  }

  const inputClass = 'w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground'

  return (
    <div className="rounded-lg border border-violet-200 dark:border-violet-900 bg-card p-6 space-y-5">
      <h3 className="text-sm font-bold uppercase tracking-widest text-foreground border-b border-border pb-3">
        Aprobación Final — Equipo Timón
      </h3>
      <p className="text-xs text-muted-foreground">
        Revisá y confirmá los datos definitivos antes de publicar. Podés modificar la casa de retiros, coordinador, asesor y centralizadores.
      </p>

      {/* Casa de Retiro */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Casa de Retiros</p>
        <Combobox
          value={casaRetiroId}
          onSelect={setCasaRetiroId}
          options={casasRetiro.map(cr => ({ label: cr.ciudad ? `${cr.nombre} — ${cr.ciudad}` : cr.nombre, value: cr.id }))}
          placeholder="— Sin asignar —"
          searchPlaceholder="Buscar casa de retiro..."
          emptyText="No se encontraron casas de retiro."
        />
      </div>

      {/* Coordinador */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Coordinador</p>
        <Combobox
          value={coordinadorId}
          onSelect={setCoordinadorId}
          options={personaOptions}
          placeholder="Buscar coordinador..."
          searchPlaceholder="Buscar por apellido o nombre..."
          emptyText="No se encontraron personas."
        />
      </div>

      {/* Asesor */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Asesor</p>
        <Combobox
          value={asesorId}
          onSelect={setAsesorId}
          options={personaOptions}
          placeholder="Buscar asesor..."
          searchPlaceholder="Buscar por apellido o nombre..."
          emptyText="No se encontraron personas."
        />
      </div>

      {/* Centralizadores */}
      {([1, 2, 3] as const).map(n => {
        const i = n - 1
        const c = centralizadores[i]
        const isRequired = n === 1
        return (
          <div key={n} className="space-y-2 rounded-md border border-border p-3 bg-muted/20">
            <p className="text-xs font-medium text-foreground uppercase tracking-wide">
              Centralizador {n}{isRequired && <span className="text-destructive ml-1">*</span>}
            </p>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Persona cecista</p>
              <Combobox
                value={c.personaId}
                onSelect={(id) => selectCentralizador(i, id)}
                options={personaOptions}
                placeholder="Buscar cecista..."
                searchPlaceholder="Buscar por apellido o nombre..."
                emptyText="No se encontraron personas."
              />
              {c.nombre && !c.personaId && (
                <p className="mt-1 text-xs text-muted-foreground">{c.nombre}</p>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email para el evento</p>
                <input
                  type="email"
                  className={inputClass}
                  value={c.email}
                  placeholder="correo@ejemplo.com"
                  onChange={e => updateCentralizadorField(i, 'email', e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Celular para el evento</p>
                <input
                  type="tel"
                  className={inputClass}
                  value={c.telefono}
                  placeholder="+54 11 0000-0000"
                  onChange={e => updateCentralizadorField(i, 'telefono', e.target.value)}
                />
              </div>
            </div>
          </div>
        )
      })}

      {/* Notas */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
        <textarea
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground min-h-20"
          value={notas}
          placeholder="Observaciones de la aprobación final..."
          onChange={e => setNotas(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={loading !== null}
          onClick={() => handleAccion('suspender')}
          className="flex-1"
        >
          {loading === 'suspender' ? 'Suspendiendo...' : 'Suspender Evento'}
        </Button>
        <Button
          size="sm"
          disabled={loading !== null}
          onClick={() => handleAccion('publicar')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {loading === 'publicar' ? 'Publicando...' : 'Publicar Evento'}
        </Button>
      </div>
    </div>
  )
}
