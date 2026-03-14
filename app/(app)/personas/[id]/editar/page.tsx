export const dynamic = 'force-dynamic'

import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserContext, canPerform } from "@/lib/auth/context"
import { EditPersonaForm } from "./_components/edit-persona-form"

export default async function EditPersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getUserContext()
  if (!ctx) redirect('/auth/login')
  if (!canPerform(ctx, 'person.update')) redirect('/personas')

  const { id } = await params
  const supabase = await createClient()

  const [
    { data: persona },
    { data: modoActual },
    { data: historialModos },
    { data: asignacionesActivas },
    { data: historialAsignaciones },
    { data: ministerios },
    { data: organizaciones },
  ] = await Promise.all([
    supabase.from("personas").select("*").eq("id", id).single(),
    supabase
      .from("persona_modos")
      .select("id, modo, fecha_inicio")
      .eq("persona_id", id)
      .is("fecha_fin", null)
      .maybeSingle(),
    supabase
      .from("persona_modos")
      .select("id, modo, fecha_inicio, fecha_fin, motivo_fin")
      .eq("persona_id", id)
      .order("fecha_inicio", { ascending: false }),
    supabase
      .from("asignaciones_ministerio")
      .select("id, fecha_inicio, estado, ministerio:ministerios!ministerio_id(nombre, tipo, nivel), organizacion:organizaciones!organizacion_id(nombre, tipo)")
      .eq("persona_id", id)
      .is("fecha_fin", null),
    supabase
      .from("asignaciones_ministerio")
      .select("id, fecha_inicio, fecha_fin, estado, ministerio:ministerios!ministerio_id(nombre), organizacion:organizaciones!organizacion_id(nombre)")
      .eq("persona_id", id)
      .order("fecha_inicio", { ascending: false }),
    supabase.from("ministerios").select("id, nombre, tipo, nivel").eq("activo", true).order("tipo").order("nombre"),
    supabase.from("organizaciones").select("id, nombre, tipo").is("fecha_baja", null).order("nombre"),
  ])

  if (!persona) notFound()

  return (
    <EditPersonaForm
      persona={persona}
      modoActual={modoActual ?? null}
      historialModos={historialModos ?? []}
      asignacionesActivas={asignacionesActivas ?? []}
      historialAsignaciones={historialAsignaciones ?? []}
      ministerios={ministerios ?? []}
      organizaciones={organizaciones ?? []}
    />
  )
}
