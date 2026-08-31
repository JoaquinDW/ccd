"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  /** Sustantivo para el contador ("Mostrando 1–25 de 130 personas"). */
  itemLabel?: string
  itemLabelPlural?: string
}

export default function DataPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  itemLabel = "persona",
  itemLabelPlural,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (targetPage <= 1) params.delete("page")
    else params.set("page", String(targetPage))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  // Page number window (max 5 around current)
  const windowSize = 5
  let start = Math.max(1, page - Math.floor(windowSize / 2))
  const end = Math.min(totalPages, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)
  const pageNumbers: number[] = []
  for (let p = start; p <= end; p++) pageNumbers.push(p)

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)
  const label = totalCount === 1 ? itemLabel : (itemLabelPlural ?? `${itemLabel}s`)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">
        Mostrando {from}–{to} de {totalCount} {label}
      </span>
      <div className="flex items-center gap-1">
        <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1} className="gap-1">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </span>
          )}
        </Button>

        {start > 1 && (
          <>
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link href={hrefFor(1)}>1</Link>
            </Button>
            {start > 2 && <span className="px-1 text-muted-foreground">…</span>}
          </>
        )}

        {pageNumbers.map((p) => (
          <Button
            key={p}
            asChild={p !== page}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
          >
            {p === page ? <span>{p}</span> : <Link href={hrefFor(p)}>{p}</Link>}
          </Button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link href={hrefFor(totalPages)}>{totalPages}</Link>
            </Button>
          </>
        )}

        <Button asChild={page < totalPages} variant="outline" size="sm" disabled={page >= totalPages} className="gap-1">
          {page < totalPages ? (
            <Link href={hrefFor(page + 1)}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
