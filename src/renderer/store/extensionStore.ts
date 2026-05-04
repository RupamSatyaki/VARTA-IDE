import { create } from 'zustand'
import type { ExtensionInfo } from '../../shared/types/extension.types'

// No immer — Set has same proxy issue as Map with immer

export interface ExtensionState {
  extensions: ExtensionInfo[]
  enabled:    Set<string>
}

export interface ExtensionActions {
  setExtensions: (exts: ExtensionInfo[]) => void
  enable:        (id: string) => void
  disable:       (id: string) => void
  reset:         () => void
}

export const useExtensionStore = create<ExtensionState & ExtensionActions>()((set, get) => ({
  extensions: [],
  enabled:    new Set<string>(),

  setExtensions: (exts) => set({
    extensions: exts,
    enabled:    new Set(exts.filter((e) => e.status === 'enabled').map((e) => e.manifest.id)),
  }),

  enable:  (id) => { const s = new Set(get().enabled); s.add(id);    set({ enabled: s }) },
  disable: (id) => { const s = new Set(get().enabled); s.delete(id); set({ enabled: s }) },
  reset:   ()   => set({ extensions: [], enabled: new Set() }),
}))
