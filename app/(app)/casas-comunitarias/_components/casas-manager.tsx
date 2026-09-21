'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Home, Plus, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { translateSupabaseError } from '@/lib/errors/supabase'

type Casa = {
  id: string
  codigo: string | null
  nombre: string
  tipo: string | null
  estado: string | null
}

const TIPO_LABEL: Record<string, string> = {
  incoada: 'Incoada',
  con_pautas_aprobadas: 'Con pautas aprobadas',
}

const selectClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm'

export default function CasasComunitariasManager({ initial }: { initial: Casa[] }) {
  const [casas, setCasas] = useState<Casa[]>(initial)
  const [form, setForm] = useState({ codigo: '', nombre: '', tipo: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmandoBaja, setConfirmandoBaja] = useState<string | null>(null)

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('casas_comunitarias')
      .insert({
        codigo: form.codigo.trim() || null,
        nombre: form.nombre.trim(),
        tipo: form.tipo || null,
      })
      .select('id, codigo, nombre, tipo, estado')
      .single()
    setSaving(false)
    if (error) {
      setError(translateSupabaseError(error.message))
      return
    }
    if (data) {
      setCasas(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setForm({ codigo: '', nombre: '', tipo: '' })
    }
  }

  async function handleDelete(id: string) {
    setConfirmandoBaja(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('casas_comunitarias')
      .update({ estado: 'inactiva', fecha_baja: new Date().toISOString().split('T')[0] })
      .eq('id', id)
    if (error) {
      setError(translateSupabaseError(error.message))
      return
    }
    setCasas(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Home className="h-8 w-8 text-primary" />
          Casas Comunitarias
        </h1>
        <p className="mt-2 text-muted-foreground">
          Alta y baja de casas comunitarias. Los cecistas las seleccionan desde su perfil.
        </p>
      </div>

      {/* Alta */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nueva Casa Comunitaria
          </CardTitle>
          <CardDescription>Por ahora se registran código, tipo y nombre.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[140px_1fr_220px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="cc-codigo">Código</Label>
              <Input id="cc-codigo" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-nombre">Nombre *</Label>
              <Input id="cc-nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-tipo">Tipo</Label>
              <select id="cc-tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} disabled={saving} className={selectClass}>
                <option value="">Sin especificar</option>
                <option value="incoada">Incoada</option>
                <option value="con_pautas_aprobadas">Con pautas aprobadas</option>
              </select>
            </div>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Agregar
            </Button>
          </form>
          {error && (
            <div className="mt-3 rounded-md bg-destructive/10 text-destructive text-sm px-4 py-3">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Casas registradas</CardTitle>
          <CardDescription>{casas.length} casa{casas.length === 1 ? '' : 's'} activa{casas.length === 1 ? '' : 's'}</CardDescription>
        </CardHeader>
        <CardContent>
          {casas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Todavía no hay casas comunitarias cargadas.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {casas.map(c => (
                <div key={c.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {c.codigo ? <span className="text-muted-foreground">{c.codigo} — </span> : null}
                      {c.nombre}
                    </p>
                    {c.tipo && (
                      <p className="text-xs text-muted-foreground">{TIPO_LABEL[c.tipo] ?? c.tipo}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => setConfirmandoBaja(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmandoBaja !== null}
        onOpenChange={open => {
          if (!open) setConfirmandoBaja(null)
        }}
        titulo="¿Dar de baja esta casa comunitaria?"
        descripcion="Queda inactiva y deja de aparecer en los listados. No se borra: se puede reactivar desde la base si hace falta."
        confirmar="Dar de baja"
        tono="destructivo"
        onConfirm={() => {
          if (confirmandoBaja) handleDelete(confirmandoBaja)
        }}
      />
    </div>
  )
}
