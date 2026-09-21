'use client'

import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

/**
 * Diálogo de confirmación único de la plataforma. Reemplaza a `confirm()` del
 * navegador, que mostraba el "localhost:3000 dice" y no respeta el tema.
 * Toda acción que pida confirmación debería usar este componente.
 */

type Tono = 'normal' | 'destructivo' | 'advertencia'

const TONO_CLASSES: Record<Tono, string> = {
  normal: '',
  destructivo: 'bg-destructive text-white hover:bg-destructive/90',
  advertencia: 'bg-amber-600 text-white hover:bg-amber-700',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descripcion?: ReactNode
  /** Texto del botón que confirma. Por defecto "Confirmar". */
  confirmar?: string
  /** `destructivo` para lo irreversible, `advertencia` para lo que se puede deshacer. */
  tono?: Tono
  onConfirm: () => void
  /** Contenido extra entre la descripción y los botones (ej.: el motivo escrito). */
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  confirmar = 'Confirmar',
  tono = 'normal',
  onConfirm,
  children,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          {descripcion && <AlertDialogDescription>{descripcion}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={cn(TONO_CLASSES[tono])}>
            {confirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
