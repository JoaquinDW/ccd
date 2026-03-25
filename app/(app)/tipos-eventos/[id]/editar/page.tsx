'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag, ArrowLeft } from 'lucide-react'

export default function EditarTipoEventoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'convivencia',
    alcance: 'interno',
    requiere_discernimiento_confra: false,
    requiere_discernimiento_eqt: false,
    requisitos: '',
  })

  useEffect(() => {
    fetch(`/api/tipos-eventos/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setFormData({
            nombre: data.nombre ?? '',
            categoria: data.categoria ?? 'convivencia',
            alcance: data.alcance ?? 'interno',
            requiere_discernimiento_confra: data.requiere_discernimiento_confra ?? false,
            requiere_discernimiento_eqt: data.requiere_discernimiento_eqt ?? false,
            requisitos: data.requisitos ?? '',
          })
        }
        setLoadingData(false)
      })
      .catch(() => {
        setError('No se pudo cargar el tipo de evento')
        setLoadingData(false)
      })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/tipos-eventos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al guardar')
      }

      router.push('/tipos-eventos')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Cargando...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/tipos-eventos">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
        <Tag className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Editar Tipo de Evento</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Datos del tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="nombre">
                Nombre <span className="text-destructive">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Convivencia con Dios"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="categoria">
                  Categoría <span className="text-destructive">*</span>
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  required
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="convivencia">Convivencia</option>
                  <option value="retiro">Retiro</option>
                  <option value="taller">Taller</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="alcance">
                  Alcance <span className="text-destructive">*</span>
                </label>
                <select
                  id="alcance"
                  name="alcance"
                  required
                  value={formData.alcance}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="interno">Interno</option>
                  <option value="abierto">Abierto</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Discernimiento requerido</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="requiere_discernimiento_confra"
                  checked={formData.requiere_discernimiento_confra}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Requiere discernimiento Confraternidad</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="requiere_discernimiento_eqt"
                  checked={formData.requiere_discernimiento_eqt}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Requiere discernimiento Equipo Timón</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="requisitos">
                Requisitos a considerar
              </label>
              <textarea
                id="requisitos"
                name="requisitos"
                rows={4}
                value={formData.requisitos}
                onChange={handleChange}
                placeholder="Descripción de requisitos o condiciones especiales..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/tipos-eventos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
