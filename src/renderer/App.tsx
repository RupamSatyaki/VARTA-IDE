import React, { useEffect, Component, type ReactNode } from 'react'
import { RootLayout }            from './components/layout/RootLayout'
import { SettingsPanel }         from './components/settings/SettingsPanel'
import { CommandPalette }        from './components/commandpalette/CommandPalette'
import { NotificationContainer } from './components/notifications/NotificationContainer'
import { useSettingsStore }      from './store/settingsStore'
import { useUIStore }            from './store/uiStore'
import { useAIStore }            from './store/aiStore'
import { useSettings, applyTheme } from './hooks/useSettings'
import { useKeybinding }         from './hooks/useKeybinding'
import { registry }              from './lib/commandRegistry'

// ── Error Boundary ────────────────────────────────────────────────────────────
interface EBState { error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null }
  static getDerivedStateFromError(error: Error): EBState { return { error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Varta] Unhandled render error:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-[#d4d4d4] gap-4 p-8">
          <div className="text-[#f44747] text-lg font-semibold">Something went wrong</div>
          <pre className="text-xs text-[#6e6e6e] bg-[#252526] p-4 rounded max-w-2xl overflow-auto max-h-64 w-full">
            {this.state.error.message}{'\n\n'}{this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-[#0e639c] text-white rounded text-sm hover:bg-[#1177bb]"
          >
            Try to recover
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Dispatch helper — returns void, not boolean ───────────────────────────────
const dispatch = (name: string) => (): void => { window.dispatchEvent(new CustomEvent(name)) }

// ── Register all commands ─────────────────────────────────────────────────────
let commandsRegistered = false
function registerCommands() {
  if (commandsRegistered) { return }
  commandsRegistered = true

  const ui = () => useUIStore.getState()

  // Palette
  registry.register({ id: 'palette.commands', label: 'Show All Commands',    category: 'View',     keybinding: 'Ctrl+Shift+P', execute: () => { ui().openCommandPalette() } })
  registry.register({ id: 'palette.files',    label: 'Go to File…',          category: 'File',     keybinding: 'Ctrl+P',       execute: () => { ui().openCommandPalette() } })

  // File
  registry.register({ id: 'file.newFile',      label: 'New File',            category: 'File',     keybinding: 'Ctrl+N',       execute: dispatch('varta:new-file') })
  registry.register({ id: 'file.openFile',     label: 'Open File…',          category: 'File',     keybinding: 'Ctrl+O',       execute: dispatch('varta:open-file') })
  registry.register({ id: 'file.openFolder',   label: 'Open Folder…',        category: 'File',     keybinding: 'Ctrl+K Ctrl+O',execute: dispatch('varta:open-folder') })
  registry.register({ id: 'file.save',         label: 'Save',                category: 'File',     keybinding: 'Ctrl+S',       execute: dispatch('varta:save-active') })
  registry.register({ id: 'file.saveAll',      label: 'Save All',            category: 'File',     keybinding: 'Ctrl+Shift+S', execute: dispatch('varta:save-all') })
  registry.register({ id: 'file.closeTab',     label: 'Close Tab',           category: 'File',     keybinding: 'Ctrl+W',       execute: dispatch('varta:close-tab') })
  registry.register({ id: 'file.reopenClosed', label: 'Reopen Closed Tab',   category: 'File',     keybinding: 'Ctrl+Shift+T', execute: dispatch('varta:reopen-closed') })
  registry.register({ id: 'file.openPath',     label: 'Open Path',           category: 'File',     execute: () => {} })

  // Edit
  registry.register({ id: 'edit.findInFiles',    label: 'Find in Files',     category: 'Edit',     keybinding: 'Ctrl+Shift+F', execute: () => { ui().setActiveSidebarPanel('search'); setTimeout(() => window.dispatchEvent(new CustomEvent('varta:focus-search')), 50) } })
  registry.register({ id: 'edit.formatDocument', label: 'Format Document',   category: 'Edit',     keybinding: 'Shift+Alt+F',  execute: dispatch('varta:format-document') })

  // View
  registry.register({ id: 'view.toggleSidebar',  label: 'Toggle Sidebar',   category: 'View',     keybinding: 'Ctrl+B',       execute: () => { ui().toggleSidebar() } })
  registry.register({ id: 'view.togglePanel',    label: 'Toggle Panel',     category: 'View',     keybinding: 'Ctrl+J',       execute: () => { ui().togglePanel() } })
  registry.register({ id: 'view.toggleTerminal', label: 'Toggle Terminal',  category: 'View',     keybinding: 'Ctrl+`',       execute: () => { ui().setActiveBottomPanel('terminal'); ui().setPanelVisible(true) } })
  registry.register({ id: 'view.explorer',       label: 'Show Explorer',    category: 'View',     keybinding: 'Ctrl+Shift+E', execute: () => { ui().setActiveSidebarPanel('explorer') } })
  registry.register({ id: 'view.fullscreen',     label: 'Toggle Fullscreen',category: 'View',     keybinding: 'F11',          execute: () => { window.varta.window.toggleFullscreen() } })
  registry.register({ id: 'view.toggleMinimap',  label: 'Toggle Minimap',   category: 'View',     execute: async () => {
    const { useSettingsStore: ss } = await import('./store/settingsStore')
    const s = ss.getState().settings
    ss.getState().update({ editor: { ...s.editor, showMinimap: !s.editor.showMinimap } })
    window.varta.settings.set({ editor: { showMinimap: !s.editor.showMinimap } })
  }})
  registry.register({ id: 'view.toggleWordWrap', label: 'Toggle Word Wrap', category: 'View',     keybinding: 'Alt+Z',        execute: async () => {
    const { useSettingsStore: ss } = await import('./store/settingsStore')
    const s = ss.getState().settings
    const wrap = s.editor.wordWrap === 'off' ? 'on' : 'off'
    ss.getState().update({ editor: { ...s.editor, wordWrap: wrap } })
    window.varta.settings.set({ editor: { wordWrap: wrap } })
  }})
  registry.register({ id: 'view.zoomIn',  label: 'Zoom In',  category: 'View', keybinding: 'Ctrl+=', execute: () => {} })
  registry.register({ id: 'view.zoomOut', label: 'Zoom Out', category: 'View', keybinding: 'Ctrl+-', execute: () => {} })

  // Git
  registry.register({ id: 'git.openPanel',       label: 'Git: Open Source Control',      category: 'Git', keybinding: 'Ctrl+Shift+G', execute: () => { ui().setActiveSidebarPanel('git') } })
  registry.register({ id: 'git.refresh',         label: 'Git: Refresh',                  category: 'Git', execute: dispatch('varta:git-refresh') })
  registry.register({ id: 'git.stageAll',        label: 'Git: Stage All Changes',        category: 'Git', execute: dispatch('varta:git-stage-all') })
  registry.register({ id: 'git.push',            label: 'Git: Push',                     category: 'Git', execute: dispatch('varta:git-push') })
  registry.register({ id: 'git.pull',            label: 'Git: Pull',                     category: 'Git', execute: dispatch('varta:git-pull') })
  registry.register({ id: 'git.fetch',           label: 'Git: Fetch',                    category: 'Git', execute: dispatch('varta:git-fetch') })
  registry.register({ id: 'git.generateMessage', label: 'Git: Generate Commit Message',  category: 'Git', execute: dispatch('varta:git-generate-msg') })

  // Terminal
  registry.register({ id: 'terminal.new',   label: 'Terminal: New Terminal', category: 'Terminal', keybinding: 'Ctrl+Shift+`', execute: dispatch('varta:terminal-new') })
  registry.register({ id: 'terminal.clear', label: 'Terminal: Clear',        category: 'Terminal', execute: dispatch('varta:terminal-clear-active') })
  registry.register({ id: 'terminal.kill',  label: 'Terminal: Kill',         category: 'Terminal', execute: dispatch('varta:terminal-kill') })

  // AI
  registry.register({ id: 'ai.openChat',      label: 'Varta: Open AI Chat',        category: 'AI', keybinding: 'Ctrl+Shift+A', execute: () => { ui().setActiveSidebarPanel('ai') } })
  registry.register({ id: 'ai.explainCode',   label: 'Varta: Explain Selection',   category: 'AI', execute: dispatch('varta:ai-explain') })
  registry.register({ id: 'ai.fixError',      label: 'Varta: Fix Error',           category: 'AI', execute: dispatch('varta:ai-fix') })
  registry.register({ id: 'ai.generateTests', label: 'Varta: Generate Tests',      category: 'AI', execute: dispatch('varta:ai-tests') })
  registry.register({ id: 'ai.generateDocs',  label: 'Varta: Generate Docs',       category: 'AI', execute: dispatch('varta:ai-docs') })

  // Settings
  registry.register({ id: 'settings.open',     label: 'Open Settings',      category: 'Settings', keybinding: 'Ctrl+,',       execute: () => { if (ui().settingsOpen) { ui().closeSettings() } else { ui().openSettings() } } })
  registry.register({ id: 'settings.resetAll', label: 'Reset All Settings', category: 'Settings', execute: dispatch('varta:settings-reset') })
  registry.register({ id: 'settings.export',   label: 'Export Settings',    category: 'Settings', execute: dispatch('varta:settings-export') })
  registry.register({ id: 'settings.import',   label: 'Import Settings',    category: 'Settings', execute: dispatch('varta:settings-import') })
}

// ── App ───────────────────────────────────────────────────────────────────────
function AppInner() {
  const { setSettings } = useSettingsStore()
  const { setPlatform } = useUIStore()
  const { setHasApiKey } = useAIStore()
  const { loadSettings } = useSettings()

  // Global keybinding system
  useKeybinding()

  useEffect(() => {
    registerCommands()
    loadSettings()

    window.varta.ai.hasApiKey().then((res) => {
      if (res.success) { setHasApiKey(res.data) }
    }).catch(() => {})

    const offSettings = window.varta.settings.onChanged((s) => {
      setSettings(s)
      applyTheme(s.workbench.theme)
    })

    const offGit = window.varta.git.onChanged((status) => {
      import('./store/gitStore').then(({ useGitStore }) => {
        useGitStore.getState().setStatus(status)
      })
    })

    return () => { offSettings(); offGit() }
  }, [loadSettings, setSettings, setPlatform, setHasApiKey])

  return (
    <>
      <RootLayout />
      <SettingsPanel />
      <CommandPalette />
      <NotificationContainer />
    </>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}
