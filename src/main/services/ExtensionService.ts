import fsp  from 'fs/promises'
import path  from 'path'
import { app } from 'electron'
import { ExtensionInfo, ExtensionManifest } from '../../shared/types/extension.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'
import { ExtensionHost } from '../extension-host/ExtensionHost'

export class ExtensionService {
  private extensions = new Map<string, ExtensionInfo>()
  private extensionsDir: string = ''
  private mainWindow: any = null
  private host: ExtensionHost | null = null

  init(mainWindow: any): void {
    this.mainWindow = mainWindow
    this.host = new ExtensionHost(mainWindow)
    this.extensionsDir = path.join(app.getPath('userData'), 'extensions')
    // Load extensions async — don't block init
    this.loadAll().catch((e) => {
      logger.error('ExtensionService', 'Failed to load extensions', e)
    })
    logger.info('ExtensionService', `Initialized (dir: ${this.extensionsDir})`)
  }

  destroy(): void {
    this.extensions.clear()
    logger.info('ExtensionService', 'Destroyed')
  }

  // ── Load all installed extensions ─────────────────────────────────────────

  private async loadAll(): Promise<void> {
    try {
      await fsp.mkdir(this.extensionsDir, { recursive: true })
      const entries = await fsp.readdir(this.extensionsDir, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isDirectory()) { continue }
        const extPath = path.join(this.extensionsDir, entry.name)
        await this.loadExtension(extPath).catch((e) => {
          logger.warn('ExtensionService', `Failed to load extension at ${extPath}`, e)
        })
      }

      logger.info('ExtensionService', `Loaded ${this.extensions.size} extensions`)
      this.notifyContributionsChanged()
    } catch (e) {
      logger.error('ExtensionService', 'Failed to scan extensions directory', e)
    }
  }

  private async loadExtension(extPath: string): Promise<void> {
    const manifestPath = path.join(extPath, 'package.json')
    try {
      const raw      = await fsp.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(raw) as ExtensionManifest

      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new VartaError(VartaErrorCode.EXTENSION_INVALID, `Invalid manifest at ${extPath}`)
      }

      const info: ExtensionInfo = {
        manifest,
        status:      'enabled',
        installPath: extPath,
        installedAt: Date.now(),
      }

      this.extensions.set(manifest.id, info)
      
      if (info.status === 'enabled') {
        this.processContributions(info)
        // Activation happens after loadAll to ensure mainWindow is ready
        this.activateExtension(info.manifest.id).catch(e => {
          logger.error('ExtensionService', `Auto-activation failed for ${info.manifest.id}`, e)
        })
      }
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      throw new VartaError(VartaErrorCode.EXTENSION_LOAD_FAILED, `Failed to load extension: ${extPath}`, e)
    }
  }

  private processContributions(info: ExtensionInfo): void {
    const { contributes } = info.manifest
    if (!contributes) return

    logger.info('ExtensionService', `Processing contributions for: ${info.manifest.id}`)
    
    if (contributes.commands) {
      logger.info('ExtensionService', `Found ${contributes.commands.length} commands from ${info.manifest.id}`)
    }

    if (contributes.themes) {
      logger.info('ExtensionService', `Found ${contributes.themes.length} themes from ${info.manifest.id}`)
    }
  }

  private notifyContributionsChanged(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('EXTENSION:CONTRIBUTIONS_CHANGED')
    }
  }

  async activateExtension(id: string): Promise<void> {
    const ext = this.extensions.get(id)
    if (ext && ext.status === 'enabled' && this.host) {
      await this.host.activate(ext)
    }
  }

  async executeCommand(id: string, ...args: any[]): Promise<any> {
    if (this.host) {
      return await this.host.executeCommand(id, ...args)
    }
    throw new Error('Extension host not initialized')
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  list(): ExtensionInfo[] {
    return Array.from(this.extensions.values())
  }

  getDetails(id: string): ExtensionInfo {
    const ext = this.extensions.get(id)
    if (!ext) {
      throw new VartaError(VartaErrorCode.EXTENSION_NOT_FOUND, `Extension not found: ${id}`)
    }
    return ext
  }

  enable(id: string): void {
    const ext = this.getDetails(id)
    ext.status = 'enabled'
    this.activateExtension(id).catch(e => logger.error('ExtensionService', `Failed to activate ${id}`, e))
    this.notifyContributionsChanged()
    logger.info('ExtensionService', `Enabled: ${id}`)
  }

  disable(id: string): void {
    const ext = this.getDetails(id)
    ext.status = 'disabled'
    if (this.host) {
      this.host.deactivate(id).catch(e => logger.error('ExtensionService', `Failed to deactivate ${id}`, e))
    }
    this.notifyContributionsChanged()
    logger.info('ExtensionService', `Disabled: ${id}`)
  }

  async uninstall(id: string): Promise<void> {
    const ext = this.getDetails(id)
    try {
      if (this.host) {
        await this.host.deactivate(id)
      }
      await fsp.rm(ext.installPath, { recursive: true, force: true })
      this.extensions.delete(id)
      this.notifyContributionsChanged()
      logger.info('ExtensionService', `Uninstalled: ${id}`)
    } catch (e) {
      throw new VartaError(VartaErrorCode.EXTENSION_INSTALL_FAILED, `Failed to uninstall: ${id}`, e)
    }
  }

  async reload(id: string): Promise<void> {
    const ext = this.getDetails(id)
    if (this.host) {
      await this.host.deactivate(id)
    }
    this.extensions.delete(id)
    await this.loadExtension(ext.installPath)
    this.notifyContributionsChanged()
    logger.info('ExtensionService', `Reloaded: ${id}`)
  }

  async reloadAll(): Promise<void> {
    logger.info('ExtensionService', 'Reloading all extensions...')
    this.extensions.clear()
    if (this.host) {
      // In a more complex system, we'd deactivate all first
    }
    await this.loadAll()
  }
}

export const extensionService = new ExtensionService()
