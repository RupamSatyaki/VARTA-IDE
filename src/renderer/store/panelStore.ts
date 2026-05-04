import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'

export interface PanelState {
  activePanel: string
  panels:      string[]
}

export interface PanelActions {
  setActivePanel: (id: string) => void
  reset:          () => void
}

const INITIAL: PanelState = { activePanel: 'terminal', panels: ['terminal', 'problems', 'output', 'debug'] }

export const usePanelStore = create<PanelState & PanelActions>()(
  immer((set) => ({
    ...INITIAL,
    setActivePanel: (id) => set((s) => { s.activePanel = id }),
    reset:          ()   => set(() => ({ ...INITIAL })),
  }))
)
