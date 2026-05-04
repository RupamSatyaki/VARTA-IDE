import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'
import type { EditorTab, EditorGroup, EditorLayout } from '../../shared/types/editor.types'

// Cursor state saved per tab before switching away
export interface CursorState {
  position:  { lineNumber: number; column: number } | null
  scrollTop: number
}

export interface EditorState {
  groups:        EditorGroup[]
  activeGroupId: string | null
  layout:        EditorLayout
  // Map<tabId, CursorState> — plain object so immer handles it fine
  cursorStates:  Record<string, CursorState>
  // Callbacks fired when Monaco editor mounts for a tab
  editorReadyCallbacks: Record<string, (editor: unknown) => void>
}

export interface EditorActions {
  openTab:          (tab: EditorTab, groupId?: string) => void
  closeTab:         (tabId: string, groupId?: string) => void
  setActiveTab:     (tabId: string, groupId?: string) => void
  markTabDirty:     (tabId: string, dirty: boolean) => void
  pinTab:           (tabId: string) => void
  splitEditor:      (direction: 'horizontal' | 'vertical') => void
  setLayout:        (layout: EditorLayout) => void
  getActiveTab:     () => EditorTab | null
  getActiveGroup:   () => EditorGroup | null
  // Cursor state
  saveCursorState:  (tabId: string, state: CursorState) => void
  getCursorState:   (tabId: string) => CursorState | null
  // Editor ready callbacks (for search result navigation)
  onEditorReady:    (tabId: string, cb: (editor: unknown) => void) => void
  fireEditorReady:  (tabId: string, editor: unknown) => void
  clearCallback:    (tabId: string) => void
  reset:            () => void
}

const INITIAL_GROUP: EditorGroup = { id: 'group-1', tabs: [], activeTabId: null }

const INITIAL: EditorState = {
  groups:        [INITIAL_GROUP],
  activeGroupId: 'group-1',
  layout:        'single',
  cursorStates:  {},
  editorReadyCallbacks: {},
}

export const useEditorStore = create<EditorState & EditorActions>()(
  immer((set, get) => ({
    ...INITIAL,

    openTab: (tab, groupId) => set((s) => {
      const gid   = groupId ?? s.activeGroupId ?? s.groups[0]?.id
      const group = s.groups.find((g) => g.id === gid)
      if (!group) { return }
      const existing = group.tabs.findIndex((t) => t.filePath === tab.filePath)
      if (existing >= 0) {
        group.activeTabId = group.tabs[existing].id
      } else {
        const previewIdx = group.tabs.findIndex((t) => t.isPreview)
        if (previewIdx >= 0) { group.tabs.splice(previewIdx, 1, tab) }
        else { group.tabs.push(tab) }
        group.activeTabId = tab.id
      }
      s.activeGroupId = gid
    }),

    closeTab: (tabId, groupId) => set((s) => {
      const gid   = groupId ?? s.activeGroupId
      const group = s.groups.find((g) => g.id === gid)
      if (!group) { return }
      const idx = group.tabs.findIndex((t) => t.id === tabId)
      if (idx < 0) { return }
      group.tabs.splice(idx, 1)
      if (group.activeTabId === tabId) {
        group.activeTabId = group.tabs[Math.min(idx, group.tabs.length - 1)]?.id ?? null
      }
      delete s.cursorStates[tabId]
    }),

    setActiveTab: (tabId, groupId) => set((s) => {
      const gid   = groupId ?? s.activeGroupId
      const group = s.groups.find((g) => g.id === gid)
      if (group) { group.activeTabId = tabId; s.activeGroupId = gid }
    }),

    markTabDirty: (tabId, dirty) => set((s) => {
      for (const g of s.groups) {
        const tab = g.tabs.find((t) => t.id === tabId)
        if (tab) { tab.isDirty = dirty; break }
      }
    }),

    pinTab: (tabId) => set((s) => {
      for (const g of s.groups) {
        const tab = g.tabs.find((t) => t.id === tabId)
        if (tab) { tab.isPinned = !tab.isPinned; break }
      }
    }),

    splitEditor: (direction) => set((s) => {
      const newGroup: EditorGroup = {
        id:          `group-${Date.now()}`,
        tabs:        [],
        activeTabId: null,
      }
      s.groups.push(newGroup)
      s.layout = direction === 'horizontal' ? 'split-horizontal' : 'split-vertical'
      s.activeGroupId = newGroup.id
    }),

    setLayout: (layout) => set((s) => { s.layout = layout }),

    getActiveTab: () => {
      const s = get()
      const group = s.groups.find((g) => g.id === s.activeGroupId)
      return group?.tabs.find((t) => t.id === group.activeTabId) ?? null
    },

    getActiveGroup: () => {
      const s = get()
      return s.groups.find((g) => g.id === s.activeGroupId) ?? null
    },

    saveCursorState: (tabId, state) => set((s) => {
      s.cursorStates[tabId] = state
    }),

    getCursorState: (tabId) => {
      return get().cursorStates[tabId] ?? null
    },

    onEditorReady: (tabId, cb) => set((s) => {
      s.editorReadyCallbacks[tabId] = cb
    }),

    fireEditorReady: (tabId, editor) => {
      const cb = get().editorReadyCallbacks[tabId]
      if (cb) {
        cb(editor)
        set((s) => { delete s.editorReadyCallbacks[tabId] })
      }
    },

    clearCallback: (tabId) => set((s) => {
      delete s.editorReadyCallbacks[tabId]
    }),

    reset: () => set(() => ({
      ...INITIAL,
      groups:               [{ ...INITIAL_GROUP, tabs: [] }],
      cursorStates:         {},
      editorReadyCallbacks: {},
    })),
  }))
)
