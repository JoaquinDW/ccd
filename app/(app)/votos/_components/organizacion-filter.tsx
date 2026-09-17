"use client"

import { useState } from "react"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"

type OrgOption = { id: string; nombre: string; tipo: string }

interface Props {
  orgs: OrgOption[]
  defaultValue: string
}

export function OrganizacionFilter({ orgs, defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue)

  const options: ComboboxOption[] = orgs.map((o) => ({
    label: `${o.tipo === "confraternidad" ? "Confra" : "Frat"} · ${o.nombre}`,
    value: o.id,
  }))

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">Organización</label>
      <input type="hidden" name="organizacion_id" value={value} />
      <Combobox
        value={value}
        onSelect={setValue}
        options={options}
        placeholder="Todas"
        searchPlaceholder="Buscar organización..."
        emptyText="No se encontraron organizaciones."
        className="h-9 w-64 text-sm"
      />
    </div>
  )
}
