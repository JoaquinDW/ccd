import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const tipo = searchParams.get('tipo') ?? ''
  const estado = searchParams.get('estado') ?? ''
  const provincia = searchParams.get('provincia') ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('organizaciones')
    .select('nombre, tipo, localidad, provincia, estado, fecha_creacion, telefono_1, telefono_2, parent:organizaciones!parent_id(nombre)')
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
    'Depende de': org.parent?.nombre ?? '',
    Localidad: org.localidad ?? '',
    Provincia: org.provincia ?? '',
    Estado: org.estado,
    'Fecha creación': org.fecha_creacion ?? '',
    Teléfono: org.telefono_1 ?? '',
    'Teléfono 2': org.telefono_2 ?? '',
  }))

  return NextResponse.json(rows)
}
