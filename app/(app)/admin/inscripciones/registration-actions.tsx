"use client"

import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface RegistrationActionsProps {
  participanteId: string
  currentStatus: string
}

export function RegistrationActions({ participanteId, currentStatus }: RegistrationActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const supabase = createClient()

  const updateStatus = async (newStatus: string) => {
    setIsLoading(newStatus)

    await supabase
      .from("evento_participantes")
      .update({ estado_inscripcion: newStatus })
      .eq("id", participanteId)

    router.refresh()
    setIsLoading(null)
  }

  if (currentStatus === "confirmado" || currentStatus === "cancelado") {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="gap-2 bg-transparent"
        onClick={() => updateStatus("confirmado")}
        disabled={isLoading !== null}
      >
        {isLoading === "confirmado" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Confirmar
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
        onClick={() => updateStatus("cancelado")}
        disabled={isLoading !== null}
      >
        {isLoading === "cancelado" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        Cancelar
      </Button>
    </div>
  )
}
