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
  icon?:       string
  coverImage?: string
  isBuiltin?:  boolean
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
  return colors[Abs(hash) % colors.length]
}

function Abs(n: number) { return n < 0 ? -n : n }

export function ExtensionItem({ ext, onToggle, onInstall, onUninstall }: ExtensionItemProps) {
  const { info } = useNotificationStore()
  const color = nameToColor(ext.name)
  const [imgError, setImgError] = React.useState(false)

  return (
    <div className={cn(
      "flex flex-col gap-2 px-3 py-3 border-b border-varta-border hover:bg-varta-hover transition-colors group",
      ext.isBuiltin && "bg-varta-bg-secondary/50"
    )}>
      {/* Cover Image for Built-ins */}
      {ext.isBuiltin && ext.coverImage && (
        <div className="w-full aspect-video rounded overflow-hidden mb-1 bg-black/20 border border-white/5">
          <img 
            src={ext.coverImage} 
            alt={ext.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Icon */}
        {ext.icon && !imgError ? (
          <img 
            src={ext.icon} 
            alt={ext.name} 
            className="w-8 h-8 rounded shrink-0 object-contain bg-white/5" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: color + '33', border: `1px solid ${color}44` }}
          >
            <span style={{ color }}>{ext.name[0].toUpperCase()}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-varta-text truncate">{ext.name}</span>
            {ext.version && (
              <span className="text-[10px] text-varta-text-faint shrink-0">v{ext.version}</span>
            )}
          </div>
          <p className="text-[10px] text-varta-text-muted">{ext.publisher}</p>
          <p className="text-[10px] text-varta-text-faint truncate mt-0.5">{ext.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {ext.installed ? (
            <>
              <Toggle
                checked={ext.enabled ?? true}
                onChange={(v) => onToggle?.(ext.id, v)}
              />
              {!ext.isBuiltin && (
                <button
                  onClick={() => onUninstall?.(ext.id)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-varta-text-faint hover:text-varta-error transition-all"
                  title="Uninstall"
                >
                  ✕
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onInstall?.(ext.id)}
              className="text-[10px] px-2 h-5 rounded border border-varta-accent text-varta-accent hover:bg-varta-accent/10 transition-colors"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
