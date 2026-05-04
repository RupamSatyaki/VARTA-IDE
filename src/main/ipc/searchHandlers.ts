import { ipcMain }     from 'electron'
import { SearchChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode }   from '../../shared/errors'
import { searchService }                from '../services/SearchService'
import { logger }                       from '../utils/logger'
import type { SearchQuery, ReplaceQuery } from '../../shared/types/search.types'

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerSearchHandlers(): void {

  ipcMain.handle(SearchChannel.FIND_IN_FILES, async (_e, rootPath: string, query: SearchQuery) => {
    try {
      const result = await searchService.findInFiles(rootPath, query)
      return ipcOk(result)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SearchChannel.REPLACE_IN_FILES, async (_e, rootPath: string, query: ReplaceQuery) => {
    try {
      const result = await searchService.replaceInFiles(rootPath, query)
      return ipcOk(result)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SearchChannel.CANCEL, () => {
    try {
      searchService.cancel()
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  logger.info('IPC', 'Search handlers registered')
}

export function removeSearchHandlers(): void {
  const channels = [
    SearchChannel.FIND_IN_FILES,
    SearchChannel.REPLACE_IN_FILES,
    SearchChannel.CANCEL,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
