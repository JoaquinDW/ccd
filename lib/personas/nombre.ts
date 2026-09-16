type PersonaNombre = {
  nombre: string
  apellido: string
  apodo?: string | null
}

/** "Apellido, Nombre (Apodo)" — usado en tablas, listados y comboboxes. */
export function apellidoNombreConApodo(p: PersonaNombre): string {
  const apodo = p.apodo ? ` (${p.apodo})` : ""
  return `${p.apellido}, ${p.nombre}${apodo}`
}

/** "Nombre Apellido (Apodo)" — usado en prosa, títulos y encabezados. */
export function nombreCompletoConApodo(p: PersonaNombre): string {
  const apodo = p.apodo ? ` (${p.apodo})` : ""
  return `${p.nombre} ${p.apellido}${apodo}`
}
