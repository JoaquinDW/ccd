"use client"

import { useState } from "react"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"

type OrgOption = { id: string; nombre: string }

interface Props {
  confraList: OrgOption[]
  fratList: OrgOption[]
  provinciaList: string[]
  ciudadList: string[]
  defaultOrganizacionId: string
  defaultFraternidadId: string
  defaultProvincia: string
  defaultCiudad: string
  className: string
}

export function CentralizadorComboboxFilters({
  confraList,
  fratList,
  provinciaList,
  ciudadList,
  defaultOrganizacionId,
  defaultFraternidadId,
  defaultProvincia,
  defaultCiudad,
  className,
}: Props) {
  const [organizacionId, setOrganizacionId] = useState(defaultOrganizacionId)
  const [fraternidadId, setFraternidadId] = useState(defaultFraternidadId)
  const [provincia, setProvincia] = useState(defaultProvincia)
  const [ciudad, setCiudad] = useState(defaultCiudad)

  const confraOptions: ComboboxOption[] = confraList.map((c) => ({ label: c.nombre, value: c.id }))
  const fratOptions: ComboboxOption[] = fratList.map((f) => ({ label: f.nombre, value: f.id }))
  const provinciaOptions: ComboboxOption[] = provinciaList.map((p) => ({ label: p, value: p }))
  const ciudadOptions: ComboboxOption[] = ciudadList.map((c) => ({ label: c, value: c }))

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Confraternidad</label>
        <input type="hidden" name="organizacion_id" value={organizacionId} />
        <Combobox
          value={organizacionId}
          onSelect={setOrganizacionId}
          options={confraOptions}
          placeholder="Todas"
          searchPlaceholder="Buscar confraternidad..."
          emptyText="No se encontraron confraternidades."
          className={className}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Fraternidad</label>
        <input type="hidden" name="fraternidad_id" value={fraternidadId} />
        <Combobox
          value={fraternidadId}
          onSelect={setFraternidadId}
          options={fratOptions}
          placeholder="Todas"
          searchPlaceholder="Buscar fraternidad..."
          emptyText="No se encontraron fraternidades."
          className={className}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Provincia</label>
        <input type="hidden" name="provincia" value={provincia} />
        <Combobox
          value={provincia}
          onSelect={setProvincia}
          options={provinciaOptions}
          placeholder="Todas"
          searchPlaceholder="Buscar provincia..."
          emptyText="No se encontraron provincias."
          className={className}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Ciudad</label>
        <input type="hidden" name="ciudad" value={ciudad} />
        <Combobox
          value={ciudad}
          onSelect={setCiudad}
          options={ciudadOptions}
          placeholder="Todas"
          searchPlaceholder="Buscar ciudad..."
          emptyText="No se encontraron ciudades."
          className={className}
        />
      </div>
    </>
  )
}
