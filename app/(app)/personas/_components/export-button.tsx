'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  searchString: string  // e.g. "?q=foo&estado=activo"
}

export default function ExportButton({ searchString }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/personas/export${searchString}`)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Error al exportar (${res.status}): ${body}`)
      }
      const data: Record<string, unknown>[] = await res.json()

      // Dynamic import to keep xlsx out of the initial bundle
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Personas')
      XLSX.writeFile(wb, 'personas_export.xlsx')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={loading}
    >
      <Download className="h-4 w-4" />
      {loading ? 'Exportando...' : 'Exportar Excel'}
    </Button>
  )
}
