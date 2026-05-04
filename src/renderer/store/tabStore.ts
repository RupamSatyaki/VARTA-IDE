import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'
import type { EditorTab } from '../../shared/types/editor.types'

const MAX_RECENT = 10

export interface TabState {
  tabs:           EditorTab[]
  activeTabId:    string | null
  recentlyClosed: EditorTab[]
}

export interface TabActions {
  addTab:         (tab: EditorTab) => void
  removeTab:      (id: string) => void
  setActive:      (id: string) => void
  reorderTabs:    (fromIdx: number, toIdx: number) => void
  reopenLast:     () => EditorTab | null
  reset:          () => void
}

const INITIAL: TabState = { tabs: [], activeTabId: null, recentlyClosed: [] }

export const useTabStore = create<TabState & TabActions>()(
  immer((set, get) => ({
    ...INITIAL,

    addTab: (tab) => set((s) => {
      const exists = s.tabs.find((t) => t.filePath === tab.filePath)
      if (!exists) { s.tabs.push(tab) }
      s.activeTabId = exists?.id ?? tab.id
    }),

    removeTab: (id) => set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id)
      if (idx < 0) { return }
      const [removed] = s.tabs.splice(idx, 1)
      s.recentlyClosed.unshift(removed)
      if (s.recentlyClosed.length > MAX_RECENT) { s.recentlyClosed.pop() }
      if (s.activeTabId === id) {
        s.activeTabId = s.tabs[Math.min(idx, s.tabs.length - 1)]?.id ?? null
      }
    }),

    setActive: (id) => set((s) => { s.activeTabId = id }),

    reorderTabs: (fromIdx, toIdx) => set((s) => {
      const [tab] = s.tabs.splice(fromIdx, 1)
      s.tabs.splice(toIdx, 0, tab)
    }),

    reopenLast: () => {
      const { recentlyClosed } = get()
      if (recentlyClosed.length === 0) { return null }
      const tab = recentlyClosed[0]
      set((s) => { s.recentlyClosed.shift() })
      return tab
    },

    reset: () => set(() => ({ ...INITIAL })),
  }))
)
