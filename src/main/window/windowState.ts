import { BrowserWindow, screen } from 'electron'
import Store from 'electron-store'

interface WindowStateData {
  x?:          number
  y?:          number
  width:       number
  height:      number
  isMaximized: boolean
  isFullScreen: boolean
}

const DEFAULT_STATE: WindowStateData = {
  width:        1280,
  height:       800,
  isMaximized:  false,
  isFullScreen: false,
}

const store = new Store<{ windowState: WindowStateData }>({
  name: 'window-state',
  defaults: { windowState: DEFAULT_STATE },
})

/**
 * Ensure the saved window position is still on a visible screen.
 * If the monitor it was on is gone, reset to center of primary display.
 */
function ensureVisibleOnScreen(state: WindowStateData): WindowStateData {
  if (state.x === undefined || state.y === undefined) { return state }

  const displays = screen.getAllDisplays()
  const isVisible = displays.some((display) => {
    const { x, y, width, height } = display.workArea
    return (
      state.x! >= x &&
      state.y! >= y &&
      state.x! + state.width  <= x + width &&
      state.y! + state.height <= y + height
    )
  })

  if (!isVisible) {
    const { width, height } = DEFAULT_STATE
    return { ...state, x: undefined, y: undefined, width, height }
  }

  return state
}

export function loadWindowState(): WindowStateData {
  const saved = store.get('windowState', DEFAULT_STATE)
  return ensureVisibleOnScreen(saved)
}

export function saveWindowState(win: BrowserWindow): void {
  if (win.isDestroyed()) { return }

  const isMaximized  = win.isMaximized()
  const isFullScreen = win.isFullScreen()

  // Only save bounds when in normal (non-maximized, non-fullscreen) state
  const bounds = (!isMaximized && !isFullScreen)
    ? win.getBounds()
    : store.get('windowState', DEFAULT_STATE)

  const state: WindowStateData = {
    x:           'x'      in bounds ? bounds.x      : undefined,
    y:           'y'      in bounds ? bounds.y      : undefined,
    width:       'width'  in bounds ? bounds.width  : DEFAULT_STATE.width,
    height:      'height' in bounds ? bounds.height : DEFAULT_STATE.height,
    isMaximized,
    isFullScreen,
  }

  store.set('windowState', state)
}

/** Attach listeners that auto-save state on move/resize/maximize */
export function trackWindowState(win: BrowserWindow): void {
  const save = () => saveWindowState(win)

  win.on('resize',      save)
  win.on('move',        save)
  win.on('maximize',    save)
  win.on('unmaximize',  save)
  win.on('enter-full-screen', save)
  win.on('leave-full-screen', save)
}
