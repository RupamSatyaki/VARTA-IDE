/**
 * Type augmentation for window.varta API.
 * This file is referenced in tsconfig.web.json so the renderer gets
 * full IntelliSense on window.varta.* without importing anything.
 */

import type { FileAPI }     from './api/fileApi'
import type { TerminalAPI } from './api/terminalApi'
import type { GitAPI }      from './api/gitApi'
import type { SearchAPI }   from './api/searchApi'
import type { SettingsAPI } from './api/settingsApi'
import type { ThemeAPI }    from './api/themeApi'
import type { DialogAPI }   from './api/dialogApi'
import type { WindowAPI }   from './api/windowApi'
import type { AIAPI }       from './api/aiApi'
import type { AppAPI }      from './api/appApi'

export interface VartaAPI {
  fs:       FileAPI
  terminal: TerminalAPI
  git:      GitAPI
  search:   SearchAPI
  settings: SettingsAPI
  theme:    ThemeAPI
  dialog:   DialogAPI
  window:   WindowAPI
  ai:       AIAPI
  app:      AppAPI
}

declare global {
  interface Window {
    varta: VartaAPI
  }
}
