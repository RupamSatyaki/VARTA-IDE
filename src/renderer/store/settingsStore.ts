import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'
import type { VartaSettings, SettingsUpdate } from '../../shared/types/settings.types'
import { DEFAULT_SETTINGS } from '../../shared/constants/defaults'

export interface SettingsState {
  settings: VartaSettings
  isLoaded: boolean
}

export interface SettingsActions {
  setSettings: (s: VartaSettings) => void
  update:      (patch: SettingsUpdate) => void
  reset:       () => void
}

const INITIAL: SettingsState = {
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  immer((set) => ({
    ...INITIAL,

    setSettings: (s) => set((st) => { st.settings = s; st.isLoaded = true }),

    update: (patch) => set((st) => {
      for (const key of Object.keys(patch) as (keyof SettingsUpdate)[]) {
        const val = patch[key]
        if (val && typeof val === 'object') {
          Object.assign(st.settings[key] as object, val)
        }
      }
    }),

    reset: () => set(() => ({ ...INITIAL })),
  }))
)
