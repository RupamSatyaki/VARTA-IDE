import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useUIStore }   from '../../store/uiStore'
import { useTabStore }  from '../../store/tabStore'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { registry } from '../../lib/commandRegistry'
import { FontAwesomeIcon }  from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'

// ── Menu data ─────────────────────────────────────────────────────────────────

const MENUS = {
  File: [
    { label: 'New File',        shortcut: 'Ctrl+N',         action: 'file.newFile' },
    { label: 'Open File…',      shortcut: 'Ctrl+O',         action: 'file.openFile' },
    { label: 'Open Folder…',    shortcut: 'Ctrl+K Ctrl+O',  action: 'file.openFolder' },
    { type: 'separator' },
    { label: 'Save',            shortcut: 'Ctrl+S',         action: 'file.save' },
    { label: 'Save All',        shortcut: 'Ctrl+Shift+S',   action: 'file.saveAll' },
    { type: 'separator' },
    { label: 'Close Tab',       shortcut: 'Ctrl+W',         action: 'file.closeTab' },
    { label: 'Reopen Closed',   shortcut: 'Ctrl+Shift+T',   action: 'file.reopenClosed' },
    { type: 'separator' },
    { label: 'Settings',        shortcut: 'Ctrl+,',         action: 'settings.open' },
    { type: 'separator' },
    { label: 'Exit',            shortcut: 'Alt+F4',         action: 'app.quit' },
  ],
  Edit: [
    { label: 'Undo',                shortcut: 'Ctrl+Z',         action: 'editor.undo' },
    { label: 'Redo',                shortcut: 'Ctrl+Y',         action: 'editor.redo' },
    { type: 'separator' },
    { label: 'Cut',                 shortcut: 'Ctrl+X',         action: 'editor.cut' },
    { label: 'Copy',                shortcut: 'Ctrl+C',         action: 'editor.copy' },
    { label: 'Paste',               shortcut: 'Ctrl+V',         action: 'editor.paste' },
    { type: 'separator' },
    { label: 'Find',                shortcut: 'Ctrl+F',         action: 'editor.find' },
    { label: 'Replace',             shortcut: 'Ctrl+H',         action: 'editor.replace' },
    { type: 'separator' },
    { label: 'Find in Files',       shortcut: 'Ctrl+Shift+F',   action: 'edit.findInFiles' },
    { label: 'Replace in Files',    shortcut: 'Ctrl+Shift+H',   action: 'edit.findInFiles' },
    { type: 'separator' },
    { label: 'Format Document',     shortcut: 'Shift+Alt+F',    action: 'edit.formatDocument' },
    { label: 'Toggle Line Comment', shortcut: 'Ctrl+/',         action: 'editor.toggleComment' },
  ],
  Selection: [
    { label: 'Select All',              shortcut: 'Ctrl+A',         action: 'editor.selectAll' },
    { label: 'Expand Selection',        shortcut: 'Shift+Alt+→',    action: 'editor.expandSelection' },
    { label: 'Shrink Selection',        shortcut: 'Shift+Alt+←',    action: 'editor.shrinkSelection' },
    { type: 'separator' },
    { label: 'Add Cursor Above',        shortcut: 'Ctrl+Alt+↑',     action: 'editor.addCursorAbove' },
    { label: 'Add Cursor Below',        shortcut: 'Ctrl+Alt+↓',     action: 'editor.addCursorBelow' },
    { label: 'Add Next Occurrence',     shortcut: 'Ctrl+D',         action: 'editor.addNextOccurrence' },
    { type: 'separator' },
    { label: 'Copy Line Up',            shortcut: 'Shift+Alt+↑',    action: 'editor.copyLineUp' },
    { label: 'Copy Line Down',          shortcut: 'Shift+Alt+↓',    action: 'editor.copyLineDown' },
    { label: 'Move Line Up',            shortcut: 'Alt+↑',          action: 'editor.moveLineUp' },
    { label: 'Move Line Down',          shortcut: 'Alt+↓',          action: 'editor.moveLineDown' },
  ],
  View: [
    { label: 'Command Palette',     shortcut: 'Ctrl+Shift+P',   action: 'palette.commands' },
    { label: 'Quick Open',          shortcut: 'Ctrl+P',         action: 'palette.files' },
    { type: 'separator' },
    { label: 'Explorer',            shortcut: 'Ctrl+Shift+E',   action: 'view.explorer' },
    { label: 'Search',              shortcut: 'Ctrl+Shift+F',   action: 'edit.findInFiles' },
    { label: 'Source Control',      shortcut: 'Ctrl+Shift+G',   action: 'git.openPanel' },
    { label: 'AI Assistant',        shortcut: 'Ctrl+Shift+A',   action: 'view.ai' },
    { type: 'separator' },
    { label: 'Toggle Sidebar',      shortcut: 'Ctrl+B',         action: 'view.toggleSidebar' },
    { label: 'Toggle Panel',        shortcut: 'Ctrl+J',         action: 'view.togglePanel' },
    { label: 'Toggle Terminal',     shortcut: 'Ctrl+`',         action: 'view.toggleTerminal' },
    { type: 'separator' },
    { label: 'Toggle Word Wrap',    shortcut: 'Alt+Z',          action: 'view.toggleWordWrap' },
    { label: 'Toggle Minimap',      shortcut: '',               action: 'view.toggleMinimap' },
    { label: 'Toggle Fullscreen',   shortcut: 'F11',            action: 'view.fullscreen' },
    { label: 'Zoom In',             shortcut: 'Ctrl+=',         action: 'view.zoomIn' },
    { label: 'Zoom Out',            shortcut: 'Ctrl+-',         action: 'view.zoomOut' },
  ],
  Go: [
    { label: 'Go to File…',         shortcut: 'Ctrl+P',         action: 'palette.files' },
    { label: 'Go to Line…',         shortcut: 'Ctrl+G',         action: 'editor.gotoLine' },
    { label: 'Go to Symbol…',       shortcut: 'Ctrl+Shift+O',   action: 'editor.gotoSymbol' },
    { type: 'separator' },
    { label: 'Go Back',             shortcut: 'Alt+←',          action: 'editor.goBack' },
    { label: 'Go Forward',          shortcut: 'Alt+→',          action: 'editor.goForward' },
    { type: 'separator' },
    { label: 'Go to Definition',    shortcut: 'F12',            action: 'editor.gotoDefinition' },
    { label: 'Go to References',    shortcut: 'Shift+F12',      action: 'editor.gotoReferences' },
    { label: 'Go to Next Problem',  shortcut: 'F8',             action: 'editor.nextProblem' },
    { label: 'Go to Prev Problem',  shortcut: 'Shift+F8',       action: 'editor.prevProblem' },
  ],
  Run: [
    { label: 'Start Debugging',     shortcut: 'F5',             action: 'debug.start' },
    { label: 'Run Without Debug',   shortcut: 'Ctrl+F5',        action: 'debug.runNoDebug' },
    { label: 'Stop',                shortcut: 'Shift+F5',       action: 'debug.stop' },
    { type: 'separator' },
    { label: 'Step Over',           shortcut: 'F10',            action: 'debug.stepOver' },
    { label: 'Step Into',           shortcut: 'F11',            action: 'debug.stepInto' },
    { label: 'Step Out',            shortcut: 'Shift+F11',      action: 'debug.stepOut' },
    { type: 'separator' },
    { label: 'Toggle Breakpoint',   shortcut: 'F9',             action: 'debug.toggleBreakpoint' },
  ],
  Terminal: [
    { label: 'New Terminal',        shortcut: 'Ctrl+Shift+`',   action: 'terminal.new' },
    { label: 'Split Terminal',      shortcut: 'Ctrl+Shift+5',   action: 'terminal.split' },
    { type: 'separator' },
    { label: 'Clear Terminal',      shortcut: '',               action: 'terminal.clear' },
    { label: 'Kill Terminal',       shortcut: '',               action: 'terminal.kill' },
  ],
  Help: [
    { label: 'Welcome',             shortcut: '',               action: 'help.welcome' },
    { label: 'Keyboard Shortcuts',  shortcut: 'Ctrl+K Ctrl+S',  action: 'help.shortcuts' },
    { type: 'separator' },
    { label: 'About Varta',         shortcut: '',               action: 'help.about' },
  ],
} as const

type MenuName = keyof typeof MENUS

// ── Action dispatcher ─────────────────────────────────────────────────────────

function dispatchAction(action: string) {
  const cmd = registry.getAll().find(c => c.id === action)
  if (cmd) { cmd.execute(); return }
  // Fallback custom events
  window.dispatchEvent(new CustomEvent(`varta:${action}`))
}

// ── Dropdown menu ─────────────────────────────────────────────────────────────

interface DropdownProps {
  items: readonly any[]
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement>
}

function Dropdown({ items, onClose, anchorRef }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !anchorRef.current?.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-0.5 min-w-[240px] z-[9999]
        bg-[#1e1a24] border border-[#3a2f45] rounded-xl shadow-2xl
        overflow-hidden py-1"
    >
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <div key={i} className="my-1 border-t border-[#2a1f30]" />
        }
        return (
          <button
            key={i}
            onClick={() => { dispatchAction(item.action); onClose() }}
            className="w-full flex items-center justify-between px-3 py-1 text-[12px]
              text-[#cccccc] hover:bg-[#7c3aed]/15 hover:text-white transition-colors text-left"
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-[#5a4a6a] ml-8 shrink-0">{item.shortcut}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Main TitleBar ─────────────────────────────────────────────────────────────

export function TitleBar() {
  const {
    isMaximized, platform, setMaximized, setPlatform,
    sidebarVisible, panelVisible, secondarySidebarVisible,
    toggleSidebar, togglePanel, toggleSecondarySidebar,
    openCommandPalette,
  } = useUIStore()

  const { tabs, activeTabId } = useTabStore()
  const { rootPath } = useFileTreeStore()

  const [openMenu, setOpenMenu] = useState<MenuName | null>(null)
  const menuRefs = useRef<Record<string, React.RefObject<HTMLButtonElement>>>({})

  // Ensure refs exist for all menus
  Object.keys(MENUS).forEach(name => {
    if (!menuRefs.current[name]) {
      menuRefs.current[name] = React.createRef<HTMLButtonElement>()
    }
  })

  useEffect(() => {
    window.varta.app.getPlatform().then(r => { if (r.success) setPlatform(r.data as string) }).catch(() => {})
    window.varta.window.isMaximized().then(v => setMaximized(v)).catch(() => {})
    const offMax   = window.varta.window.onMaximized(()   => setMaximized(true))
    const offUnmax = window.varta.window.onUnmaximized(() => setMaximized(false))
    return () => { offMax(); offUnmax() }
  }, [setMaximized, setPlatform])

  // Close menu on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const isMac = platform === 'darwin'
  const activeTab = tabs.find(t => t.id === activeTabId)
  const folderName = rootPath?.replace(/\\/g, '/').split('/').pop() ?? ''
  const fileName   = activeTab?.filePath.replace(/\\/g, '/').split('/').pop() ?? ''

  return (
    <div
      className="flex items-center h-[38px] shrink-0 select-none bg-[#1a1620] border-b border-[#2a1f30]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* ── Left: App icon + Menu bar ── */}
      <div
        className="flex items-center gap-0 shrink-0 pl-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* App icon */}
        <div className="w-6 h-6 rounded-md flex items-center justify-center mr-1
          bg-gradient-to-br from-[#7c3aed] to-[#a855f7]">
          <span className="text-[10px] font-black text-white">V</span>
        </div>

        {/* Menu items */}
        {(Object.keys(MENUS) as MenuName[]).map(name => (
          <div key={name} className="relative">
            <button
              ref={menuRefs.current[name] as React.RefObject<HTMLButtonElement>}
              onClick={() => setOpenMenu(prev => prev === name ? null : name)}
              className={`px-2.5 h-7 text-[12px] rounded-md transition-all duration-100
                ${openMenu === name
                  ? 'bg-[#7c3aed]/20 text-white'
                  : 'text-[#9090b0] hover:text-white hover:bg-white/5'}`}
            >
              {name}
            </button>
            {openMenu === name && (
              <Dropdown
                items={MENUS[name]}
                onClose={() => setOpenMenu(null)}
                anchorRef={menuRefs.current[name] as React.RefObject<HTMLButtonElement>}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Center: Search bar ── */}
      <div
        className="flex-1 flex items-center justify-center px-4"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2 w-full max-w-[380px] h-7 px-3 rounded-lg
            bg-[#28242e] border border-[#3a2f45] hover:border-[#7c3aed]/50
            text-[#5a4a6a] hover:text-[#9090b0] transition-all duration-150 group"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 11 }} />
          <span className="flex-1 text-left text-[11px]">
            {folderName ? `${folderName}${fileName ? ` — ${fileName}` : ''}` : 'Search files…'}
          </span>
          <span className="text-[10px] text-[#3a2f45] group-hover:text-[#5a4a6a] font-mono">Ctrl+P</span>
        </button>
      </div>

      {/* ── Right: Layout icons + Window controls ── */}
      <div
        className="flex items-center gap-0.5 pr-1 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Toggle All Layout */}
        <LayoutBtn
          tooltip="Toggle All Panels"
          active={sidebarVisible && panelVisible && secondarySidebarVisible}
          onClick={() => {
            const ui = useUIStore.getState()
            const allOpen = ui.sidebarVisible && ui.panelVisible && ui.secondarySidebarVisible
            if (allOpen) {
              ui.setSidebarVisible(false); ui.setPanelVisible(false); ui.setSecondarySidebarVisible(false)
            } else {
              ui.setSidebarVisible(true); ui.setPanelVisible(true); ui.setSecondarySidebarVisible(true)
            }
          }}
          icon={<PrimarySidebarIcon active={sidebarVisible && panelVisible && secondarySidebarVisible} />}
        />

        {/* Toggle Primary Sidebar (left) */}
        <LayoutBtn
          tooltip="Toggle Primary Sidebar (Ctrl+B)"
          active={sidebarVisible}
          onClick={toggleSidebar}
          icon={<SecondarySidebarIcon active={sidebarVisible} />}
        />

        {/* Toggle Panel (terminal) */}
        <LayoutBtn
          tooltip="Toggle Panel (Ctrl+J)"
          active={panelVisible}
          onClick={togglePanel}
          icon={<PanelIcon active={panelVisible} />}
        />

        {/* Toggle Secondary Sidebar (AI Chat) */}
        <LayoutBtn
          tooltip="Toggle AI Chat Panel"
          active={secondarySidebarVisible}
          onClick={toggleSecondarySidebar}
          icon={<ChatIcon active={secondarySidebarVisible} />}
        />

        {/* Separator */}
        <div className="w-px h-4 bg-[#2a1f30] mx-1" />

        {/* Window controls */}
        {!isMac && (
          <>
            <WinBtn onClick={() => window.varta.window.minimize()} label="Minimize" icon={<MinimizeIcon />} />
            <WinBtn
              onClick={() => isMaximized ? window.varta.window.restore() : window.varta.window.maximize()}
              label={isMaximized ? 'Restore' : 'Maximize'}
              icon={isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
            />
            <WinBtn onClick={() => window.varta.window.close()} label="Close" icon={<CloseIcon />} danger />
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LayoutBtn({ tooltip, active, onClick, icon }: {
  tooltip: string; active: boolean; onClick: () => void; icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150
        ${active
          ? 'text-[#c084fc] bg-[#7c3aed]/20'
          : 'text-[#5a4a6a] hover:text-[#cccccc] hover:bg-white/5'}`}
    >
      {icon}
    </button>
  )
}

// ── Layout SVG Icons (matching the image exactly) ─────────────────────────────

/** Icon 1: All panels toggle — active: all 3 sections filled */
const PrimarySidebarIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/>
    <path d="M9 3v18"/>
    <path d="M9 12h12"/>
    {active && <>
      {/* left panel */}
      <path d="M3 3h6v18H3z" fill="currentColor" fillOpacity="0.9" stroke="none"/>
      {/* top-right */}
      <path d="M9 3h12v9H9z"  fill="currentColor" fillOpacity="0.9" stroke="none"/>
      {/* bottom-right */}
      <path d="M9 12h12v9H9z" fill="currentColor" fillOpacity="0.9" stroke="none"/>
    </>}
  </svg>
)

/** Icon 2: Primary sidebar — active: left box filled */
const SecondarySidebarIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/>
    <path d="M3 3h6v18H3z" fill="currentColor" fillOpacity={active ? 0.9 : 0.3}/>
    <path d="M9 3v18"/>
  </svg>
)

/** Icon 3: Panel — active: bottom box filled */
const PanelIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/>
    <path d="M3 15h18v6H3z" fill="currentColor" fillOpacity={active ? 0.9 : 0.3}/>
    <path d="M3 15h18"/>
  </svg>
)

/** Icon 4: Chat bubble — active: fully filled */
const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

function WinBtn({ onClick, label, icon, danger = false }: {
  onClick: () => void; label: string; icon: React.ReactNode; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-9 h-7 flex items-center justify-center rounded-md transition-all duration-150
        text-[#5a4a6a]
        ${danger ? 'hover:bg-[#e81123] hover:text-white' : 'hover:bg-white/5 hover:text-[#cccccc]'}`}
    >
      {icon}
    </button>
  )
}

const MinimizeIcon = () => <svg width="10" height="1"  viewBox="0 0 10 1"  fill="currentColor"><rect width="10" height="1"/></svg>
const MaximizeIcon = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x=".5" y=".5" width="9" height="9"/></svg>
const RestoreIcon  = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2.5" y=".5" width="7" height="7"/><path d="M.5 2.5v7h7"/></svg>
const CloseIcon    = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M.293.293l9.414 9.414-.707.707L-.414 1 .293.293zm9.414 0l.707.707L1 10.414l-.707-.707L9.707.293z"/></svg>
