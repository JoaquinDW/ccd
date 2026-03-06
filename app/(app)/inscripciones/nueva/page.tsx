'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PersonaOption = { id: string; nombre: string; apellido: string }
type EventoOption = { id: string; nombre: string; fecha_inicio: string }

export default function NewInscripcionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [personas, setPersonas] = useState<PersonaOption[]>([])
  const [eventos, setEventos] = useState<EventoOption[]>([])
  const router = useRouter()
  const [formData, setFormData] = useState({
    persona_id: '',
    evento_id: '',
    rol_en_evento: 'convivente',
    estado_inscripcion: 'pendiente',
    notas: '',
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('personas')
        .select('id, nombre, apellido')
        .is('fecha_baja', null)
        .order('apellido'),
      supabase
        .from('eventos')
        .select('id, nombre, fecha_inicio')
        .in('estado', ['publicado', 'aprobado'])
        .order('fecha_inicio', { ascending: false }),
    ]).then(([p, e]) => {
      if (p.data) setPersonas(p.data)
      if (e.data) setEventos(e.data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const insertData: Record<string, unknown> = {
        persona_id: formData.persona_id,
        evento_id: formData.evento_id,
        rol_en_evento: formData.rol_en_evento,
        estado_inscripcion: formData.estado_inscripcion,
      }
      if (formData.notas) insertData.notas = formData.notas

      const { error: inscError } = await supabase.from('evento_participantes').insert(insertData)
      if (inscError) throw inscError

      router.push('/inscripciones')
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      if (e.code === '23505') {
        setError('Esta persona ya está inscripta en ese evento.')
      } else {
        setError(e.message ?? 'Error al crear la inscripción')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-6">
      <Link href="/inscripciones" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Inscripciones
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nueva Inscripción</CardTitle>
          <CardDescription>Registra una nueva inscripción a un evento</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Persona */}
            <div className="space-y-2">
              <Label htmlFor="persona_id">Persona *</Label>
              <select
                id="persona_id"
                name="persona_id"
                value={formData.persona_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Seleccionar persona...</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.apellido}, {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Evento */}
            <div className="space-y-2">
              <Label htmlFor="evento_id">Evento *</Label>
              <select
                id="evento_id"
                name="evento_id"
                value={formData.evento_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Seleccionar evento...</option>
                {eventos.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre} ({ev.fecha_inicio})
                  </option>
                ))}
              </select>
            </div>

            {/* Rol y Estado */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rol_en_evento">Rol en el Evento</Label>
                <select
                  id="rol_en_evento"
                  name="rol_en_evento"
                  value={formData.rol_en_evento}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="convivente">Convivente</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="asesor">Asesor</option>
                  <option value="centralizador">Centralizador</option>
                  <option value="equipo_auxiliar">Equipo Auxiliar</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado_inscripcion">Estado</Label>
                <select
                  id="estado_inscripcion"
                  name="estado_inscripcion"
                  value={formData.estado_inscripcion}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="lista_espera">Lista de Espera</option>
                </select>
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
                {loading ? 'Guardando...' : 'Crear Inscripción'}
              </Button>
              <Link href="/inscripciones">
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
