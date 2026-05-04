import { create } from 'zustand'
import type { FileTreeNode } from '../../shared/types/file.types'

/**
 * IMPORTANT: We do NOT use immer here because immer wraps Set in a Proxy
 * that throws when accessed outside a produce() call during React renders.
 * Plain Zustand with manual spread is safe and fast enough for this store.
 */

export interface FileTreeState {
  rootPath:      string | null
  nodes:         FileTreeNode[]
  expandedPaths: Set<string>
  selectedPath:  string | null
  focusedPath:   string | null
  isLoading:     boolean
}

export interface FileTreeActions {
  setRoot:        (path: string) => void
  setNodes:       (nodes: FileTreeNode[]) => void
  toggleExpanded: (path: string) => void
  setExpanded:    (path: string, expanded: boolean) => void
  setSelected:    (path: string | null) => void
  setFocused:     (path: string | null) => void
  setLoading:     (loading: boolean) => void
  reset:          () => void
}

const INITIAL: FileTreeState = {
  rootPath:      null,
  nodes:         [],
  expandedPaths: new Set<string>(),
  selectedPath:  null,
  focusedPath:   null,
  isLoading:     false,
}

export const useFileTreeStore = create<FileTreeState & FileTreeActions>()((set, get) => ({
  ...INITIAL,

  setRoot: (path) => set({
    rootPath:      path,
    nodes:         [],
    expandedPaths: new Set([path]),
    selectedPath:  null,
  }),

  setNodes: (nodes) => set({ nodes }),

  toggleExpanded: (path) => {
    const prev = get().expandedPaths
    const next = new Set(prev)
    if (next.has(path)) { next.delete(path) } else { next.add(path) }
    set({ expandedPaths: next })
  },

  setExpanded: (path, expanded) => {
    const prev = get().expandedPaths
    const next = new Set(prev)
    if (expanded) { next.add(path) } else { next.delete(path) }
    set({ expandedPaths: next })
  },

  setSelected: (path) => set({ selectedPath: path }),
  setFocused:  (path) => set({ focusedPath: path }),
  setLoading:  (loading) => set({ isLoading: loading }),

  reset: () => set({ ...INITIAL, expandedPaths: new Set<string>() }),
}))
