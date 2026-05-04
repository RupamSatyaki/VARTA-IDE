import { BrowserWindow, shell } from 'electron'
import { join }                 from 'path'
import { loadWindowState, trackWindowState } from './windowState'
import { logger }               from '../utils/logger'

const isDev = process.env.NODE_ENV === 'development'

export function createMainWindow(): BrowserWindow {
  const state = loadWindowState()

  const win = new BrowserWindow({
    x:              state.x,
    y:              state.y,
    width:          state.width,
    height:         state.height,
    minWidth:       800,
    minHeight:      600,
    show:           false,          // show after ready-to-show to avoid flash
    frame:          false,          // custom title bar
    titleBarStyle:  'hidden',
    trafficLightPosition: { x: 12, y: 12 },  // macOS traffic lights
    backgroundColor: '#1e1e1e',     // prevents white flash before React loads
    webPreferences: {
      preload:            join(__dirname, '../preload/index.js'),
      contextIsolation:   true,
      nodeIntegration:    false,     // security: never enable
      sandbox:            false,     // needed for preload to use Node APIs
      webSecurity:        true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  })

  // ── Show window gracefully ─────────────────────────────────────────────────
  win.once('ready-to-show', () => {
    if (state.isMaximized)  { win.maximize() }
    if (state.isFullScreen) { win.setFullScreen(true) }
    win.show()
    win.focus()
    logger.info('Window', 'Main window shown')
  })

  // ── Load content ──────────────────────────────────────────────────────────
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
    logger.info('Window', `Loading dev URL: ${process.env['ELECTRON_RENDERER_URL']}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // ── Open external links in system browser, not Electron ───────────────────
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch((err) => {
      logger.error('Window', 'Failed to open external URL', err)
    })
    return { action: 'deny' }
  })

  // ── DevTools: F12 or Ctrl+Shift+I ─────────────────────────────────────────
  win.webContents.on('before-input-event', (_event, input) => {
    if (
      input.key === 'F12' ||
      (input.control && input.shift && input.key === 'I') ||
      (input.meta    && input.alt   && input.key === 'I')
    ) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools({ mode: 'detach' })
      }
    }
  })

  // ── Prevent navigation away from the app ──────────────────────────────────
  win.webContents.on('will-navigate', (event, url) => {
    const appUrl = isDev
      ? process.env['ELECTRON_RENDERER_URL'] ?? ''
      : `file://${join(__dirname, '../renderer/index.html')}`

    if (!url.startsWith(appUrl)) {
      event.preventDefault()
      logger.warn('Window', `Blocked navigation to: ${url}`)
    }
  })

  // ── Track state for persistence ───────────────────────────────────────────
  trackWindowState(win)

  return win
}
