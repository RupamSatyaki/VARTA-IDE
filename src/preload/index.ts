/**
 * Preload script — runs in a privileged context with access to Node.js APIs,
 * but exposes ONLY a typed, safe surface to the renderer via contextBridge.
 *
 * Security rules enforced here:
 * - ipcRenderer is NEVER exposed directly to the renderer
 * - Only explicitly listed functions are bridged
 * - AI API key goes IN only — getApiKey() is intentionally absent
 * - All exposed functions are typed via VartaAPI (see varta.d.ts)
 */
import { contextBridge } from 'electron'
import { fileApi }       from './api/fileApi'
import { terminalApi }   from './api/terminalApi'
import { gitApi }        from './api/gitApi'
import { searchApi }     from './api/searchApi'
import { settingsApi }   from './api/settingsApi'
import { themeApi }      from './api/themeApi'
import { dialogApi }     from './api/dialogApi'
import { windowApi }     from './api/windowApi'
import { aiApi }         from './api/aiApi'
import { appApi }        from './api/appApi'
import { mcpApi }        from './api/mcpApi'

/**
 * The complete window.varta API surface exposed to the renderer.
 * Every property here maps 1:1 to the VartaAPI interface in varta.d.ts.
 */
const vartaAPI = {
  fs:       fileApi,
  terminal: terminalApi,
  git:      gitApi,
  search:   searchApi,
  settings: settingsApi,
  theme:    themeApi,
  dialog:   dialogApi,
  window:   windowApi,
  ai:       aiApi,
  app:      appApi,
  mcp:      mcpApi,
} as const

contextBridge.exposeInMainWorld('varta', vartaAPI)

// Expose safe version info — process.versions is Node.js only, not available in renderer
contextBridge.exposeInMainWorld('vartaVersions', {
  electron: process.versions.electron ?? '',
  node:     process.versions.node     ?? '',
  chrome:   process.versions.chrome   ?? '',
})
