/**
 * IPC Channel Contract — Single source of truth for ALL IPC channel names.
 * Every channel is a const string enum value. No magic strings anywhere.
 *
 * Naming convention: DOMAIN:ACTION
 * e.g. FILE:READ, TERMINAL:WRITE, GIT:COMMIT
 */

// ─── File Channels ────────────────────────────────────────────────────────────
export const enum FileChannel {
  READ            = 'FILE:READ',
  WRITE           = 'FILE:WRITE',
  DELETE          = 'FILE:DELETE',
  RENAME          = 'FILE:RENAME',
  COPY            = 'FILE:COPY',
  MOVE            = 'FILE:MOVE',
  EXISTS          = 'FILE:EXISTS',
  STAT            = 'FILE:STAT',
  READ_DIR        = 'FILE:READ_DIR',
  CREATE_DIR      = 'FILE:CREATE_DIR',
  DELETE_DIR      = 'FILE:DELETE_DIR',
  WATCH_START     = 'FILE:WATCH_START',
  WATCH_STOP      = 'FILE:WATCH_STOP',
  WATCH_EVENT     = 'FILE:WATCH_EVENT',   // main → renderer (push)
  OPEN_IN_SHELL   = 'FILE:OPEN_IN_SHELL',
}

// ─── Dialog Channels ──────────────────────────────────────────────────────────
export const enum DialogChannel {
  OPEN_FILE       = 'DIALOG:OPEN_FILE',
  OPEN_FOLDER     = 'DIALOG:OPEN_FOLDER',
  SAVE_FILE       = 'DIALOG:SAVE_FILE',
  SHOW_MESSAGE    = 'DIALOG:SHOW_MESSAGE',
  SHOW_ERROR      = 'DIALOG:SHOW_ERROR',
  SHOW_CONFIRM    = 'DIALOG:SHOW_CONFIRM',
}

// ─── Terminal Channels ────────────────────────────────────────────────────────
export const enum TerminalChannel {
  CREATE          = 'TERMINAL:CREATE',
  DESTROY         = 'TERMINAL:DESTROY',
  WRITE           = 'TERMINAL:WRITE',
  RESIZE          = 'TERMINAL:RESIZE',
  DATA            = 'TERMINAL:DATA',      // main → renderer (push)
  EXIT            = 'TERMINAL:EXIT',      // main → renderer (push)
  LIST            = 'TERMINAL:LIST',
  CLEAR           = 'TERMINAL:CLEAR',
  SET_CWD         = 'TERMINAL:SET_CWD',
}

// ─── Git Channels ─────────────────────────────────────────────────────────────
export const enum GitChannel {
  STATUS          = 'GIT:STATUS',
  DIFF            = 'GIT:DIFF',
  DIFF_FILE       = 'GIT:DIFF_FILE',
  STAGE           = 'GIT:STAGE',
  UNSTAGE         = 'GIT:UNSTAGE',
  STAGE_ALL       = 'GIT:STAGE_ALL',
  UNSTAGE_ALL     = 'GIT:UNSTAGE_ALL',
  COMMIT          = 'GIT:COMMIT',
  PUSH            = 'GIT:PUSH',
  PULL            = 'GIT:PULL',
  FETCH           = 'GIT:FETCH',
  BRANCHES        = 'GIT:BRANCHES',
  CHECKOUT        = 'GIT:CHECKOUT',
  CREATE_BRANCH   = 'GIT:CREATE_BRANCH',
  DELETE_BRANCH   = 'GIT:DELETE_BRANCH',
  LOG             = 'GIT:LOG',
  STASH           = 'GIT:STASH',
  STASH_POP       = 'GIT:STASH_POP',
  DISCARD         = 'GIT:DISCARD',
  INIT            = 'GIT:INIT',
  CLONE           = 'GIT:CLONE',
  SHOW_FILE       = 'GIT:SHOW_FILE',
  CHANGED         = 'GIT:CHANGED',        // main → renderer (push)
}

// ─── Search Channels ──────────────────────────────────────────────────────────
export const enum SearchChannel {
  FIND_IN_FILES   = 'SEARCH:FIND_IN_FILES',
  REPLACE_IN_FILES= 'SEARCH:REPLACE_IN_FILES',
  CANCEL          = 'SEARCH:CANCEL',
  PROGRESS        = 'SEARCH:PROGRESS',    // main → renderer (push)
}

// ─── Settings Channels ────────────────────────────────────────────────────────
export const enum SettingsChannel {
  GET             = 'SETTINGS:GET',
  GET_ALL         = 'SETTINGS:GET_ALL',
  SET             = 'SETTINGS:SET',
  RESET           = 'SETTINGS:RESET',
  RESET_ALL       = 'SETTINGS:RESET_ALL',
  CHANGED         = 'SETTINGS:CHANGED',   // main → renderer (push)
  EXPORT          = 'SETTINGS:EXPORT',
  IMPORT          = 'SETTINGS:IMPORT',
}

// ─── Theme Channels ───────────────────────────────────────────────────────────
export const enum ThemeChannel {
  GET_ALL         = 'THEME:GET_ALL',
  GET_ACTIVE      = 'THEME:GET_ACTIVE',
  SET_ACTIVE      = 'THEME:SET_ACTIVE',
  LOAD_CUSTOM     = 'THEME:LOAD_CUSTOM',
  CHANGED         = 'THEME:CHANGED',      // main → renderer (push)
}

// ─── Window Channels ──────────────────────────────────────────────────────────
export const enum WindowChannel {
  MINIMIZE        = 'WINDOW:MINIMIZE',
  MAXIMIZE        = 'WINDOW:MAXIMIZE',
  RESTORE         = 'WINDOW:RESTORE',
  CLOSE           = 'WINDOW:CLOSE',
  TOGGLE_FULLSCREEN = 'WINDOW:TOGGLE_FULLSCREEN',
  IS_MAXIMIZED    = 'WINDOW:IS_MAXIMIZED',
  IS_FULLSCREEN   = 'WINDOW:IS_FULLSCREEN',
  FOCUS           = 'WINDOW:FOCUS',
  BLUR            = 'WINDOW:BLUR',
  MAXIMIZED       = 'WINDOW:MAXIMIZED',   // main → renderer (push)
  UNMAXIMIZED     = 'WINDOW:UNMAXIMIZED', // main → renderer (push)
  FOCUSED         = 'WINDOW:FOCUSED',     // main → renderer (push)
  BLURRED         = 'WINDOW:BLURRED',     // main → renderer (push)
}

// ─── AI Channels ──────────────────────────────────────────────────────────────
export const enum AIChannel {
  SEND_MESSAGE    = 'AI:SEND_MESSAGE',
  STREAM_CHUNK    = 'AI:STREAM_CHUNK',    // main → renderer (push, streaming)
  STREAM_END      = 'AI:STREAM_END',      // main → renderer (push)
  STREAM_ERROR    = 'AI:STREAM_ERROR',    // main → renderer (push)
  CANCEL_STREAM   = 'AI:CANCEL_STREAM',
  GET_MODELS      = 'AI:GET_MODELS',
  INLINE_HINT     = 'AI:INLINE_HINT',
  HAS_API_KEY     = 'AI:HAS_API_KEY',
  SET_API_KEY     = 'AI:SET_API_KEY',     // writes to encrypted settings only
  CLEAR_API_KEY   = 'AI:CLEAR_API_KEY',
  HAS_BASE_URL    = 'AI:HAS_BASE_URL',
  SET_BASE_URL    = 'AI:SET_BASE_URL',    // writes to settings only
  CLEAR_BASE_URL  = 'AI:CLEAR_BASE_URL',
}

// ─── Extension Channels ───────────────────────────────────────────────────────
export const enum ExtensionChannel {
  LIST            = 'EXTENSION:LIST',
  INSTALL         = 'EXTENSION:INSTALL',
  UNINSTALL       = 'EXTENSION:UNINSTALL',
  ENABLE          = 'EXTENSION:ENABLE',
  DISABLE         = 'EXTENSION:DISABLE',
  GET_DETAILS     = 'EXTENSION:GET_DETAILS',
  RELOAD          = 'EXTENSION:RELOAD',
}

// ─── App Channels ─────────────────────────────────────────────────────────────
export const enum AppChannel {
  GET_VERSION     = 'APP:GET_VERSION',
  GET_PLATFORM    = 'APP:GET_PLATFORM',
  GET_PATHS       = 'APP:GET_PATHS',
  OPEN_EXTERNAL   = 'APP:OPEN_EXTERNAL',
  RELAUNCH        = 'APP:RELAUNCH',
  QUIT            = 'APP:QUIT',
  CHECK_UPDATE    = 'APP:CHECK_UPDATE',
  INSTALL_UPDATE  = 'APP:INSTALL_UPDATE',
  UPDATE_AVAILABLE= 'APP:UPDATE_AVAILABLE', // main → renderer (push)
}

// ─── IPC Response wrapper ─────────────────────────────────────────────────────
/**
 * Every ipcMain.handle must return IPCResponse<T>.
 * Never return raw data or throw raw errors.
 */
export type IPCResponse<T> =
  | { success: true;  data: T }
  | { success: false; error: IPCErrorPayload }

export interface IPCErrorPayload {
  code:    string   // VartaErrorCode value
  message: string
  details?: unknown
}

/** Type guard */
export function isIPCSuccess<T>(res: IPCResponse<T>): res is { success: true; data: T } {
  return res.success === true
}

/** Helper to build a success response */
export function ipcOk<T>(data: T): IPCResponse<T> {
  return { success: true, data }
}

/** Helper to build an error response from a VartaError */
export function ipcErr<T>(error: IPCErrorPayload): IPCResponse<T> {
  return { success: false, error }
}
