import React from 'react'

export function DebugVariables() {
  return (
    <div className="border-b border-[#333333]">
      <div className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e]">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="rotate-90"><path d="M2 1l4 3-4 3V1z"/></svg>
        Variables
      </div>
      <div className="px-4 py-2 text-xs text-[#4e4e4e] italic">
        LOCAL — (no active session)
      </div>
    </div>
  )
}
