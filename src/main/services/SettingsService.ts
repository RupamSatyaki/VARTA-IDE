import Store          from 'electron-store'
import { BrowserWindow } from 'electron'
import { SettingsChannel } from '../../shared/ipc'
import {
  VartaSettings, SettingsUpdate,
  EditorSettings, TerminalSettings,
  WorkbenchSettings, GitSettings, AISettings,
} from '../../shared/types/settings.types'
import { DEFAULT_SETTINGS } from '../../shared/constants/defaults'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

/** Deep merge: target is overridden by source at leaf level */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[key]
    const tgtVal = target[key]
    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === 'object' &&
      tgtVal !== null
    ) {
      result[key] = deepMerge(tgtVal as object, srcVal as object) as T[keyof T]
    } else if (srcVal !== undefined) {
      result[key] = srcVal as T[keyof T]
    }
  }
  return result
}

interface StoreSchema {
  settings: VartaSettings
  apiKey:   string   // encrypted separately — never sent to renderer
  baseUrl:  string   // custom API base URL — never sent to renderer
}

export class SettingsService {
  private store!: Store<StoreSchema>
  private mainWindow: BrowserWindow | null = null
  private cachedSettings: VartaSettings = DEFAULT_SETTINGS

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow

    this.store = new Store<StoreSchema>({
      name: 'varta-settings',
      encryptionKey: undefined,
      defaults: {
        settings: DEFAULT_SETTINGS,
        apiKey:   '',
        baseUrl:  '',
      },
    })

    // Load and merge with defaults (handles new keys added in updates)
    const saved = this.store.get('settings', DEFAULT_SETTINGS)
    this.cachedSettings = deepMerge(DEFAULT_SETTINGS, saved as Partial<VartaSettings>)

    logger.info('SettingsService', 'Initialized')
  }

  destroy(): void {
    this.mainWindow = null
    logger.info('SettingsService', 'Destroyed')
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  getAll(): VartaSettings {
    return this.cachedSettings
  }

  get<K extends keyof VartaSettings>(key: K): VartaSettings[K] {
    return this.cachedSettings[key]
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  set(update: SettingsUpdate): void {
    try {
      this.cachedSettings = deepMerge(this.cachedSettings, update as Partial<VartaSettings>)
      this.store.set('settings', this.cachedSettings)
      this.pushChangedEvent()
      logger.debug('SettingsService', 'Settings updated', update)
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_WRITE_FAILED, 'Failed to save settings', e)
    }
  }

  reset<K extends keyof VartaSettings>(key: K): void {
    try {
      this.cachedSettings = {
        ...this.cachedSettings,
        [key]: DEFAULT_SETTINGS[key],
      }
      this.store.set('settings', this.cachedSettings)
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_WRITE_FAILED, `Failed to reset setting: ${String(key)}`, e)
    }
  }

  resetAll(): void {
    try {
      this.cachedSettings = { ...DEFAULT_SETTINGS }
      this.store.set('settings', this.cachedSettings)
      this.pushChangedEvent()
      logger.info('SettingsService', 'All settings reset to defaults')
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_WRITE_FAILED, 'Failed to reset all settings', e)
    }
  }

  // ── API Key (encrypted, never sent to renderer) ───────────────────────────

  getApiKey(): string {
    try {
      return this.store.get('apiKey', '')
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_READ_FAILED, 'Failed to read API key', e)
    }
  }

  setApiKey(key: string): void {
    try {
      this.store.set('apiKey', key)
      logger.info('SettingsService', 'API key updated')
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_WRITE_FAILED, 'Failed to save API key', e)
    }
  }

  clearApiKey(): void {
    try {
      this.store.set('apiKey', '')
      logger.info('SettingsService', 'API key cleared')
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_WRITE_FAILED, 'Failed to clear API key', e)
    }
  }

  hasApiKey(): boolean {
    return this.getApiKey().trim().length > 0
  }

  // ── Base URL (never sent to renderer) ─────────────────────────────────────

  getBaseUrl(): string {
    try {
      return this.store.get('baseUrl', '')
    } catch { return '' }
  }

  setBaseUrl(url: string): void {
    try {
      this.store.set('baseUrl', url.trim())
      logger.info('SettingsService', 'Base URL updated')
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_WRITE_FAILED, 'Failed to save base URL', e)
    }
  }

  clearBaseUrl(): void {
    try {
      this.store.set('baseUrl', '')
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_WRITE_FAILED, 'Failed to clear base URL', e)
    }
  }

  hasBaseUrl(): boolean {
    return this.getBaseUrl().trim().length > 0
  }

  // ── Export / Import ───────────────────────────────────────────────────────

  export(): string {
    try {
      // Never include apiKey in export
      const { ...exportable } = this.cachedSettings
      return JSON.stringify(exportable, null, 2)
    } catch (e) {
      throw new VartaError(VartaErrorCode.SETTINGS_EXPORT_FAILED, 'Failed to export settings', e)
    }
  }

  import(json: string): void {
    try {
      const parsed = JSON.parse(json) as Partial<VartaSettings>
      this.set(parsed as SettingsUpdate)
      logger.info('SettingsService', 'Settings imported')
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      throw new VartaError(VartaErrorCode.SETTINGS_IMPORT_FAILED, 'Failed to import settings — invalid JSON', e)
    }
  }

  // ── Push to renderer ──────────────────────────────────────────────────────

  private pushChangedEvent(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
    this.mainWindow.webContents.send(SettingsChannel.CHANGED, this.cachedSettings)
  }
}

export const settingsService = new SettingsService()
