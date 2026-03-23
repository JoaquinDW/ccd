'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  // Permite que PermisosMatrix actualice el nivel mostrado
  if (nivel !== nivelCalculado) {
    setNivel(nivelCalculado)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Datos del Rol en Ministerio</CardTitle>
        <CardDescription>
          {ministerio.tipo === 'sistema'
            ? 'Rol del sistema — nombre y tipo no se pueden modificar'
            : 'Nombre y tipo definidos al crear el rol en ministerio'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={ministerio.nombre} disabled className="text-sm" />
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Input value={tipoLabel[ministerio.tipo] ?? ministerio.tipo} disabled className="text-sm" />
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
      </CardContent>
    </Card>
  )
}
