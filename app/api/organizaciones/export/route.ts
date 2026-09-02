import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function GET(req: NextRequest) {
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!canPerform(ctx, 'organizaciones.export')) {
    return NextResponse.json({ error: 'Sin permiso para exportar organizaciones' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const tipo = searchParams.get('tipo') ?? ''
  const estado = searchParams.get('estado') ?? ''
  const provincia = searchParams.get('provincia') ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('organizaciones')
    .select('nombre, tipo, localidad, provincia, estado, fecha_creacion, telefono_1, telefono_2, parent_id')
    .is('fecha_baja', null)
    .order('nombre', { ascending: true })

  if (q) query = query.ilike('nombre', `%${q}%`)
  if (tipo) query = query.eq('tipo', tipo)
  if (estado) query = query.eq('estado', estado)
  if (provincia) query = query.ilike('provincia', `%${provincia}%`)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Nota: no se usa el embed `organizaciones!parent_id(...)` porque, al ser
  // organizaciones auto-referenciada, PostgREST resuelve el hint de forma
  // ambigua y trae la relación inversa (hijos) en vez del padre.
  const parentIds = [...new Set((data ?? []).map((o: any) => o.parent_id).filter(Boolean))]
  const parentNames: Record<string, string> = {}
  if (parentIds.length > 0) {
    const { data: parents } = await supabase.from('organizaciones').select('id, nombre').in('id', parentIds)
    for (const p of parents ?? []) parentNames[p.id] = p.nombre
  }

  const tipoLabel: Record<string, string> = {
    comunidad: 'Comunidad',
    confraternidad: 'Confraternidad',
    fraternidad: 'Fraternidad',
    casa_retiro: 'Casa de Retiro',
    eqt: 'EQT',
    otra: 'Otra',
  }

  const rows = (data ?? []).map((org: any) => ({
    Nombre: org.nombre,
    Tipo: tipoLabel[org.tipo] ?? org.tipo,
    'Depende de': (org.parent_id && parentNames[org.parent_id]) ?? '',
    Localidad: org.localidad ?? '',
    Provincia: org.provincia ?? '',
    Estado: org.estado,
    'Fecha creación': org.fecha_creacion ?? '',
    Teléfono: org.telefono_1 ?? '',
    'Teléfono 2': org.telefono_2 ?? '',
  }))

  return NextResponse.json(rows)
}
