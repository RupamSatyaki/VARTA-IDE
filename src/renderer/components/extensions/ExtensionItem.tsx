import React from 'react'
import { cn } from '../../utils/cn'
import { Toggle } from '../ui/Toggle'
import { useNotificationStore } from '../../store/notificationStore'

export interface ExtensionData {
  id:          string
  name:        string
  publisher:   string
  description: string
  version?:    string
  installed:   boolean
  enabled?:    boolean
}

export interface ExtensionItemProps {
  ext:       ExtensionData
  onToggle?: (id: string, enabled: boolean) => void
  onInstall?:(id: string) => void
  onUninstall?:(id: string) => void
}

// Generate a consistent color from extension name
function nameToColor(name: string): string {
  const colors = ['#569cd6', '#4ec9b0', '#ce9178', '#dcdcaa', '#c586c0', '#f44747', '#ff8c00']
  let hash = 0
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash) }
  return colors[Math.abs(hash) % colors.length]
}

export function ExtensionItem({ ext, onToggle, onInstall, onUninstall }: ExtensionItemProps) {
  const { info } = useNotificationStore()
  const color = nameToColor(ext.name)

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 border-b border-[#2d2d2d] hover:bg-[#2a2d2e] transition-colors group">
      {/* Icon */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ backgroundColor: color + '33', border: `1px solid ${color}44` }}
      >
        <span style={{ color }}>{ext.name[0].toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[#d4d4d4] truncate">{ext.name}</span>
          {ext.version && (
            <span className="text-[10px] text-[#6e6e6e] shrink-0">v{ext.version}</span>
          )}
        </div>
        <p className="text-[10px] text-[#6e6e6e]">{ext.publisher}</p>
        <p className="text-[10px] text-[#6e6e6e] truncate mt-0.5">{ext.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {ext.installed ? (
          <>
            <Toggle
              checked={ext.enabled ?? true}
              onChange={(v) => onToggle?.(ext.id, v)}
            />
            <button
              onClick={() => onUninstall?.(ext.id)}
              className="opacity-0 group-hover:opacity-100 text-[10px] text-[#6e6e6e] hover:text-[#f44747] transition-all"
              title="Uninstall"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              info('Extension marketplace coming in v2', 3000)
              onInstall?.(ext.id)
            }}
            className="text-[10px] px-2 h-5 rounded border border-[#569cd6] text-[#569cd6] hover:bg-[#1b2d3e] transition-colors"
          >
            Install
          </button>
        )}
      </div>
    </div>
  )
}
