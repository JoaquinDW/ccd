'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type PersonaDetalle = {
  id: string
  nombre: string
  apellido: string
  email: string | null
  email_ccd: string | null
  telefono: string | null
  tipo_documento: string | null
  documento: number | null
  fecha_nacimiento: string | null
  direccion: string | null
  direccion_nro: string | null
  localidad: string | null
  codigo_postal: string | null
  provincia: string | null
  pais: string | null
  notas: string | null
  estado: string | null
  created_at: string | null
  acepta_comunicaciones: boolean | null
  estado_eclesial: string | null
  estado_vida: string | null
  diocesis: string | null
  categoria_persona: string | null
  parroquia: string | null
  socio_asociacion: boolean | null
  referente_comunidad: boolean | null
  cecista_dedicado: boolean | null
  intercesor_dies_natalis: string | null
}

type PersonaModo = {
  modo: string
  fecha_inicio: string
  fecha_fin: string | null
  estado: string | null
  motivo_fin: string | null
}

type AsignacionMinisterio = {
  fecha_inicio: string
  fecha_fin: string | null
  estado: string | null
  ministerio: { nombre: string } | null
  organizacion: { nombre: string } | null
}

type CategoriaNoCecista = { categoria: string }

type PersonaOrg = {
  tipo_relacion: string
  organizacion: { nombre: string } | null
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">{children}</h3>
}

const estadoVidaLabel: Record<string, string> = {
  soltero: 'Soltero/a',
  casado: 'Casado/a',
  viudo: 'Viudo/a',
  separado: 'Separado/a',
  consagrado: 'Consagrado/a',
}

const categoriaNoCecistaLabel: Record<string, string> = {
  voluntario: 'Voluntario',
  convivente: 'Convivente',
  cooperador: 'Cooperador',
  contacto_casa_retiro: 'Contacto Casa Retiro',
}

export default function PersonaDetailModal({ personaId }: { personaId: string }) {
  const [persona, setPersona] = useState<PersonaDetalle | null>(null)
  const [modos, setModos] = useState<PersonaModo[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionMinisterio[]>([])
  const [categoriasNoCecista, setCategoriasNoCecista] = useState<CategoriaNoCecista[]>([])
  const [personaOrgs, setPersonaOrgs] = useState<PersonaOrg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    setLoading(true)

    Promise.all([
      supabase
        .from('personas')
        .select('id, nombre, apellido, email, email_ccd, telefono, tipo_documento, documento, fecha_nacimiento, direccion, direccion_nro, localidad, codigo_postal, provincia, pais, notas, estado, created_at, acepta_comunicaciones, estado_eclesial, estado_vida, diocesis, categoria_persona, parroquia, socio_asociacion, referente_comunidad, cecista_dedicado, intercesor_dies_natalis')
        .eq('id', personaId)
        .single(),
      supabase
        .from('persona_modos')
        .select('modo, fecha_inicio, fecha_fin, estado, motivo_fin')
        .eq('persona_id', personaId)
        .order('fecha_inicio', { ascending: false }),
      supabase
        .from('asignaciones_ministerio')
        .select('fecha_inicio, fecha_fin, estado, ministerio:ministerios(nombre), organizacion:organizaciones(nombre)')
        .eq('persona_id', personaId)
        .order('fecha_inicio', { ascending: false }),
      supabase
        .from('persona_categoria_no_cecista')
        .select('categoria')
        .eq('persona_id', personaId),
      supabase
        .from('persona_organizacion')
        .select('tipo_relacion, organizacion:organizaciones!organizacion_id(nombre)')
        .eq('persona_id', personaId)
        .is('fecha_fin', null),
    ]).then(([personaRes, modosRes, asignacionesRes, catsRes, orgsRes]) => {
      if (personaRes.data) setPersona(personaRes.data)
      if (modosRes.data) setModos(modosRes.data)
      if (asignacionesRes.data) setAsignaciones(asignacionesRes.data as AsignacionMinisterio[])
      if (catsRes.data) setCategoriasNoCecista(catsRes.data)
      if (orgsRes.data) setPersonaOrgs(orgsRes.data as PersonaOrg[])
      setLoading(false)
    })
  }, [personaId])

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (!persona) {
    return <p className="py-4 text-muted-foreground text-sm">No se encontraron datos.</p>
  }

  const confraternidad = personaOrgs.find(o => o.tipo_relacion === 'confraternidad')?.organizacion?.nombre
  const fraternidad = personaOrgs.find(o => o.tipo_relacion === 'fraternidad')?.organizacion?.nombre

  return (
    <div className="space-y-6 pt-2">
      {/* Datos Personales */}
      <div>
        <SectionTitle>Datos Personales</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd className="text-foreground">{persona.telefono ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fecha de nacimiento</dt>
            <dd className="text-foreground">{formatDate(persona.fecha_nacimiento)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mail Personal</dt>
            <dd className="text-foreground">{persona.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mail CcD</dt>
            <dd className="text-foreground">{persona.email_ccd ?? '—'}</dd>
          </div>
          {persona.tipo_documento && (
            <div>
              <dt className="text-muted-foreground">Documento</dt>
              <dd className="text-foreground">{persona.tipo_documento.toUpperCase()} {persona.documento ?? ''}</dd>
            </div>
          )}
          {(persona.direccion || persona.direccion_nro) && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Dirección</dt>
              <dd className="text-foreground">
                {[persona.direccion, persona.direccion_nro].filter(Boolean).join(' ')}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Ciudad</dt>
            <dd className="text-foreground">{persona.localidad ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">CP</dt>
            <dd className="text-foreground">{persona.codigo_postal ?? '—'}</dd>
          </div>
          {persona.diocesis && (
            <div>
              <dt className="text-muted-foreground">Diócesis</dt>
              <dd className="text-foreground">{persona.diocesis}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Provincia</dt>
            <dd className="text-foreground">{persona.provincia ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">País</dt>
            <dd className="text-foreground">{persona.pais ?? '—'}</dd>
          </div>
          {persona.estado_eclesial && (
            <div>
              <dt className="text-muted-foreground">Estado eclesiástico</dt>
              <dd className="text-foreground capitalize">{persona.estado_eclesial}</dd>
            </div>
          )}
          {persona.parroquia && (
            <div>
              <dt className="text-muted-foreground">Parroquia</dt>
              <dd className="text-foreground">{persona.parroquia}</dd>
            </div>
          )}
          {persona.estado_vida && (
            <div>
              <dt className="text-muted-foreground">Estado de vida</dt>
              <dd className="text-foreground">{estadoVidaLabel[persona.estado_vida] ?? persona.estado_vida}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Fecha de registro</dt>
            <dd className="text-foreground">{formatDate(persona.created_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Comunicaciones</dt>
            <dd className="text-foreground">{persona.acepta_comunicaciones ? 'Acepta' : 'No acepta'}</dd>
          </div>
          {persona.notas && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Notas</dt>
              <dd className="text-foreground whitespace-pre-wrap">{persona.notas}</dd>
            </div>
          )}
        </dl>
      </div>

      <hr className="border-border" />

      {/* Relación con CcD */}
      <div>
        <SectionTitle>Relación con CcD</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {persona.categoria_persona && (
            <div>
              <dt className="text-muted-foreground">Categoría</dt>
              <dd className="text-foreground capitalize">
                {persona.categoria_persona === 'no_cecista' ? 'No Cecista' : 'Cecista'}
              </dd>
            </div>
          )}
          {(persona.socio_asociacion || persona.referente_comunidad || persona.cecista_dedicado) && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Características</dt>
              <dd className="text-foreground flex gap-2 flex-wrap mt-1">
                {persona.referente_comunidad && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Referente de Comunidad</span>}
                {persona.socio_asociacion && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Socio Activo</span>}
                {persona.cecista_dedicado && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Dedicado</span>}
              </dd>
            </div>
          )}
          {persona.categoria_persona === 'no_cecista' && categoriasNoCecista.length > 0 && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Si es No Cecista</dt>
              <dd className="text-foreground flex gap-2 flex-wrap mt-1">
                {categoriasNoCecista.map(c => (
                  <span key={c.categoria} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {categoriaNoCecistaLabel[c.categoria] ?? c.categoria}
                  </span>
                ))}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Confraternidad</dt>
            <dd className="text-foreground">{confraternidad ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fraternidad</dt>
            <dd className="text-foreground">{fraternidad ?? '—'}</dd>
          </div>
          {persona.intercesor_dies_natalis && (
            <div>
              <dt className="text-muted-foreground">Intercesor Dies Natalis</dt>
              <dd className="text-foreground">{formatDate(persona.intercesor_dies_natalis)}</dd>
            </div>
          )}
        </dl>
      </div>

      <hr className="border-border" />

      {/* Historial de Modos */}
      <div>
        <SectionTitle>Modo de Participación</SectionTitle>
        {modos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin historial de modos registrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Modo</th>
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Desde</th>
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Hasta</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {modos.map((m, i) => (
                <tr key={i} className={`border-b border-border/50 ${!m.fecha_fin ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                  <td className="py-2 pr-4 text-foreground capitalize">{m.modo}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{formatDate(m.fecha_inicio)}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{m.fecha_fin ? formatDate(m.fecha_fin) : <span className="text-green-700 dark:text-green-400 font-medium">actual</span>}</td>
                  <td className="py-2 text-muted-foreground capitalize">{m.estado ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <hr className="border-border" />

      {/* Asignaciones de Ministerio */}
      <div>
        <SectionTitle>Asignaciones de Ministerio</SectionTitle>
        {asignaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin asignaciones de ministerio registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Ministerio</th>
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Organización</th>
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Desde</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Hasta</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((a, i) => (
                <tr key={i} className={`border-b border-border/50 ${!a.fecha_fin ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                  <td className="py-2 pr-4 text-foreground">{a.ministerio?.nombre ?? '—'}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{a.organizacion?.nombre ?? '—'}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{formatDate(a.fecha_inicio)}</td>
                  <td className="py-2 text-muted-foreground">{a.fecha_fin ? formatDate(a.fecha_fin) : <span className="text-green-700 dark:text-green-400 font-medium">actual</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
