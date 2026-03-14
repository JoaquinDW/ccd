export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Hotel, ArrowLeft, Edit2, MapPin, Phone, Mail, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

const AMENITY_LABELS: Record<string, string> = {
  estacionamiento: 'Estacionamiento',
  rampa_discapacitados: 'Rampa para discapacitados',
  capilla: 'Capilla',
  comedor_amplio: 'Comedor amplio',
  salon: 'Salón',
  banos_en_habit: 'Baños en habitación',
}

export default async function CasaRetiroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const ctx = await getUserContext()
  const canEdit = ctx ? canPerform(ctx, 'organization.update') : false

  const [{ data: casa, error }, { data: orgsRelacionadas }] = await Promise.all([
    supabase
      .from('casas_retiro')
      .select('*, contacto:personas!contacto_persona_id(id, nombre, apellido)')
      .eq('id', id)
      .single(),
    supabase
      .from('casa_retiro_organizaciones')
      .select('organizacion:organizaciones!organizacion_id(id, nombre, tipo)')
      .eq('casa_retiro_id', id),
  ])

  if (error || !casa) notFound()

  const tipoPropiedadLabel: Record<string, string> = {
    propia: 'Propia',
    terceros: 'De terceros',
  }

  const amenityEntries = Object.entries(AMENITY_LABELS)
  const activeAmenities = amenityEntries.filter(([key]) => casa[key] === true)
  const inactiveAmenities = amenityEntries.filter(([key]) => casa[key] !== true)

  const contacto = casa.contacto as { id: string; nombre: string; apellido: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/casas-retiro" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Volver a Casas de Retiro
        </Link>
        {canEdit && (
          <Link href={`/casas-retiro/${id}/editar`}>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <Hotel className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{casa.nombre}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-muted-foreground">{tipoPropiedadLabel[casa.tipo_propiedad] ?? casa.tipo_propiedad}</span>
            {casa.codigo_interno && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground font-mono text-sm">{casa.codigo_interno}</span>
              </>
            )}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              casa.estado === 'activa'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {casa.estado}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información General */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {contacto && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Contacto: </span>
                  <Link href={`/personas/${contacto.id}`} className="text-foreground hover:text-primary">
                    {contacto.apellido}, {contacto.nombre}
                  </Link>
                </div>
              </div>
            )}
            {casa.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{casa.telefono}</span>
              </div>
            )}
            {casa.mail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${casa.mail}`} className="text-foreground hover:text-primary">{casa.mail}</a>
              </div>
            )}
            {(casa.direccion_calle || casa.ciudad || casa.provincia) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-foreground">
                  {casa.direccion_calle && (
                    <div>{casa.direccion_calle}{casa.direccion_nro ? ` ${casa.direccion_nro}` : ''}</div>
                  )}
                  <div className="text-muted-foreground">
                    {[casa.ciudad, casa.cp, casa.provincia, casa.pais].filter(Boolean).join(', ')}
                  </div>
                  {casa.diocesis && <div className="text-muted-foreground">Diócesis: {casa.diocesis}</div>}
                </div>
              </div>
            )}
            {casa.aforo && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Aforo:</span>
                <span className="font-medium text-foreground">{casa.aforo} personas</span>
              </div>
            )}
            {casa.notas && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground text-xs mb-1">Notas</p>
                <p className="text-foreground">{casa.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habitaciones */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Habitaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-foreground">{casa.cant_hab_x2 ?? 0}</div>
                <div className="text-muted-foreground">Dobles</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-foreground">{casa.cant_hab_x3 ?? 0}</div>
                <div className="text-muted-foreground">Triples</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-foreground">{casa.cant_hab_x4 ?? 0}</div>
                <div className="text-muted-foreground">Cuádruples</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-foreground">{casa.cant_banos ?? 0}</div>
                <div className="text-muted-foreground">Baños</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servicios */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {activeAmenities.map(([key, label]) => (
              <span key={key} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {label}
              </span>
            ))}
            {inactiveAmenities.map(([key, label]) => (
              <span key={key} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium bg-muted text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Organizaciones cercanas */}
      {orgsRelacionadas && orgsRelacionadas.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Organizaciones Cercanas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orgsRelacionadas.map((rel: any) => (
                <div key={rel.organizacion.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <Link href={`/organizaciones/${rel.organizacion.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                    {rel.organizacion.nombre}
                  </Link>
                  <span className="text-xs text-muted-foreground">{rel.organizacion.tipo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
