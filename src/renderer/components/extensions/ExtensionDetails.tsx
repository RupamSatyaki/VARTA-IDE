import React from 'react'
import type { ExtensionData } from './ExtensionItem'

export interface ExtensionDetailsProps {
  ext:     ExtensionData
  onClose: () => void
}

export function ExtensionDetails({ ext, onClose }: ExtensionDetailsProps) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333]">
        <h2 className="text-sm font-semibold text-[#d4d4d4]">{ext.name}</h2>
        <button onClick={onClose} className="text-[#6e6e6e] hover:text-[#d4d4d4]">✕</button>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="text-xs text-[#6e6e6e]">
          <span className="text-[#d4d4d4]">{ext.publisher}</span>
          {ext.version && <span className="ml-2">v{ext.version}</span>}
        </div>
        <p className="text-sm text-[#d4d4d4]">{ext.description}</p>
        <div className="text-xs text-[#6e6e6e] italic">
          More details and documentation available on the marketplace website.
        </div>
      </div>
    </div>
  )
}
