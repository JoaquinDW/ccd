"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, Edit2, Eye, Link2, Loader2, Printer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import PersonaDetailModal from "./persona-detail-modal"
import ExportButton from "./export-button"

type Persona = {
  id: string
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  localidad: string | null
  estado: string | null
  estado_eclesial: string | null
}

type Props = {
  personas: Persona[]
  canCreate: boolean
  canUpdate: boolean
  exportSearch: string
  initialPersonaId: string | null
}

export default function PersonasTable({
  personas,
  canCreate,
  canUpdate,
  exportSearch,
  initialPersonaId,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(initialPersonaId)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const pathname = usePathname()
  const selected = selectedId ? personas.find((p) => p.id === selectedId) : null
  const printRef = useRef<HTMLDivElement>(null)

  function handleOpen(id: string) {
    setSelectedId(id)
    const params = new URLSearchParams(window.location.search)
    params.set("persona", id)
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`)
  }

  function handleClose() {
    setSelectedId(null)
    const params = new URLSearchParams(window.location.search)
    params.delete("persona")
    const search = params.toString()
    window.history.replaceState(
      null,
      "",
      search ? `${pathname}?${search}` : pathname,
    )
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleExportPdf() {
    if (!printRef.current || !selected) return
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ])

      const element = printRef.current
      // Temporarily remove max-height/overflow so html2canvas captures full content
      const dialogContent = element.closest(
        '[data-slot="dialog-content"]',
      ) as HTMLElement | null
      const prevMaxHeight = dialogContent?.style.maxHeight ?? ""
      const prevOverflow = dialogContent?.style.overflow ?? ""
      if (dialogContent) {
        dialogContent.style.maxHeight = "none"
        dialogContent.style.overflow = "visible"
      }

      // Hide action buttons during capture
      element.classList.add("is-exporting")

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      if (dialogContent) {
        dialogContent.style.maxHeight = prevMaxHeight
        dialogContent.style.overflow = prevOverflow
      }

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * contentWidth) / canvas.width

      let yOffset = margin
      let remainingHeight = imgHeight

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - margin * 2)
        const sourceY =
          (imgHeight - remainingHeight) * (canvas.height / imgHeight)
        const sourceHeight = sliceHeight * (canvas.height / imgHeight)

        const sliceCanvas = document.createElement("canvas")
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sourceHeight
        const ctx = sliceCanvas.getContext("2d")!
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight,
        )

        if (yOffset > margin) {
          pdf.addPage()
          yOffset = margin
        }

        pdf.addImage(
          sliceCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          yOffset,
          contentWidth,
          sliceHeight,
        )
        remainingHeight -= sliceHeight
      }

      const blob = pdf.output("blob")
      const url = URL.createObjectURL(blob)
      const win = window.open(url, "_blank")
      // Revoke the object URL after the window has loaded to free memory
      if (win) {
        win.addEventListener("load", () => URL.revokeObjectURL(url), { once: true })
      }
    } finally {
      printRef.current?.classList.remove("is-exporting")
      setExporting(false)
    }
  }

  return (
    <>
      {personas.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {personas.length} persona{personas.length !== 1 ? "s" : ""}
            </span>
            <ExportButton searchString={exportSearch} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Teléfono
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Localidad
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Estado ecl.
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Estado
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {personas.map((persona) => (
                  <tr
                    key={persona.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      {persona.apellido}, {persona.nombre}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {persona.email ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {persona.telefono ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {persona.localidad ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">
                      {persona.estado_eclesial ?? "laico"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          persona.estado === "activo"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {persona.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpen(persona.id)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canUpdate && (
                          <Link href={`/personas/${persona.id}/editar`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) handleClose()
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <div ref={printRef}>
            {selected && (
              <DialogHeader>
                <div className="flex items-start justify-between gap-4 pr-8">
                  {/* pr-8 avoids overlap with the shadcn X close button at absolute top-4 right-4 */}
                  <div className="flex flex-col gap-1.5">
                    <DialogTitle>
                      {selected.apellido}, {selected.nombre}
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            selected.estado === "activo"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {selected.estado}
                        </span>
                      </div>
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" data-export-hide>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copiado" : "Copiar enlace"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs"
                      onClick={handleExportPdf}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                      {exporting ? "Generando..." : "Exportar PDF"}
                    </Button>
                  </div>
                </div>
              </DialogHeader>
            )}
            {selectedId && <PersonaDetailModal personaId={selectedId} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
