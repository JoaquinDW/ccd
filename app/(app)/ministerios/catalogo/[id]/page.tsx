export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, ArrowLeft, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { MinisterioDetailClient } from './_components/ministerio-detail-client'

export default async function MinisterioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getUserContext()
  if (!ctx) redirect('/auth/login')
  if (!canPerform(ctx, 'roles.assign')) redirect('/dashboard')

  const supabase = await createClient()

  const [
    { data: ministerio },
    { data: todosPermisos },
    { data: minPermisos },
    { count: numAsignados },
  ] = await Promise.all([
    supabase.from('ministerios').select('*').eq('id', id).single(),
    supabase
      .from('permisos')
      .select('id, clave, nombre, descripcion, categoria')
      .eq('activo', true)
      .order('categoria')
      .order('nombre'),
    supabase
      .from('ministerio_permisos')
      .select('permiso_id')
      .eq('ministerio_id', id)
      .eq('activo', true),
    supabase
      .from('asignaciones_ministerio')
      .select('*', { count: 'exact', head: true })
      .eq('ministerio_id', id)
      .eq('estado', 'activo'),
  ])

  if (!ministerio) notFound()

  const permisosActivosIds = (minPermisos ?? []).map((mp: any) => mp.permiso_id)
  const totalPermisos = (todosPermisos ?? []).length

  const permisosPorCategoria: Record<string, any[]> = {}
  for (const p of todosPermisos ?? []) {
    if (!permisosPorCategoria[p.categoria]) permisosPorCategoria[p.categoria] = []
    permisosPorCategoria[p.categoria].push(p)
  }

  const categoriaLabel: Record<string, string> = {
    personas: 'Personas',
    organizaciones: 'Organizaciones',
    eventos: 'Eventos',
    roles: 'Ministerios y Roles',
    sistema: 'Sistema',
  }

  const tipoLabel: Record<string, string> = {
    conduccion: 'Conducción',
    pastoral: 'Pastoral',
    servicio: 'Servicio',
    sistema: 'Sistema',
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/ministerios/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al Catálogo
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          {ministerio.nombre}
        </h1>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span>Tipo: <strong className="text-foreground">{tipoLabel[ministerio.tipo] ?? ministerio.tipo}</strong></span>
          <span>Nivel: <strong className="text-foreground capitalize">{ministerio.nivel}</strong></span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {numAsignados ?? 0} asignación{numAsignados !== 1 ? 'es' : ''} activa{numAsignados !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <MinisterioDetailClient
        ministerio={ministerio}
        permisosPorCategoria={permisosPorCategoria}
        categoriaLabel={categoriaLabel}
        permisosActivosIds={permisosActivosIds}
        totalPermisos={totalPermisos}
      />
    </div>
  )
}
