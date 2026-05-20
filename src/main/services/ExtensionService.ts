import fsp  from 'fs/promises'
import path  from 'path'
import { app } from 'electron'
import { ExtensionInfo, ExtensionManifest } from '../../shared/types/extension.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'
import { ExtensionHost } from '../extension-host/ExtensionHost'
import { settingsService } from './SettingsService'

export class ExtensionService {
  private extensions = new Map<string, ExtensionInfo>()
  private extensionsDir: string = ''
  private builtinExtensionsDir: string = ''
  private mainWindow: any = null
  private host: ExtensionHost | null = null

  init(mainWindow: any): void {
    this.mainWindow = mainWindow
    this.host = new ExtensionHost(mainWindow, this)
    
    // User installed extensions
    this.extensionsDir = path.join(app.getPath('userData'), 'extensions')
    
    // Built-in extensions
    if (app.isPackaged) {
      this.builtinExtensionsDir = path.join(app.getAppPath(), 'builtin-extensions')
    } else {
      // In dev, we use src/builtin-extensions
      this.builtinExtensionsDir = path.join(process.cwd(), 'src', 'builtin-extensions')
    }

    // Load extensions async — don't block init
    this.loadAll().catch((e) => {
      logger.error('ExtensionService', 'Failed to load extensions', e)
    })
    logger.info('ExtensionService', `Initialized (user: ${this.extensionsDir}, builtin: ${this.builtinExtensionsDir})`)
  }

  destroy(): void {
    this.extensions.clear()
    logger.info('ExtensionService', 'Destroyed')
  }

  // ── Load all installed extensions ─────────────────────────────────────────

  private async loadAll(): Promise<void> {
    try {
      // 1. Load Built-in extensions
      await fsp.mkdir(this.builtinExtensionsDir, { recursive: true })
      const builtinEntries = await fsp.readdir(this.builtinExtensionsDir, { withFileTypes: true })
      for (const entry of builtinEntries) {
        if (!entry.isDirectory()) { continue }
        const extPath = path.join(this.builtinExtensionsDir, entry.name)
        await this.loadExtension(extPath, true).catch((e) => {
          logger.warn('ExtensionService', `Failed to load builtin extension at ${extPath}`, e)
        })
      }

      // 2. Load User extensions
      await fsp.mkdir(this.extensionsDir, { recursive: true })
      const userEntries = await fsp.readdir(this.extensionsDir, { withFileTypes: true })
      for (const entry of userEntries) {
        if (!entry.isDirectory()) { continue }
        const extPath = path.join(this.extensionsDir, entry.name)
        await this.loadExtension(extPath, false).catch((e) => {
          logger.warn('ExtensionService', `Failed to load user extension at ${extPath}`, e)
        })
      }

      logger.info('ExtensionService', `Loaded ${this.extensions.size} extensions`)
      this.notifyContributionsChanged()
    } catch (e) {
      logger.error('ExtensionService', 'Failed to scan extensions directories', e)
    }
  }

  private async loadExtension(extPath: string, isBuiltin: boolean = false): Promise<void> {
    const manifestPath = path.join(extPath, 'package.json')
    try {
      const raw      = await fsp.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(raw) as ExtensionManifest

      // Synthesize ID if missing (common for VS Code extensions)
      if (!manifest.id && manifest.publisher && manifest.name) {
        manifest.id = `${manifest.publisher}.${manifest.name}`
      }

      if (!manifest.id || !manifest.name || !manifest.version) {
        logger.error('ExtensionService', `Invalid manifest at ${extPath}: missing id/publisher, name, or version`)
        throw new VartaError(VartaErrorCode.EXTENSION_INVALID, `Invalid manifest at ${extPath}`)
      }

      // Check if disabled in settings
      const disabledList = settingsService.get('extensions').disabled || []
      const isInitiallyEnabled = !disabledList.includes(manifest.id)

      const info: ExtensionInfo = {
        manifest,
        status:      isInitiallyEnabled ? 'enabled' : 'disabled',
        installPath: extPath,
        installedAt: Date.now(),
        isBuiltin,
      }

      this.extensions.set(manifest.id, info)
      
      if (info.status === 'enabled') {
        this.processContributions(info)
        
        // Auto-activate if it has '*' or global activation events
        const events = manifest.activationEvents || []
        if (events.includes('*') || events.includes('onStartupFinished')) {
          this.activateExtension(manifest.id).catch(e => {
            logger.error('ExtensionService', `Auto-activation failed for ${manifest.id}`, e)
          })
        }
      }
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      throw new VartaError(VartaErrorCode.EXTENSION_LOAD_FAILED, `Failed to load extension: ${extPath}`, e)
    }
  }

  // Triggered from renderer when a file is opened
  triggerActivationEvent(event: string): void {
    logger.info('ExtensionService', `Triggering activation event: ${event}`)
    this.extensions.forEach((info, id) => {
      if (info.status === 'enabled' && info.manifest.activationEvents?.includes(event)) {
        this.activateExtension(id).catch(err => logger.error('ExtensionService', `Failed to activate ${id} for ${event}`, err))
      }
    })
  }

  private themes = new Map<string, any>()

  private commandToExtension = new Map<string, string>()

  private processContributions(info: ExtensionInfo): void {
    const { contributes } = info.manifest
    if (!contributes) return

    logger.info('ExtensionService', `Processing contributions for: ${info.manifest.id}`)
    
    if (contributes.commands) {
      logger.info('ExtensionService', `Found ${contributes.commands.length} commands from ${info.manifest.id}`)
      for (const cmd of contributes.commands) {
        this.commandToExtension.set(cmd.command, info.manifest.id)
      }
    }

    if (contributes.themes) {
      logger.info('ExtensionService', `Found ${contributes.themes.length} themes from ${info.manifest.id}`)
      for (const t of contributes.themes) {
        this.themes.set(t.id, {
          ...t,
          extensionId: info.manifest.id,
          extensionPath: info.installPath
        })
      }
    }
  }

  getThemes(): any[] {
    return Array.from(this.themes.values())
  }

  getOwnerOfCommand(commandId: string): string | undefined {
    return this.commandToExtension.get(commandId)
  }

  async getThemeData(themeId: string): Promise<any> {
    const themeInfo = this.themes.get(themeId)
    if (!themeInfo || !themeInfo.path) return null
    
    try {
      const fullPath = path.isAbsolute(themeInfo.path) 
        ? themeInfo.path 
        : path.join(themeInfo.extensionPath, themeInfo.path)
        
      const raw = await fsp.readFile(fullPath, 'utf-8')
      return JSON.parse(raw)
    } catch (e) {
      logger.error('ExtensionService', `Failed to read theme file for ${themeId}`, e)
      return null
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

    // Update settings if it was in disabled list
    const settings = settingsService.get('extensions')
    const disabled = settings.disabled || []
    if (disabled.includes(id)) {
      settingsService.set({
        extensions: {
          disabled: disabled.filter(d => d !== id)
        }
      })
    }

    this.activateExtension(id).catch(e => logger.error('ExtensionService', `Failed to activate ${id}`, e))
    this.notifyContributionsChanged()
    logger.info('ExtensionService', `Enabled: ${id}`)
  }

  disable(id: string): void {
    const ext = this.getDetails(id)
    ext.status = 'disabled'

    // Update settings
    const settings = settingsService.get('extensions')
    const disabled = settings.disabled || []
    if (!disabled.includes(id)) {
      settingsService.set({
        extensions: {
          disabled: [...disabled, id]
        }
      })
    }

    if (this.host) {
      this.host.deactivate(id).catch(e => logger.error('ExtensionService', `Failed to deactivate ${id}`, e))
    }
    this.notifyContributionsChanged()
    logger.info('ExtensionService', `Disabled: ${id}`)
  }

  async uninstall(id: string): Promise<void> {
    const ext = this.getDetails(id)
    if (ext.isBuiltin) {
      throw new VartaError(VartaErrorCode.EXTENSION_INSTALL_FAILED, `Cannot uninstall built-in extension: ${id}`)
    }

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
    const isBuiltin = ext.isBuiltin ?? false
    this.extensions.delete(id)
    await this.loadExtension(ext.installPath, isBuiltin)
    this.notifyContributionsChanged()
    logger.info('ExtensionService', `Reloaded: ${id}`)
  }

  async reloadAll(): Promise<void> {
    logger.info('ExtensionService', 'Reloading all extensions...')
    this.extensions.clear()
    this.themes.clear()
    this.commandToExtension.clear()
    
    if (this.host) {
      // In a more complex system, we'd deactivate all first
    }
    await this.loadAll()
  }
}

export const extensionService = new ExtensionService()
