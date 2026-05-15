import { create } from 'zustand'
import { useUIStore } from './uiStore'
import { useTabStore } from './tabStore'
import { useEditorStore } from './editorStore'
import { useFileTreeStore } from './fileTreeStore'
import { isIPCSuccess } from '../../shared/ipc'
import { WorkspaceSession, WorkspaceLayout, WorkspaceTabs, WorkspaceExplorer } from '../../shared/types/workspace.types'

export interface WorkspaceState {
  currentProjectPath: string | null
  isRestoring: boolean
}

export interface WorkspaceActions {
  initialize: () => Promise<void>
  loadProject: (path: string) => Promise<void>
  saveLayout: () => Promise<void>
  saveTabs: () => Promise<void>
  saveExplorer: () => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()((set, get) => ({
  currentProjectPath: null,
  isRestoring: false,

  initialize: async () => {
    const res = await window.varta.workspace.getLastProjectPath()
    if (isIPCSuccess(res) && res.data) {
      await get().loadProject(res.data)
    }
  },

  loadProject: async (path: string) => {
    set({ isRestoring: true, currentProjectPath: path })

    const res = await window.varta.workspace.loadSession(path)
    if (isIPCSuccess(res)) {
      const session = res.data

      // 1. Restore File Tree (Root)
      if (session.projectPath) {
        const ft = useFileTreeStore.getState()
        ft.setRoot(session.projectPath)
        
        // Load root nodes
        const rootRes = await window.varta.fs.readDir({
          path: session.projectPath,
          recursive: false,
          showHidden: true,
        })
        if (isIPCSuccess(rootRes)) {
          ft.setNodes(rootRes.data)
        }
      }

      // 2. Restore Layout
      if (session.layout) {
        const ui = useUIStore.getState()
        ui.setSidebarWidth(session.layout.sidebarWidth || 240)
        ui.setPanelHeight(session.layout.panelHeight || 200)
        ui.setSecondarySidebarWidth(session.layout.secondarySidebarWidth || 320)
        ui.setSidebarVisible(!!session.layout.sidebarVisible)
        ui.setPanelVisible(!!session.layout.panelVisible)
        ui.setSecondarySidebarVisible(!!session.layout.secondarySidebarVisible)
        if (session.layout.activeSidebarPanel) {
          ui.setActiveSidebarPanel(session.layout.activeSidebarPanel as any)
        }
        if (session.layout.activeBottomPanel) {
          ui.setActiveBottomPanel(session.layout.activeBottomPanel as any)
        }
      }

      // 3. Restore Tabs
      if (session.tabs) {
        const tabs = useTabStore.getState()
        const editor = useEditorStore.getState()
        const { contentCache } = await import('../hooks/useEditor')
        
        // 1. Prepare contents for the active tab first (high priority)
        const activeTabId = session.tabs.activeTabId
        const activeTab = session.tabs.tabs.find(t => t.id === activeTabId)
        
        if (activeTab && activeTab.filePath !== 'untitled') {
          const res = await window.varta.fs.readFile(activeTab.filePath)
          if (isIPCSuccess(res)) {
            contentCache.set(activeTab.id, res.data.content)
          }
        }

        // 2. Now populate stores (this will trigger UI updates)
        tabs.reset()
        editor.reset()
        
        session.tabs.tabs.forEach(t => {
          tabs.addTab(t)
          editor.openTab(t)
        })
        
        // 3. Set the active tab explicitly
        if (activeTabId) {
          tabs.setActive(activeTabId)
          editor.setActiveTab(activeTabId)
        }

        // 4. Background load remaining tabs
        session.tabs.tabs.forEach(async (t) => {
          if (t.id === activeTabId || t.filePath === 'untitled') return
          const res = await window.varta.fs.readFile(t.filePath)
          if (isIPCSuccess(res)) {
            contentCache.set(t.id, res.data.content)
            // CodeCanvas useEffect will pick this up if the tab is already visible
          }
        })
      }

      // 4. Restore Explorer (Expanded Paths)
      if (session.explorer) {
        const ft = useFileTreeStore.getState()
        session.explorer.expandedPaths.forEach(p => ft.setExpanded(p, true))
      }

      // 5. Initialize Git
      window.varta.git.openRepo(path).catch((e) => {
        console.error('[Workspace] Failed to open git repo:', e)
      })
    }

    await window.varta.workspace.saveLastProjectPath(path)
    set({ isRestoring: false })
  },

  saveLayout: async () => {
    const { currentProjectPath } = get()
    if (!currentProjectPath) return

    const ui = useUIStore.getState()
    const layout: WorkspaceLayout = {
      sidebarWidth: ui.sidebarWidth,
      panelHeight: ui.panelHeight,
      secondarySidebarWidth: ui.secondarySidebarWidth,
      sidebarVisible: ui.sidebarVisible,
      panelVisible: ui.panelVisible,
      secondarySidebarVisible: ui.secondarySidebarVisible,
      activeSidebarPanel: ui.activeSidebarPanel as any,
      activeBottomPanel: ui.activeBottomPanel as any,
    }
    await window.varta.workspace.saveLayout(currentProjectPath, layout)
  },

  saveTabs: async () => {
    const { currentProjectPath } = get()
    if (!currentProjectPath) return

    const tabs = useTabStore.getState()
    const data: WorkspaceTabs = {
      tabs: tabs.tabs,
      activeTabId: tabs.activeTabId,
    }
    await window.varta.workspace.saveTabs(currentProjectPath, data)
  },

  saveExplorer: async () => {
    const { currentProjectPath } = get()
    if (!currentProjectPath) return

    const ft = useFileTreeStore.getState()
    const data: WorkspaceExplorer = {
      expandedPaths: Array.from(ft.expandedPaths),
    }
    await window.varta.workspace.saveExplorer(currentProjectPath, data)
  },
}))

// ── Auto-save Subscriptions ──────────────────────────────────────────────────

let debounceTimer: any = null
const debounce = (fn: () => void, delay: number) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fn, delay)
}

// UI Layout changes
useUIStore.subscribe((state, prevState) => {
  if (useWorkspaceStore.getState().isRestoring) return
  // Only save if relevant layout properties changed
  if (
    state.sidebarWidth !== prevState.sidebarWidth ||
    state.panelHeight !== prevState.panelHeight ||
    state.secondarySidebarWidth !== prevState.secondarySidebarWidth ||
    state.sidebarVisible !== prevState.sidebarVisible ||
    state.panelVisible !== prevState.panelVisible ||
    state.secondarySidebarVisible !== prevState.secondarySidebarVisible ||
    state.activeSidebarPanel !== prevState.activeSidebarPanel ||
    state.activeBottomPanel !== prevState.activeBottomPanel
  ) {
    debounce(() => useWorkspaceStore.getState().saveLayout(), 1000)
  }
})

// Tab changes
useTabStore.subscribe((state, prevState) => {
  if (useWorkspaceStore.getState().isRestoring) return
  if (state.tabs !== prevState.tabs || state.activeTabId !== prevState.activeTabId) {
    debounce(() => useWorkspaceStore.getState().saveTabs(), 1000)
  }
})

// Explorer changes
useFileTreeStore.subscribe((state, prevState) => {
  if (useWorkspaceStore.getState().isRestoring) return
  if (state.expandedPaths !== prevState.expandedPaths) {
    debounce(() => useWorkspaceStore.getState().saveExplorer(), 2000)
  }
})
