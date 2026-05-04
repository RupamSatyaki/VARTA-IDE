import { create } from 'zustand'
import type { TerminalInstance } from '../../shared/types/terminal.types'

/**
 * NO immer here — immer wraps Map in a Proxy that breaks .set()/.delete()
 * outside a produce() call. Plain Zustand with new Map() copies is correct.
 */

export interface TerminalState {
  instances:        Map<string, TerminalInstance>
  activeTerminalId: string | null
}

export interface TerminalActions {
  addInstance:    (instance: TerminalInstance) => void
  removeInstance: (id: string) => void
  setActive:      (id: string) => void
  updateInstance: (id: string, patch: Partial<TerminalInstance>) => void
  reset:          () => void
}

export const useTerminalStore = create<TerminalState & TerminalActions>()((set, get) => ({
  instances:        new Map<string, TerminalInstance>(),
  activeTerminalId: null,

  addInstance: (instance) => {
    const next = new Map(get().instances)
    next.set(instance.id, instance)
    set({ instances: next, activeTerminalId: instance.id })
  },

  removeInstance: (id) => {
    const next = new Map(get().instances)
    next.delete(id)
    const remaining = Array.from(next.keys())
    const activeTerminalId = get().activeTerminalId === id
      ? (remaining[remaining.length - 1] ?? null)
      : get().activeTerminalId
    set({ instances: next, activeTerminalId })
  },

  setActive: (id) => set({ activeTerminalId: id }),

  updateInstance: (id, patch) => {
    const next = new Map(get().instances)
    const inst = next.get(id)
    if (inst) { next.set(id, { ...inst, ...patch }) }
    set({ instances: next })
  },

  reset: () => set({ instances: new Map(), activeTerminalId: null }),
}))
