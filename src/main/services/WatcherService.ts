import watcher, { AsyncSubscription } from '@parcel/watcher'
import { BrowserWindow }       from 'electron'
import { FileChannel }         from '../../shared/ipc'
import { WatchEvent, WatchEventType } from '../../shared/types/file.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger }              from '../utils/logger'

interface WatchEntry {
  subscriptions: AsyncSubscription[]
}

export class WatcherService {
  private watches = new Map<string, WatchEntry>()
  private mainWindow: BrowserWindow | null = null

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('WatcherService', 'Initialized')
  }

  async destroy(): Promise<void> {
    const ids = Array.from(this.watches.keys())
    for (const id of ids) {
      await this.stopWatch(id).catch((e) => {
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
      const subscriptions: AsyncSubscription[] = []
      
      for (const path of paths) {
        const subscription = await watcher.subscribe(path, (err, events) => {
          if (err) {
            logger.error('WatcherService', `Watcher error [${watchId}]`, err)
            return
          }

          for (const event of events) {
            logger.debug('WatcherService', `Event detected: ${event.type} on ${event.path}`)
            let type: WatchEventType = 'change'
            if (event.type === 'create') type = 'add'
            if (event.type === 'delete') type = 'unlink'
            
            this.pushEvent(watchId, { 
              type, 
              path: event.path, 
              timestamp: Date.now() 
            })
          }
        }, {
          ignore: [
            '.git',
            'node_modules',
            'dist',
            'out',
            'build',
            '.next',
            '.nuxt',
            '.varta', // Varta internal data
          ]
        })
        
        subscriptions.push(subscription)
      }

      this.watches.set(watchId, { subscriptions })
      logger.info('WatcherService', `Started @parcel/watcher [${watchId}] on ${paths.join(', ')}`)
    } catch (e) {
      throw new VartaError(VartaErrorCode.WATCHER_START_FAILED, `Failed to start watcher: ${watchId}`, e)
    }
  }

  // ── Stop watching ─────────────────────────────────────────────────────────

  async stopWatch(watchId: string): Promise<void> {
    const entry = this.watches.get(watchId)
    if (!entry) { return }

    try {
      await Promise.all(entry.subscriptions.map(s => s.unsubscribe()))
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

  private pushEvent(watchId: string, event: WatchEvent): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
    this.mainWindow.webContents.send(FileChannel.WATCH_EVENT, watchId, event)
  }
}

export const watcherService = new WatcherService()
