import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileCirclePlus,
  faFolderOpen,
  faFile,
  faFolder,
  faTerminal,
  faMagnifyingGlass,
  faCodeBranch,
  faTableColumns,
  faKeyboard,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import { KeyboardShortcut } from '../ui/KeyboardShortcut'

export interface WelcomeScreenProps {
  onNewFile:     () => void
  onOpenFile:    () => void
  onOpenFolder:  () => void
  recentFolders?: string[]
  onOpenRecent?:  (path: string) => void
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
      <div className="w-full max-w-[520px] px-8 py-10 select-none">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            {/* Glow */}
            <div className="absolute inset-0 rounded-2xl bg-[#7c3aed]/30 blur-xl scale-110" />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center
              bg-gradient-to-br from-[#7c3aed] to-[#a855f7]
              shadow-[0_8px_32px_rgba(124,58,237,0.4)]">
              <span className="text-2xl font-black text-white tracking-tight">V</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-[#e0e0e0] tracking-tight">Varta</h1>
          <p className="text-[12px] text-[#6e6e6e] mt-0.5">Code editor</p>
        </div>

        {/* ── Start + Recent ── */}
        <div className="grid grid-cols-2 gap-6 mb-8">

          {/* Start */}
          <div>
            <SectionLabel>Start</SectionLabel>
            <div className="flex flex-col gap-0.5">
              <ActionBtn
                icon={faFileCirclePlus}
                iconColor="#73c991"
                label="New File"
                shortcut="Ctrl+N"
                onClick={onNewFile}
              />
              <ActionBtn
                icon={faFile}
                iconColor="#519aba"
                label="Open File…"
                shortcut="Ctrl+O"
                onClick={onOpenFile}
              />
              <ActionBtn
                icon={faFolderOpen}
                iconColor="#c09553"
                label="Open Folder…"
                shortcut="Ctrl+K O"
                onClick={onOpenFolder}
              />
            </div>
          </div>

          {/* Recent */}
          <div>
            <SectionLabel>Recent</SectionLabel>
            {recentFolders.length === 0 ? (
              <div className="flex flex-col items-start gap-1 pt-1">
                <p className="text-[12px] text-[#4e4e4e] italic">No recent folders</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {recentFolders.slice(0, 5).map((p) => {
                  const name = p.replace(/\\/g, '/').split('/').pop() ?? p
                  return (
                    <button
                      key={p}
                      onClick={() => onOpenRecent?.(p)}
                      title={p}
                      className="flex items-center gap-2 px-2 py-1 rounded text-left
                        text-[13px] text-[#569cd6] hover:text-[#4fc1ff]
                        hover:bg-[#2a2d2e] transition-colors truncate"
                    >
                      <FontAwesomeIcon icon={faFolder} className="shrink-0 text-[#c09553]" style={{ fontSize: 13 }} />
                      <span className="truncate">{name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Shortcuts ── */}
        <div className="border-t border-[#2a2a2a] pt-6">
          <SectionLabel>
            <FontAwesomeIcon icon={faKeyboard} className="mr-1.5 opacity-50" style={{ fontSize: 10 }} />
            Shortcuts
          </SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-1">
            {SHORTCUTS.map(({ label, keys, icon }) => (
              <div key={label} className="flex items-center justify-between gap-2 group">
                <span className="flex items-center gap-1.5 text-[12px] text-[#6e6e6e] group-hover:text-[#999] transition-colors">
                  <FontAwesomeIcon icon={icon} style={{ fontSize: 10 }} className="opacity-50" />
                  {label}
                </span>
                <KeyboardShortcut keys={keys} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center text-[10px] font-bold uppercase tracking-widest text-[#4e4e4e] mb-2">
      {children}
    </h2>
  )
}

function ActionBtn({ icon, iconColor, label, shortcut, onClick }: {
  icon:      any
  iconColor: string
  label:     string
  shortcut:  string
  onClick:   () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left
        text-[13px] text-[#cccccc] hover:text-white
        hover:bg-[#2a2d2e] transition-all duration-150 group"
    >
      <span className="w-5 flex items-center justify-center shrink-0">
        <FontAwesomeIcon icon={icon} style={{ fontSize: 14, color: iconColor }} />
      </span>
      <span className="flex-1">{label}</span>
      <span className="text-[10px] text-[#3e3e3e] group-hover:text-[#5e5e5e] transition-colors font-mono">
        {shortcut}
      </span>
    </button>
  )
}

// ── Shortcuts data ────────────────────────────────────────────────────────────

const SHORTCUTS = [
  { label: 'Command Palette', keys: 'Ctrl+Shift+P', icon: faWandMagicSparkles },
  { label: 'Quick Open',      keys: 'Ctrl+P',       icon: faFile              },
  { label: 'Save File',       keys: 'Ctrl+S',       icon: faFileCirclePlus    },
  { label: 'Close Tab',       keys: 'Ctrl+W',       icon: faFile              },
  { label: 'Toggle Terminal', keys: 'Ctrl+`',       icon: faTerminal          },
  { label: 'Toggle Sidebar',  keys: 'Ctrl+B',       icon: faTableColumns      },
  { label: 'Find in Files',   keys: 'Ctrl+Shift+F', icon: faMagnifyingGlass   },
  { label: 'Split Editor',    keys: 'Ctrl+\\',      icon: faCodeBranch        },
]
