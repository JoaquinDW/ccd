import { redirect } from 'next/navigation'
import { getUserContext, canPerform } from '@/lib/auth/context'

// Módulo fuera de la vista ordinaria: todo /casas-retiro (listado, detalle y
// alta) requiere el permiso view.casas_retiro. Ver scripts/071.
export default async function CasasRetiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getUserContext()
  if (!ctx || !canPerform(ctx, 'view.casas_retiro')) redirect('/dashboard')

  return <>{children}</>
}
