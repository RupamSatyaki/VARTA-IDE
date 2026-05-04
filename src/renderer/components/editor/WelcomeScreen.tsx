import React from 'react'
import { cn } from '../../utils/cn'
import { Icon } from '../ui/Icon'
import { KeyboardShortcut } from '../ui/KeyboardShortcut'

export interface WelcomeScreenProps {
  onNewFile:    () => void
  onOpenFile:   () => void
  onOpenFolder: () => void
  recentFolders?: string[]
  onOpenRecent?: (path: string) => void
}

export function WelcomeScreen({
  onNewFile,
  onOpenFile,
  onOpenFolder,
  recentFolders = [],
  onOpenRecent,
}: WelcomeScreenProps) {
  return (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e] overflow-auto">
      <div className="w-full max-w-lg px-8 py-12 select-none">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#0e639c] mb-4">
            <span className="text-3xl font-bold text-white">V</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#d4d4d4]">Varta</h1>
          <p className="text-sm text-[#6e6e6e] mt-1">Code editor</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Start */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6e6e6e] mb-3">Start</h2>
            <div className="flex flex-col gap-1">
              <WelcomeAction icon="file" label="New File" shortcut="Ctrl+N" onClick={onNewFile} />
              <WelcomeAction icon="folder" label="Open File…" shortcut="Ctrl+O" onClick={onOpenFile} />
              <WelcomeAction icon="folder-open" label="Open Folder…" shortcut="Ctrl+K Ctrl+O" onClick={onOpenFolder} />
            </div>
          </div>

          {/* Recent */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6e6e6e] mb-3">Recent</h2>
            {recentFolders.length === 0 ? (
              <p className="text-xs text-[#4e4e4e]">No recent folders</p>
            ) : (
              <div className="flex flex-col gap-1">
                {recentFolders.slice(0, 5).map((p) => {
                  const name = p.replace(/\\/g, '/').split('/').pop() ?? p
                  return (
                    <button
                      key={p}
                      onClick={() => onOpenRecent?.(p)}
                      title={p}
                      className="flex items-center gap-2 text-left text-sm text-[#569cd6] hover:text-[#4fc1ff] truncate"
                    >
                      <Icon name="folder" size={14} className="shrink-0 text-[#c09553]" />
                      <span className="truncate">{name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="mt-10 border-t border-[#2d2d2d] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6e6e6e] mb-3">Shortcuts</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {SHORTCUTS.map(({ label, keys }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#6e6e6e]">{label}</span>
                <KeyboardShortcut keys={keys} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomeAction({ icon, label, shortcut, onClick }: {
  icon: string; label: string; shortcut: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded text-sm text-[#d4d4d4] hover:bg-[#2a2d2e] transition-colors text-left"
    >
      <Icon name={icon} size={16} className="text-[#569cd6] shrink-0" />
      <span className="flex-1">{label}</span>
      <span className="text-xs text-[#4e4e4e]">{shortcut}</span>
    </button>
  )
}

const SHORTCUTS = [
  { label: 'Command Palette', keys: 'Ctrl+Shift+P' },
  { label: 'Quick Open',      keys: 'Ctrl+P' },
  { label: 'Save File',       keys: 'Ctrl+S' },
  { label: 'Close Tab',       keys: 'Ctrl+W' },
  { label: 'Toggle Terminal', keys: 'Ctrl+`' },
  { label: 'Toggle Sidebar',  keys: 'Ctrl+B' },
  { label: 'Find in Files',   keys: 'Ctrl+Shift+F' },
  { label: 'Split Editor',    keys: 'Ctrl+\\' },
]
