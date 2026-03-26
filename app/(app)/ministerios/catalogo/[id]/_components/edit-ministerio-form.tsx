'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface Ministerio {
  id: string
  nombre: string
  tipo: string
  nivel: string
  nivel_acceso: number
  activo: boolean
}

const tipoLabel: Record<string, string> = {
  conduccion: 'Conducción',
  pastoral: 'Pastoral',
  servicio: 'De Servicio',
  sistema: 'Sistema',
}

const nivelLabel: Record<string, string> = {
  comunidad: 'Comunidad',
  confraternidad: 'Confraternidad',
  fraternidad: 'Fraternidad',
  evento: 'Evento',
}

const nivelAccesoLabel = (nivel: number) => {
  if (nivel === 0) return 'Sin acceso técnico'
  if (nivel <= 20) return 'Acceso mínimo'
  if (nivel <= 50) return 'Acceso básico'
  if (nivel <= 70) return 'Acceso medio'
  if (nivel <= 90) return 'Acceso alto'
  return 'Acceso completo'
}

interface Props {
  ministerio: Ministerio
  nivelCalculado: number
}

export function EditMinisterioForm({ ministerio, nivelCalculado }: Props) {
  const [nivel, setNivel] = useState(nivelCalculado)
  const [nombre, setNombre] = useState(ministerio.nombre)
  const [tipo, setTipo] = useState(ministerio.tipo)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Permite que PermisosMatrix actualice el nivel mostrado
  if (nivel !== nivelCalculado) {
    setNivel(nivelCalculado)
  }

  const isReadOnly = ministerio.tipo === 'sistema'
  const isDirty = nombre !== ministerio.nombre || tipo !== ministerio.tipo

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('ministerios')
      .update({ nombre: nombre.trim(), tipo })
      .eq('id', ministerio.id)
    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Datos del Rol en Ministerio</CardTitle>
        <CardDescription>
          {isReadOnly
            ? 'Rol del sistema — nombre y tipo no se pueden modificar'
            : 'Editá el nombre y tipo del rol en ministerio'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            disabled={isReadOnly}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          {isReadOnly ? (
            <Input value={tipoLabel[tipo] ?? tipo} disabled className="text-sm" />
          ) : (
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conduccion">Conducción</SelectItem>
                <SelectItem value="pastoral">Pastoral</SelectItem>
                <SelectItem value="servicio">De Servicio</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Nivel organizacional</Label>
          <Input value={nivelLabel[ministerio.nivel] ?? ministerio.nivel} disabled className="text-sm capitalize" />
        </div>

        <div className="space-y-2">
          <Label>Nivel de acceso al sistema</Label>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${nivel}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums w-8 text-right">{nivel}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {nivelAccesoLabel(nivel)} — se calcula automáticamente según los permisos activos
          </p>
        </div>

        {!isReadOnly && (
          <div className="pt-2">
            {error && <p className="text-xs text-destructive mb-2">{error}</p>}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
