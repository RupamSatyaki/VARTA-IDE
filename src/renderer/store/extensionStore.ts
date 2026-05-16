import { create } from 'zustand'
import type { ExtensionInfo } from '../../shared/types/extension.types'
import { isIPCSuccess } from '../../shared/ipc'
import { registry } from '../lib/commandRegistry'

export interface ExtensionState {
  extensions: ExtensionInfo[]
  enabled:    Set<string>
  isLoading:  boolean
  error:      string | null
}

export interface ExtensionActions {
  fetchExtensions: () => Promise<void>
  processAllContributions: () => void
  enable:        (id: string) => Promise<void>
  disable:       (id: string) => Promise<void>
  uninstall:     (id: string) => Promise<void>
  reload:        (id: string) => Promise<void>
  reset:         () => void
}

export const useExtensionStore = create<ExtensionState & ExtensionActions>()((set, get) => ({
  extensions: [],
  enabled:    new Set<string>(),
  isLoading:  false,
  error:      null,

  fetchExtensions: async () => {
    set({ isLoading: true, error: null })
    const res = await window.varta.extensions.list()
    if (isIPCSuccess(res)) {
      const extensions = res.data
      set({ 
        extensions, 
        enabled: new Set(extensions.filter(e => e.status === 'enabled').map(e => e.manifest.id)),
        isLoading: false 
      })
      get().processAllContributions()
    } else {
      set({ error: res.error.message, isLoading: false })
    }
  },

  processAllContributions: () => {
    const { extensions, enabled } = get()
    
    for (const ext of extensions) {
      if (enabled.has(ext.manifest.id) && ext.manifest.contributes) {
        const { commands } = ext.manifest.contributes
        if (commands) {
          for (const cmd of commands) {
            if (!registry.has(cmd.command)) {
              registry.register({
                id: cmd.command,
                label: cmd.title,
                category: cmd.category || ext.manifest.name,
                execute: async () => {
                  const res = await window.varta.extensions.executeCommand(cmd.command)
                  if (!isIPCSuccess(res)) {
                    console.error(`Failed to execute extension command ${cmd.command}:`, res.error)
                  }
                }
              })
            }
          }
        }
      }
    }
  },

  enable: async (id) => {
    const res = await window.varta.extensions.enable(id)
    if (isIPCSuccess(res)) {
      const s = new Set(get().enabled)
      s.add(id)
      set({ enabled: s })
      await get().fetchExtensions()
    }
  },

  disable: async (id) => {
    const res = await window.varta.extensions.disable(id)
    if (isIPCSuccess(res)) {
      const s = new Set(get().enabled)
      s.delete(id)
      set({ enabled: s })
      await get().fetchExtensions()
    }
  },

  uninstall: async (id) => {
    const res = await window.varta.extensions.uninstall(id)
    if (isIPCSuccess(res)) {
      await get().fetchExtensions()
    }
  },

  reload: async (id) => {
    const res = await window.varta.extensions.reload(id)
    if (isIPCSuccess(res)) {
      await get().fetchExtensions()
    }
  },

  reset: () => set({ extensions: [], enabled: new Set(), isLoading: false, error: null }),
}))

// Listen for contributions changed event from main process
window.varta.extensions.onContributionsChanged(() => {
  useExtensionStore.getState().fetchExtensions()
})
