export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag, Plus, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/context'

const categoriaLabel: Record<string, string> = {
  convivencia: 'Convivencia',
  retiro: 'Retiro',
  taller: 'Taller',
  otro: 'Otro',
}

const alcanceLabel: Record<string, string> = {
  interno: 'Interno',
  abierto: 'Abierto',
}

export default async function TiposEventosPage() {
  const [ctx, supabase] = await Promise.all([getUserContext(), createClient()])

  const { data: tipos } = await supabase
    .from('tipos_eventos')
    .select('id, nombre, categoria, alcance, requiere_discernimiento_confra, requiere_discernimiento_eqt, requisitos')
    .order('nombre')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Tipos de Eventos</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Catálogo de tipos</CardTitle>
          {ctx && (
            <Button asChild size="sm">
              <Link href="/tipos-eventos/nuevo">
                <Plus className="h-4 w-4 mr-1" />
                Nuevo tipo
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!tipos || tipos.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No hay tipos de eventos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoría</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Alcance</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Req. Confraternidad</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Req. Equipo Timón</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/tipos-eventos/${tipo.id}/editar`} className="hover:underline text-foreground">
                          {tipo.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {categoriaLabel[tipo.categoria] ?? tipo.categoria}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          tipo.alcance === 'abierto'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {alcanceLabel[tipo.alcance] ?? tipo.alcance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tipo.requiere_discernimiento_confra ? (
                          <span className="text-green-600 font-medium">Sí</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tipo.requiere_discernimiento_eqt ? (
                          <span className="text-green-600 font-medium">Sí</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/tipos-eventos/${tipo.id}/editar`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
