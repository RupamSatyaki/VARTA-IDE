import { ipcMain }    from 'electron'
import fsp            from 'fs/promises'
import path           from 'path'
import { app }        from 'electron'
import { ThemeChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode }  from '../../shared/errors'
import { settingsService }             from '../services/SettingsService'
import { logger }                      from '../utils/logger'
import type { VartaTheme }             from '../../shared/types/theme.types'

// Built-in themes are bundled in resources/themes/
const BUILTIN_THEMES_DIR = path.join(__dirname, '../../resources/themes')
const USER_THEMES_DIR    = path.join(app.getPath('userData'), 'themes')

const themeCache = new Map<string, VartaTheme>()

async function loadThemesFromDir(dir: string): Promise<VartaTheme[]> {
  const themes: VartaTheme[] = []
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) { continue }
      try {
        const raw   = await fsp.readFile(path.join(dir, entry.name), 'utf-8')
        const theme = JSON.parse(raw) as VartaTheme
        themes.push(theme)
        themeCache.set(theme.id, theme)
      } catch {
        // Skip malformed theme files
      }
    }
  } catch {
    // Directory may not exist yet
  }
  return themes
}

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerThemeHandlers(): void {

  ipcMain.handle(ThemeChannel.GET_ALL, async () => {
    try {
      const [builtin, user] = await Promise.all([
        loadThemesFromDir(BUILTIN_THEMES_DIR),
        loadThemesFromDir(USER_THEMES_DIR),
      ])
      const extThemes = extensionService.getThemes()
      return ipcOk([...builtin, ...user, ...extThemes])
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(ThemeChannel.GET_ACTIVE, async () => {
    try {
      const activeId = settingsService.get('workbench').theme
      if (themeCache.has(activeId)) {
        return ipcOk(themeCache.get(activeId))
      }
      // Load all themes to populate cache
      await Promise.all([
        loadThemesFromDir(BUILTIN_THEMES_DIR),
        loadThemesFromDir(USER_THEMES_DIR),
      ])
      return ipcOk(themeCache.get(activeId) ?? null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(ThemeChannel.SET_ACTIVE, (_e, themeId: string) => {
    try {
      settingsService.set({ workbench: { theme: themeId } })
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(ThemeChannel.LOAD_CUSTOM, async (_e, themePath: string) => {
    try {
      const raw   = await fsp.readFile(themePath, 'utf-8')
      const theme = JSON.parse(raw) as VartaTheme
      if (!theme.id || !theme.name || !theme.colors) {
        throw new VartaError(VartaErrorCode.THEME_INVALID, 'Theme file is missing required fields (id, name, colors)')
      }
      // Copy to user themes dir
      await fsp.mkdir(USER_THEMES_DIR, { recursive: true })
      await fsp.copyFile(themePath, path.join(USER_THEMES_DIR, `${theme.id}.json`))
      themeCache.set(theme.id, theme)
      return ipcOk(theme)
    } catch (e) { return handleErr(e) }
  })

  logger.info('IPC', 'Theme handlers registered')
}

export function removeThemeHandlers(): void {
  const channels = [
    ThemeChannel.GET_ALL, ThemeChannel.GET_ACTIVE,
    ThemeChannel.SET_ACTIVE, ThemeChannel.LOAD_CUSTOM,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
