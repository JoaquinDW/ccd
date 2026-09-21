'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function CerrarConvivenciaButton({ eventoId }: { eventoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const handleCerrar = async () => {
    setConfirmando(false)
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/eventos/${eventoId}/cerrar`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al cerrar la convivencia')
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={() => setConfirmando(true)} disabled={loading} size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
        <Lock className="h-4 w-4" />
        {loading ? 'Cerrando...' : 'Cerrar Convivencia'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        titulo="¿Cerrar la convivencia?"
        descripcion='Pasará a estado "Cerrado" y ya no se podrán editar los datos del cierre.'
        confirmar="Cerrar convivencia"
        tono="destructivo"
        onConfirm={handleCerrar}
      />
    </div>
  )
}
