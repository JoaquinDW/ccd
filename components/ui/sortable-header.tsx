'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  column: string
  label: string
  currentSort: string
  currentDir: 'asc' | 'desc' | ''
  className?: string
}

export default function SortableHeader({ column, label, currentSort, currentDir, className }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const isActive = currentSort === column

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString())

    if (!isActive) {
      params.set('sortBy', column)
      params.set('sortDir', 'asc')
    } else if (currentDir === 'asc') {
      params.set('sortDir', 'desc')
    } else {
      params.delete('sortBy')
      params.delete('sortDir')
    }

    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const Icon = isActive ? (currentDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th className={cn('text-left py-3 px-4 font-semibold text-foreground', className)}>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/50')} />
      </button>
    </th>
  )
}
