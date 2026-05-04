import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { Input } from '../ui/Input'
import { useSearchStore } from '../../store/searchStore'

export function SearchFilters() {
  const [open, setOpen] = useState(false)
  const { query, setQuery } = useSearchStore()

  return (
    <div className="border-b border-[#333333]">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 w-full px-3 py-1 text-[10px] text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors"
      >
        <svg
          width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
          className={cn('transition-transform', open ? 'rotate-90' : '')}
        >
          <path d="M2 1l4 3-4 3V1z"/>
        </svg>
        <span>Search Filters</span>
      </button>

      {open && (
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <div>
            <label className="text-[10px] text-[#6e6e6e] block mb-0.5">Files to include</label>
            <Input
              value={query.includePattern ?? ''}
              onChange={(e) => setQuery({ includePattern: e.target.value })}
              placeholder="e.g. **/*.ts, src/**"
              className="text-xs h-6"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#6e6e6e] block mb-0.5">Files to exclude</label>
            <Input
              value={query.excludePattern ?? ''}
              onChange={(e) => setQuery({ excludePattern: e.target.value })}
              placeholder="e.g. node_modules, dist"
              className="text-xs h-6"
            />
          </div>
        </div>
      )}
    </div>
  )
}
