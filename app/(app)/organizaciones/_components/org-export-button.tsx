'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  searchString: string
}

export default function OrgExportButton({ searchString }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/organizaciones/export${searchString}`)
      if (!res.ok) throw new Error('Error al exportar')
      const data: Record<string, unknown>[] = await res.json()

      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Organizaciones')
      XLSX.writeFile(wb, 'organizaciones_export.xlsx')
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
