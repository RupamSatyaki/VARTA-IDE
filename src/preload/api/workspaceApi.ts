import { ipcRenderer } from 'electron'
import { WorkspaceChannel, IPCResponse } from '../../shared/ipc'
import {
  WorkspaceLayout, WorkspaceTabs, WorkspaceExplorer,
  WorkspaceSession
} from '../../shared/types/workspace.types'

export const workspaceApi = {
  getLastProjectPath: (): Promise<IPCResponse<string | null>> =>
    ipcRenderer.invoke(WorkspaceChannel.GET_LAST_PATH),

  saveLastProjectPath: (path: string | null): Promise<IPCResponse<void>> =>
    ipcRenderer.invoke(WorkspaceChannel.SAVE_LAST_PATH, path),

  loadSession: (path: string): Promise<IPCResponse<WorkspaceSession>> =>
    ipcRenderer.invoke(WorkspaceChannel.LOAD_SESSION, path),

  saveLayout: (path: string, layout: WorkspaceLayout): Promise<IPCResponse<void>> =>
    ipcRenderer.invoke(WorkspaceChannel.SAVE_LAYOUT, { path, layout }),

  saveTabs: (path: string, tabs: WorkspaceTabs): Promise<IPCResponse<void>> =>
    ipcRenderer.invoke(WorkspaceChannel.SAVE_TABS, { path, tabs }),

  saveExplorer: (path: string, explorer: WorkspaceExplorer): Promise<IPCResponse<void>> =>
    ipcRenderer.invoke(WorkspaceChannel.SAVE_EXPLORER, { path, explorer }),

  setActiveFile: (path: string | null): Promise<IPCResponse<void>> =>
    ipcRenderer.invoke(WorkspaceChannel.SET_ACTIVE_FILE, path),

  setProjectRoot: (path: string | null): Promise<IPCResponse<void>> =>
    ipcRenderer.invoke(WorkspaceChannel.SET_PROJECT_ROOT, path),
}

export type WorkspaceAPI = typeof workspaceApi
