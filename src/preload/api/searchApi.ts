import { ipcRenderer }  from 'electron'
import { SearchChannel } from '../../shared/ipc'
import type {
  SearchQuery, ReplaceQuery,
  SearchResult, ReplaceResult, SearchProgressEvent,
} from '../../shared/types/search.types'
import type { IPCResponse } from '../../shared/ipc'

export const searchApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  findInFiles: (rootPath: string, query: SearchQuery): Promise<IPCResponse<SearchResult>> =>
    ipcRenderer.invoke(SearchChannel.FIND_IN_FILES, rootPath, query),

  replaceInFiles: (rootPath: string, query: ReplaceQuery): Promise<IPCResponse<ReplaceResult>> =>
    ipcRenderer.invoke(SearchChannel.REPLACE_IN_FILES, rootPath, query),

  cancel: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(SearchChannel.CANCEL),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for search progress events pushed from main during a long search.
   * @returns cleanup function
   */
  onProgress: (cb: (event: SearchProgressEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: SearchProgressEvent) => cb(event)
    ipcRenderer.on(SearchChannel.PROGRESS, handler)
    return () => ipcRenderer.off(SearchChannel.PROGRESS, handler)
  },
}

export type SearchAPI = typeof searchApi
