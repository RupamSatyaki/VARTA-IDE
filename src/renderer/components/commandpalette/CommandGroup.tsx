import React from 'react'

export interface CommandGroupProps {
  label:    string
  children: React.ReactNode
}

export function CommandGroup({ label, children }: CommandGroupProps) {
  return (
    <div>
      <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] bg-[#252526] sticky top-0">
        {label}
      </div>
      {children}
    </div>
  )
}
