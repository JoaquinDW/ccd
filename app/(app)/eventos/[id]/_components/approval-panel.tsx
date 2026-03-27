'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDateAR } from '@/lib/utils'

type ResultadoDiscernimiento =
  | 'aprobado_sin_modificaciones'
  | 'aprobado_con_modificaciones'
  | 'rechazado'
  | ''

type EventoCamposEditables = {
  nombre: string
  fecha_inicio: string | null
  fecha_fin: string | null
  ciudad: string | null
  provincia_evento: string | null
  pais_evento: string | null
  codigo_postal: string | null
  diocesis: string | null
  coordinadores_propuestos: string | null
  asesor_propuesto: string | null
  asesor_voluntario: boolean | null
  modalidad: string | null
  notas: string | null
  cupo_maximo: number | null
}

type DiscernimientoNivel = {
  nivel: 'confra' | 'eqt'
  title: string
  /** Si ya fue comunicado previamente — mostrar en modo solo lectura */
  yaRegistrado?: {
    estado: string
    fecha: string | null
    notas: string | null
  }
}

type Props = {
  eventoId: string
  niveles: DiscernimientoNivel[]
  evento: EventoCamposEditables
}

const estadoDiscLabel: Record<string, string> = {
  aprobado_sin_modificaciones: 'Aprobado sin modificaciones',
  aprobado_con_modificaciones: 'Aprobado con modificaciones',
  rechazado: 'Rechazado',
}

function NivelDiscernimiento({
  eventoId,
  nivel,
  title,
  yaRegistrado,
  evento,
}: DiscernimientoNivel & { eventoId: string; evento: EventoCamposEditables }) {
  const router = useRouter()
  const [resultado, setResultado] = useState<ResultadoDiscernimiento>('')
  const [notas, setNotas] = useState('')
  const [cambios, setCambios] = useState<Partial<Record<keyof EventoCamposEditables, string>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function currentVal(campo: keyof EventoCamposEditables): string {
    if (campo in cambios) return cambios[campo] ?? ''
    const v = evento[campo]
    return v == null ? '' : String(v)
  }

  function setCampo(campo: keyof EventoCamposEditables, val: string) {
    setCambios(prev => ({ ...prev, [campo]: val }))
  }

  const handleComunicar = async () => {
    if (!resultado) {
      setError('Seleccioná un estado de discernimiento')
      return
    }
    if (resultado === 'rechazado' && !notas.trim()) {
      setError('Las notas son obligatorias al rechazar')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Compute diff — only send fields that actually changed
      const camposConCambio: Record<string, unknown> = {}
      if (resultado === 'aprobado_con_modificaciones') {
        for (const [campo, nuevoStr] of Object.entries(cambios)) {
          const originalStr = String(evento[campo as keyof EventoCamposEditables] ?? '')
          if (nuevoStr === originalStr) continue
          if (campo === 'asesor_voluntario') {
            camposConCambio[campo] = nuevoStr === 'true'
          } else if (campo === 'cupo_maximo') {
            camposConCambio[campo] = nuevoStr === '' ? null : Number(nuevoStr)
          } else {
            camposConCambio[campo] = nuevoStr === '' ? null : nuevoStr
          }
        }
      }

      const payload: Record<string, unknown> = {
        resultado_discernimiento: resultado,
        notas_discernimiento: notas || undefined,
      }
      if (Object.keys(camposConCambio).length > 0) {
        payload.cambios = camposConCambio
      }

      const res = await fetch(`/api/eventos/${eventoId}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al comunicar el discernimiento')
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const readonlyInputClass = 'rounded border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground w-full'
  const inputClass = 'w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground'

  return (
    <div className="space-y-4">
      {/* Header row with checkbox-style indicator */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded border-2 border-foreground bg-foreground flex items-center justify-center">
          <svg className="h-3 w-3 text-background" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-foreground">{title}</span>
      </div>

      {yaRegistrado ? (
        /* Modo solo lectura — ya fue comunicado */
        <div className="grid gap-3 pl-6">
          <div className="grid gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha discernimiento</p>
              <div className={readonlyInputClass}>{formatDateAR(yaRegistrado.fecha)}</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado discernimiento</p>
              <div className={readonlyInputClass}>
                {estadoDiscLabel[yaRegistrado.estado] ?? yaRegistrado.estado}
              </div>
            </div>
          </div>
          {yaRegistrado.notas && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas aclaratorias</p>
              <div className={`${readonlyInputClass} min-h-16 whitespace-pre-wrap`}>{yaRegistrado.notas}</div>
            </div>
          )}
        </div>
      ) : (
        /* Modo edición — pendiente de comunicar */
        <div className="grid gap-4 pl-6">
          <div className="grid gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha discernimiento</p>
              <div className={readonlyInputClass}>{formatDateAR(new Date().toISOString().split('T')[0])} (hoy)</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado discernimiento *</p>
              <select
                value={resultado}
                onChange={e => { setResultado(e.target.value as ResultadoDiscernimiento); setError('') }}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="">— Seleccionar —</option>
                <option value="aprobado_sin_modificaciones">Aprobado sin modificaciones</option>
                <option value="aprobado_con_modificaciones">Aprobado con modificaciones</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Notas aclaratorias{resultado === 'rechazado' && <span className="text-destructive"> *</span>}
            </p>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones, cambios sugeridos, contexto pastoral..."
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground min-h-20"
            />
          </div>

          {/* Campos editables — solo cuando se aprueba con modificaciones */}
          {resultado === 'aprobado_con_modificaciones' && (
            <div className="space-y-3 rounded-md border border-border p-4 bg-muted/30">
              <p className="text-xs font-medium text-foreground uppercase tracking-wide">
                Modificaciones al evento
              </p>
              <p className="text-xs text-muted-foreground">
                Completá solo los campos que querés modificar. Los demás quedan como están.
              </p>

              {/* Nombre */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nombre</p>
                <input
                  className={inputClass}
                  value={currentVal('nombre')}
                  onChange={e => setCampo('nombre', e.target.value)}
                />
              </div>

              {/* Fechas */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha inicio</p>
                  <input
                    type="date"
                    className={inputClass}
                    value={currentVal('fecha_inicio')}
                    onChange={e => setCampo('fecha_inicio', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha fin</p>
                  <input
                    type="date"
                    className={inputClass}
                    value={currentVal('fecha_fin')}
                    onChange={e => setCampo('fecha_fin', e.target.value)}
                  />
                </div>
              </div>

              {/* Modalidad + Cupo */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Modalidad</p>
                  <select
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                    value={currentVal('modalidad')}
                    onChange={e => setCampo('modalidad', e.target.value)}
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="bimodal">Bimodal</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cupo máximo</p>
                  <input
                    type="number"
                    className={inputClass}
                    value={currentVal('cupo_maximo')}
                    onChange={e => setCampo('cupo_maximo', e.target.value)}
                  />
                </div>
              </div>

              {/* Coordinadores */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Coordinadores propuestos</p>
                <input
                  className={inputClass}
                  value={currentVal('coordinadores_propuestos')}
                  onChange={e => setCampo('coordinadores_propuestos', e.target.value)}
                />
              </div>

              {/* Asesor + voluntario */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Asesor propuesto</p>
                  <input
                    className={inputClass}
                    value={currentVal('asesor_propuesto')}
                    onChange={e => setCampo('asesor_propuesto', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id={`asesor_voluntario_${nivel}`}
                    checked={currentVal('asesor_voluntario') === 'true'}
                    onChange={e => setCampo('asesor_voluntario', String(e.target.checked))}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor={`asesor_voluntario_${nivel}`} className="text-sm text-foreground cursor-pointer">
                    Asesor voluntario
                  </label>
                </div>
              </div>

              {/* Ubicación */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ciudad</p>
                  <input
                    className={inputClass}
                    value={currentVal('ciudad')}
                    onChange={e => setCampo('ciudad', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Provincia</p>
                  <input
                    className={inputClass}
                    value={currentVal('provincia_evento')}
                    onChange={e => setCampo('provincia_evento', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">País</p>
                  <input
                    className={inputClass}
                    value={currentVal('pais_evento')}
                    onChange={e => setCampo('pais_evento', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Código postal</p>
                  <input
                    className={inputClass}
                    value={currentVal('codigo_postal')}
                    onChange={e => setCampo('codigo_postal', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Diócesis</p>
                <input
                  className={inputClass}
                  value={currentVal('diocesis')}
                  onChange={e => setCampo('diocesis', e.target.value)}
                />
              </div>

              {/* Notas del evento */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas del evento</p>
                <textarea
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground min-h-16"
                  value={currentVal('notas')}
                  onChange={e => setCampo('notas', e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            size="sm"
            disabled={loading || !resultado}
            onClick={handleComunicar}
            className="w-full"
          >
            {loading ? 'Comunicando...' : 'Comunicar Discernimiento'}
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function DiscernimientoPanel({ eventoId, niveles, evento }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-foreground border-b border-border pb-3">
        Discernimiento de la Solicitud
      </h3>

      {niveles.map((n, i) => (
        <div key={n.nivel}>
          <NivelDiscernimiento eventoId={eventoId} evento={evento} {...n} />
          {i < niveles.length - 1 && <div className="border-t border-border mt-6" />}
        </div>
      ))}
    </div>
  )
}
