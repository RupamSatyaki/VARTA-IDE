import fsp  from 'fs/promises'
import path  from 'path'
import { app } from 'electron'
import { ExtensionInfo, ExtensionManifest, ExtensionStatus } from '../../shared/types/extension.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

export class ExtensionService {
  private extensions = new Map<string, ExtensionInfo>()
  private extensionsDir: string = ''

  init(): void {
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
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      throw new VartaError(VartaErrorCode.EXTENSION_LOAD_FAILED, `Failed to load extension: ${extPath}`, e)
    }
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
    logger.info('ExtensionService', `Enabled: ${id}`)
  }

  disable(id: string): void {
    const ext = this.getDetails(id)
    ext.status = 'disabled'
    logger.info('ExtensionService', `Disabled: ${id}`)
  }

  async uninstall(id: string): Promise<void> {
    const ext = this.getDetails(id)
    try {
      await fsp.rm(ext.installPath, { recursive: true, force: true })
      this.extensions.delete(id)
      logger.info('ExtensionService', `Uninstalled: ${id}`)
    } catch (e) {
      throw new VartaError(VartaErrorCode.EXTENSION_INSTALL_FAILED, `Failed to uninstall: ${id}`, e)
    }
  }

  async reload(id: string): Promise<void> {
    const ext = this.getDetails(id)
    this.extensions.delete(id)
    await this.loadExtension(ext.installPath)
    logger.info('ExtensionService', `Reloaded: ${id}`)
  }
}

export const extensionService = new ExtensionService()
