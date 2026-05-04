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

  /**
   * FIX 6: Search streams results via PROGRESS channel as files are found.
   * Returns { started: true } immediately — renderer listens to onProgress.
   * Final complete result is sent via PROGRESS with a `done: true` flag.
   */
  ipcMain.handle(SearchChannel.FIND_IN_FILES, async (event, rootPath: string, query: SearchQuery) => {
    try {
      // Fire-and-forget — results stream via PROGRESS channel
      searchService.findInFiles(rootPath, query, event.sender)
        .then((result) => {
          // Send final complete result
          if (!event.sender.isDestroyed()) {
            event.sender.send(SearchChannel.PROGRESS, {
              ...result,
              done: true,
            })
          }
        })
        .catch((e) => {
          const err = VartaError.from(e, VartaErrorCode.SEARCH_FAILED)
          if (!event.sender.isDestroyed()) {
            event.sender.send(SearchChannel.PROGRESS, {
              done:  true,
              error: err.toPayload(),
            })
          }
        })

      return ipcOk({ started: true })
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
