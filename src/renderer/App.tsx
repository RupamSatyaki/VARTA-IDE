import React, { useEffect, Component, type ReactNode } from 'react'
import { RootLayout }       from './components/layout/RootLayout'
import { SettingsPanel }    from './components/settings/SettingsPanel'
import { useSettingsStore } from './store/settingsStore'
import { useUIStore }       from './store/uiStore'
import { useAIStore }       from './store/aiStore'
import { useSettings, applyTheme } from './hooks/useSettings'

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

// ── App ───────────────────────────────────────────────────────────────────────
function AppInner() {
  const { setSettings } = useSettingsStore()
  const { setPlatform, openSettings, closeSettings } = useUIStore()
  const { setHasApiKey } = useAIStore()
  const { loadSettings } = useSettings()

  useEffect(() => {
    // 1. Load settings + apply theme
    loadSettings()

    // 2. Check AI key
    window.varta.ai.hasApiKey().then((res) => {
      if (res.success) { setHasApiKey(res.data) }
    }).catch(() => {})

    // 3. Listen for settings changes pushed from main
    const offSettings = window.varta.settings.onChanged((s) => {
      setSettings(s)
      applyTheme(s.workbench.theme)
    })

    // 4. Listen for git changes pushed from main
    const offGit = window.varta.git.onChanged((status) => {
      import('./store/gitStore').then(({ useGitStore }) => {
        useGitStore.getState().setStatus(status)
      })
    })

    // 5. Global keyboard shortcuts
    const handleKey = (e: KeyboardEvent) => {
      const ui = useUIStore.getState()

      // Ctrl+Shift+P → command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault(); ui.openCommandPalette()
      }
      // Ctrl+, → settings
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === ',') {
        e.preventDefault()
        if (ui.settingsOpen) { ui.closeSettings() } else { ui.openSettings() }
      }
      // Ctrl+B → sidebar
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'b') {
        e.preventDefault(); ui.toggleSidebar()
      }
      // Ctrl+J → panel
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'j') {
        e.preventDefault(); ui.togglePanel()
      }
      // Ctrl+Shift+F → search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        ui.setActiveSidebarPanel('search')
        setTimeout(() => window.dispatchEvent(new CustomEvent('varta:focus-search')), 50)
      }
      // Ctrl+Shift+G → git
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault(); ui.setActiveSidebarPanel('git')
      }
      // Ctrl+` → terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault()
        ui.setActiveBottomPanel('terminal')
        ui.setPanelVisible(true)
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      offSettings()
      offGit()
      window.removeEventListener('keydown', handleKey)
    }
  }, [loadSettings, setSettings, setPlatform, setHasApiKey])

  return (
    <>
      <RootLayout />
      <SettingsPanel />
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
