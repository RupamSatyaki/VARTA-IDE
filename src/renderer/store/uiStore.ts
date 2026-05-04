import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'extensions' | 'debug' | 'ai'
export type BottomPanel  = 'terminal' | 'problems' | 'output' | 'debug'

export interface UIState {
  sidebarWidth:         number
  panelHeight:          number
  sidebarVisible:       boolean
  panelVisible:         boolean
  activeSidebarPanel:   SidebarPanel
  activeBottomPanel:    BottomPanel
  commandPaletteOpen:   boolean
  settingsOpen:         boolean
  isMaximized:          boolean
  platform:             string
}

export interface UIActions {
  setSidebarWidth:       (w: number) => void
  setPanelHeight:        (h: number) => void
  toggleSidebar:         () => void
  setSidebarVisible:     (v: boolean) => void
  togglePanel:           () => void
  setPanelVisible:       (v: boolean) => void
  setActiveSidebarPanel: (p: SidebarPanel) => void
  setActiveBottomPanel:  (p: BottomPanel) => void
  openCommandPalette:    () => void
  closeCommandPalette:   () => void
  openSettings:          () => void
  closeSettings:         () => void
  setMaximized:          (v: boolean) => void
  setPlatform:           (p: string) => void
  reset:                 () => void
}

const INITIAL: UIState = {
  sidebarWidth:       240,
  panelHeight:        200,
  sidebarVisible:     true,
  panelVisible:       false,
  activeSidebarPanel: 'explorer',
  activeBottomPanel:  'terminal',
  commandPaletteOpen: false,
  settingsOpen:       false,
  isMaximized:        false,
  platform:           'win32',
}

export const useUIStore = create<UIState & UIActions>()(
  immer((set) => ({
    ...INITIAL,

    setSidebarWidth:       (w) => set((s) => { s.sidebarWidth = Math.max(150, Math.min(600, w)) }),
    setPanelHeight:        (h) => set((s) => { s.panelHeight  = Math.max(80,  Math.min(800, h)) }),
    toggleSidebar:         ()  => set((s) => { s.sidebarVisible = !s.sidebarVisible }),
    setSidebarVisible:     (v) => set((s) => { s.sidebarVisible = v }),
    togglePanel:           ()  => set((s) => { s.panelVisible = !s.panelVisible }),
    setPanelVisible:       (v) => set((s) => { s.panelVisible = v }),
    setActiveSidebarPanel: (p) => set((s) => { s.activeSidebarPanel = p; s.sidebarVisible = true }),
    setActiveBottomPanel:  (p) => set((s) => { s.activeBottomPanel  = p; s.panelVisible   = true }),
    openCommandPalette:    ()  => set((s) => { s.commandPaletteOpen = true }),
    closeCommandPalette:   ()  => set((s) => { s.commandPaletteOpen = false }),
    openSettings:          ()  => set((s) => { s.settingsOpen = true }),
    closeSettings:         ()  => set((s) => { s.settingsOpen = false }),
    setMaximized:          (v) => set((s) => { s.isMaximized = v }),
    setPlatform:           (p) => set((s) => { s.platform = p }),
    reset:                 ()  => set(() => ({ ...INITIAL })),
  }))
)
