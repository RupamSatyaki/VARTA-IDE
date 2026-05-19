import React from 'react'
import type { ExtensionData } from './ExtensionItem'

export interface ExtensionDetailsProps {
  ext:     ExtensionData
  onClose: () => void
}

export function ExtensionDetails({ ext, onClose }: ExtensionDetailsProps) {
  return (
    <div className="flex flex-col h-full bg-varta-bg overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-varta-border">
        <h2 className="text-sm font-semibold text-varta-text">{ext.name}</h2>
        <button onClick={onClose} className="text-varta-text-faint hover:text-varta-text">✕</button>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="text-xs text-varta-text-faint">
          <span className="text-varta-text">{ext.publisher}</span>
          {ext.version && <span className="ml-2">v{ext.version}</span>}
        </div>
        <p className="text-sm text-varta-text-muted leading-relaxed">{ext.description}</p>
        <div className="text-xs text-varta-text-faint italic bg-varta-bg-secondary p-3 rounded-lg border border-varta-border">
          More details and documentation available on the marketplace website.
        </div>
      </div>
    </div>
  )
}
