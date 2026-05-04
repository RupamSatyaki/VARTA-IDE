import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'
import type { VartaTheme } from '../../shared/types/theme.types'

export interface ThemeState {
  themes:      VartaTheme[]
  activeTheme: VartaTheme | null
}

export interface ThemeActions {
  setThemes:      (themes: VartaTheme[]) => void
  setActiveTheme: (theme: VartaTheme | null) => void
  setActiveById:  (id: string) => void
  reset:          () => void
}

const INITIAL: ThemeState = { themes: [], activeTheme: null }

export const useThemeStore = create<ThemeState & ThemeActions>()(
  immer((set, get) => ({
    ...INITIAL,

    setThemes:      (themes) => set((s) => { s.themes = themes }),
    setActiveTheme: (theme)  => set((s) => { s.activeTheme = theme }),

    setActiveById: (id) => set((s) => {
      const found = s.themes.find((t) => t.id === id)
      if (found) { s.activeTheme = found }
    }),

    reset: () => set(() => ({ ...INITIAL })),
  }))
)
