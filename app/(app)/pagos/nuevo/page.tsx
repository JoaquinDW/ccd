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
import { Combobox } from '@/components/ui/combobox'

type ParticipanteOption = {
  id: string
  persona: { nombre: string; apellido: string } | null
  evento: { nombre: string; fecha_inicio: string } | null
}

export default function NewPagoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [participantes, setParticipantes] = useState<ParticipanteOption[]>([])
  const [linkPension, setLinkPension] = useState('')
  const router = useRouter()
  const [formData, setFormData] = useState({
    evento_participante_id: '',
    concepto: 'inscripcion',
    monto: '',
    medio_pago: 'transferencia',
    estado_pago: 'pendiente',
    fecha_pago: new Date().toISOString().split('T')[0],
    referencia: '',
    notas: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('evento_participantes')
      .select(`
        id,
        persona:personas!persona_id(nombre, apellido),
        evento:eventos!evento_id(nombre, fecha_inicio)
      `)
      .in('estado_participacion', ['interesado', 'inscripto'])
      .order('fecha_inscripcion', { ascending: false })
      .then(({ data }) => {
        if (data) setParticipantes(data as ParticipanteOption[])
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLinkPension('')

    try {
      // Pensión por Mercado Pago: se genera un link de pago para compartir,
      // en vez de insertar el pago directamente (queda pendiente hasta que se paga).
      if (formData.concepto === 'pension' && formData.medio_pago === 'mercadopago') {
        const res = await fetch('/api/pagos/pension/preferencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evento_participante_id: formData.evento_participante_id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'No se pudo generar el link de pago')
        setLinkPension(data.checkout_url)
        return
      }

      const supabase = createClient()

      const insertData: Record<string, unknown> = {
        evento_participante_id: formData.evento_participante_id,
        concepto: formData.concepto,
        monto: parseFloat(formData.monto),
        medio_pago: formData.medio_pago,
        estado_pago: formData.estado_pago,
        fecha_pago: formData.fecha_pago,
      }
      if (formData.referencia) insertData.referencia = formData.referencia
      if (formData.notas) insertData.notas = formData.notas

      const { error: pagoError } = await supabase.from('pagos').insert(insertData)
      if (pagoError) throw pagoError

      if (formData.estado_pago === 'confirmado' && formData.concepto === 'inscripcion') {
        await supabase
          .from('evento_participantes')
          .update({ estado_participacion: 'inscripto' })
          .eq('id', formData.evento_participante_id)
          .eq('estado_participacion', 'interesado')
      }

      router.push('/pagos')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el pago'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const esPensionMercadopago = formData.concepto === 'pension' && formData.medio_pago === 'mercadopago'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-6">
      <Link href="/pagos" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Pagos
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Registrar Nuevo Pago</CardTitle>
          <CardDescription>Registra un pago de inscripción o de pensión para un evento</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {linkPension && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-2">
                <p className="text-foreground font-medium">Link de pago de pensión generado</p>
                <p className="break-all text-muted-foreground">{linkPension}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => navigator.clipboard.writeText(linkPension)}
                  >
                    Copiar link
                  </Button>
                  <Button type="button" size="sm" onClick={() => router.push('/pagos')}>
                    Ir a Pagos
                  </Button>
                </div>
              </div>
            )}

            {/* Concepto */}
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto *</Label>
              <select
                id="concepto"
                name="concepto"
                value={formData.concepto}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="inscripcion">Inscripción</option>
                <option value="pension">Pensión</option>
              </select>
            </div>

            {/* Participante */}
            <div className="space-y-2">
              <Label htmlFor="evento_participante_id">Participante *</Label>
              <Combobox
                id="evento_participante_id"
                value={formData.evento_participante_id}
                onSelect={val => setFormData(prev => ({ ...prev, evento_participante_id: val }))}
                options={participantes.map(p => ({
                  label: `${p.persona ? `${p.persona.apellido}, ${p.persona.nombre}` : '?'} — ${p.evento ? `${p.evento.nombre} (${p.evento.fecha_inicio})` : '?'}`,
                  value: p.id,
                }))}
                placeholder="Seleccionar inscripción..."
                searchPlaceholder="Buscar por persona o evento..."
                emptyText="No se encontraron inscripciones."
              />
            </div>

            {/* Monto y Método */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto {esPensionMercadopago ? '' : '*'}</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={handleChange}
                  required={!esPensionMercadopago}
                  disabled={esPensionMercadopago}
                />
                {esPensionMercadopago && (
                  <p className="text-xs text-muted-foreground">
                    Se usa el precio de pensión configurado en el evento.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="medio_pago">Medio de Pago *</Label>
                <select
                  id="medio_pago"
                  name="medio_pago"
                  value={formData.medio_pago}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="mercadopago">MercadoPago</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Fecha y Estado */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha_pago">Fecha del Pago *</Label>
                <Input
                  id="fecha_pago"
                  name="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado_pago">Estado *</Label>
                <select
                  id="estado_pago"
                  name="estado_pago"
                  value={formData.estado_pago}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                name="referencia"
                placeholder="Número de transacción o comprobante"
                value={formData.referencia}
                onChange={handleChange}
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                placeholder="Observaciones adicionales..."
                value={formData.notas}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm min-h-20"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={loading}>
                {loading
                  ? 'Guardando...'
                  : esPensionMercadopago
                    ? 'Generar Link de Pago'
                    : 'Registrar Pago'}
              </Button>
              <Link href="/pagos">
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
