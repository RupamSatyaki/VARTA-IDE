import chokidar, { FSWatcher } from 'chokidar'
import { BrowserWindow }       from 'electron'
import { FileChannel }         from '../../shared/ipc'
import { WatchEvent }          from '../../shared/types/file.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger }              from '../utils/logger'

const DEBOUNCE_MS = 100

interface WatchEntry {
  watcher:   FSWatcher
  paths:     Set<string>
  timers:    Map<string, ReturnType<typeof setTimeout>>
}

export class WatcherService {
  private watches = new Map<string, WatchEntry>()
  private mainWindow: BrowserWindow | null = null

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('WatcherService', 'Initialized')
  }

  destroy(): void {
    for (const [id] of this.watches) {
      this.stopWatch(id).catch((e) => {
        logger.error('WatcherService', `Error stopping watcher ${id}`, e)
      })
    }
    this.watches.clear()
    this.mainWindow = null
    logger.info('WatcherService', 'Destroyed')
  }

  // ── Start watching ────────────────────────────────────────────────────────

  async startWatch(watchId: string, paths: string[]): Promise<void> {
    if (this.watches.has(watchId)) {
      await this.stopWatch(watchId)
    }

    try {
      const entry: WatchEntry = {
        watcher: chokidar.watch(paths, {
          persistent:        true,
          ignoreInitial:     true,
          followSymlinks:    false,
          depth:             undefined,
          awaitWriteFinish:  { stabilityThreshold: 80, pollInterval: 50 },
          ignored: [
            /(^|[/\\])\../,           // dotfiles
            /node_modules/,
            /\.git[/\\]/,
            /dist[/\\]/,
            /out[/\\]/,
            /build[/\\]/,
            /\.next[/\\]/,
            /\.nuxt[/\\]/,
          ],
        }),
        paths:  new Set(paths),
        timers: new Map(),
      }

      const emit = (type: WatchEvent['type'], filePath: string) => {
        this.debouncedEmit(entry, watchId, type, filePath)
      }

      entry.watcher
        .on('add',       (p) => emit('add',       p))
        .on('change',    (p) => emit('change',    p))
        .on('unlink',    (p) => emit('unlink',    p))
        .on('addDir',    (p) => emit('addDir',    p))
        .on('unlinkDir', (p) => emit('unlinkDir', p))
        .on('error',     (err) => {
          logger.error('WatcherService', `Watcher error [${watchId}]`, err)
        })

      this.watches.set(watchId, entry)
      logger.info('WatcherService', `Started watch [${watchId}] on ${paths.join(', ')}`)
    } catch (e) {
      throw new VartaError(VartaErrorCode.WATCHER_START_FAILED, `Failed to start watcher: ${watchId}`, e)
    }
  }

  // ── Stop watching ─────────────────────────────────────────────────────────

  async stopWatch(watchId: string): Promise<void> {
    const entry = this.watches.get(watchId)
    if (!entry) { return }

    // Clear all pending debounce timers
    for (const timer of entry.timers.values()) {
      clearTimeout(timer)
    }
    entry.timers.clear()

    try {
      await entry.watcher.close()
    } catch (e) {
      throw new VartaError(VartaErrorCode.WATCHER_STOP_FAILED, `Failed to stop watcher: ${watchId}`, e)
    } finally {
      this.watches.delete(watchId)
      logger.info('WatcherService', `Stopped watch [${watchId}]`)
    }
  }

  isWatching(watchId: string): boolean {
    return this.watches.has(watchId)
  }

  // ── Debounced emit ────────────────────────────────────────────────────────

  private debouncedEmit(
    entry:   WatchEntry,
    watchId: string,
    type:    WatchEvent['type'],
    filePath: string,
  ): void {
    const key = `${type}:${filePath}`

    const existing = entry.timers.get(key)
    if (existing) { clearTimeout(existing) }

    const timer = setTimeout(() => {
      entry.timers.delete(key)
      this.pushEvent(watchId, { type, path: filePath, timestamp: Date.now() })
    }, DEBOUNCE_MS)

    entry.timers.set(key, timer)
  }

  private pushEvent(watchId: string, event: WatchEvent): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
    this.mainWindow.webContents.send(FileChannel.WATCH_EVENT, watchId, event)
  }
}

export const watcherService = new WatcherService()
