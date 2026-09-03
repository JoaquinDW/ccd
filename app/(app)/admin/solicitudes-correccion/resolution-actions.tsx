"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface ResolutionActionsProps {
  solicitudId: string
  currentStatus: string
}

export function ResolutionActions({ solicitudId, currentStatus }: ResolutionActionsProps) {
  const router = useRouter()
  const [respondiendo, setRespondiendo] = useState(false)
  const [respuesta, setRespuesta] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  if (currentStatus === "resuelta") return null

  const resolver = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from("solicitudes_correccion")
      .update({
        estado: "resuelta",
        fecha_resolucion: new Date().toISOString(),
        resuelto_por: user?.id,
        respuesta: respuesta.trim() || null,
      })
      .eq("id", solicitudId)

    router.refresh()
    setIsLoading(false)
    setRespondiendo(false)
  }

  if (respondiendo) {
    return (
      <div className="flex flex-col gap-2 w-64">
        <Textarea
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="Nota para el cecista (opcional)"
          className="text-xs"
          rows={3}
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 text-xs flex-1" onClick={resolver} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Confirmar
          </Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setRespondiendo(false)} disabled={isLoading}>
            Atrás
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-2 bg-transparent"
      onClick={() => setRespondiendo(true)}
    >
      <Check className="h-4 w-4" />
      Marcar resuelta
    </Button>
  )
}
