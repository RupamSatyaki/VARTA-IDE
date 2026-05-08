import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { useSearchStore } from '../../store/searchStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faFilter } from '@fortawesome/free-solid-svg-icons'

export function SearchFilters() {
  const [open, setOpen] = useState(false)
  const { query, setQuery } = useSearchStore()

  return (
    <div className="border-b border-[#2a1f30]">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-[#6e5a7a] hover:text-[#cccccc] transition-colors"
      >
        <FontAwesomeIcon
          icon={faChevronRight}
          style={{ fontSize: 8 }}
          className={cn('transition-transform duration-150', open ? 'rotate-90' : '')}
        />
        <FontAwesomeIcon icon={faFilter} style={{ fontSize: 9 }} />
        <span>Filters</span>
        {(query.includePattern || query.excludePattern) && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <FilterField
            label="Include"
            placeholder="**/*.ts, src/**"
            value={query.includePattern ?? ''}
            onChange={(v) => setQuery({ includePattern: v })}
          />
          <FilterField
            label="Exclude"
            placeholder="node_modules, dist"
            value={query.excludePattern ?? ''}
            onChange={(v) => setQuery({ excludePattern: v })}
          />
        </div>
      )}
    </div>
  )
}

function FilterField({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-[10px] text-[#5a4a6a] block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-6 px-2 text-[11px] rounded-md
          bg-[#1e1a24] border border-[#3a2f45] focus:border-[#7c3aed]
          text-[#cccccc] placeholder:text-[#4a3a5a] outline-none transition-colors"
      />
    </div>
  )
}
