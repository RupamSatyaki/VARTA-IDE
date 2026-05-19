import React from 'react'
import { cn } from '../../utils/cn'
import { useNotificationStore } from '../../store/notificationStore'
import { useExtensionStore } from '../../store/extensionStore'

export type ExtensionFilter = 'all' | 'enabled' | 'disabled'

export interface ExtensionToolbarProps {
  filter:    ExtensionFilter
  onFilter:  (f: ExtensionFilter) => void
}

export function ExtensionToolbar({ filter, onFilter }: ExtensionToolbarProps) {
  const { info, error: notifyError } = useNotificationStore()
  const { installFromFile } = useExtensionStore()

  const handleInstallVsix = async () => {
    const res = await window.varta.dialog.openFile({
      title: 'Install Extension from VSIX',
      filters: [{ name: 'VSIX Extension', extensions: ['vsix'] }],
      properties: ['openFile']
    })

    if (res.success && !res.data.cancelled && res.data.paths[0]) {
      try {
        await installFromFile(res.data.paths[0])
        info('Extension installed successfully', 3000)
      } catch (err: any) {
        notifyError(`VSIX Installation failed: ${err.message}`)
      }
    }
  }

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-varta-border shrink-0">
      <div className="flex items-center gap-1">
        {(['all', 'enabled', 'disabled'] as ExtensionFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={cn(
              'text-[10px] px-2 h-5 rounded capitalize transition-colors',
              filter === f
                ? 'bg-varta-active text-varta-text'
                : 'text-varta-text-faint hover:text-varta-text',
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <button
        onClick={handleInstallVsix}
        className="text-[10px] text-varta-accent hover:text-varta-accent-hover transition-colors"
      >
        Install from VSIX…
      </button>
    </div>
  )
}

