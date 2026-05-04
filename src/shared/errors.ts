/**
 * Varta typed error system.
 *
 * Rules:
 * - ALL IPC handlers must throw VartaError only — never raw Error or string.
 * - Every error has a typed VartaErrorCode so the renderer can handle it
 *   programmatically without parsing message strings.
 * - Use VartaError.from() to wrap unknown caught values safely.
 */

// ─── Error Codes ──────────────────────────────────────────────────────────────
export const enum VartaErrorCode {
  // Generic
  UNKNOWN                   = 'ERR_UNKNOWN',
  NOT_IMPLEMENTED           = 'ERR_NOT_IMPLEMENTED',
  INVALID_ARGUMENT          = 'ERR_INVALID_ARGUMENT',
  OPERATION_CANCELLED       = 'ERR_OPERATION_CANCELLED',
  TIMEOUT                   = 'ERR_TIMEOUT',

  // File system
  FILE_NOT_FOUND            = 'ERR_FILE_NOT_FOUND',
  FILE_ALREADY_EXISTS       = 'ERR_FILE_ALREADY_EXISTS',
  FILE_READ_FAILED          = 'ERR_FILE_READ_FAILED',
  FILE_WRITE_FAILED         = 'ERR_FILE_WRITE_FAILED',
  FILE_DELETE_FAILED        = 'ERR_FILE_DELETE_FAILED',
  FILE_RENAME_FAILED        = 'ERR_FILE_RENAME_FAILED',
  FILE_COPY_FAILED          = 'ERR_FILE_COPY_FAILED',
  FILE_MOVE_FAILED          = 'ERR_FILE_MOVE_FAILED',
  FILE_PERMISSION_DENIED    = 'ERR_FILE_PERMISSION_DENIED',
  DIR_NOT_FOUND             = 'ERR_DIR_NOT_FOUND',
  DIR_CREATE_FAILED         = 'ERR_DIR_CREATE_FAILED',
  DIR_DELETE_FAILED         = 'ERR_DIR_DELETE_FAILED',
  DIR_READ_FAILED           = 'ERR_DIR_READ_FAILED',
  WATCHER_START_FAILED      = 'ERR_WATCHER_START_FAILED',
  WATCHER_STOP_FAILED       = 'ERR_WATCHER_STOP_FAILED',

  // Terminal
  TERMINAL_CREATE_FAILED    = 'ERR_TERMINAL_CREATE_FAILED',
  TERMINAL_NOT_FOUND        = 'ERR_TERMINAL_NOT_FOUND',
  TERMINAL_WRITE_FAILED     = 'ERR_TERMINAL_WRITE_FAILED',
  TERMINAL_RESIZE_FAILED    = 'ERR_TERMINAL_RESIZE_FAILED',
  TERMINAL_ALREADY_DEAD     = 'ERR_TERMINAL_ALREADY_DEAD',
  SHELL_NOT_FOUND           = 'ERR_SHELL_NOT_FOUND',

  // Git
  GIT_NOT_A_REPO            = 'ERR_GIT_NOT_A_REPO',
  GIT_NOT_INSTALLED         = 'ERR_GIT_NOT_INSTALLED',
  GIT_STATUS_FAILED         = 'ERR_GIT_STATUS_FAILED',
  GIT_DIFF_FAILED           = 'ERR_GIT_DIFF_FAILED',
  GIT_STAGE_FAILED          = 'ERR_GIT_STAGE_FAILED',
  GIT_UNSTAGE_FAILED        = 'ERR_GIT_UNSTAGE_FAILED',
  GIT_COMMIT_FAILED         = 'ERR_GIT_COMMIT_FAILED',
  GIT_PUSH_FAILED           = 'ERR_GIT_PUSH_FAILED',
  GIT_PULL_FAILED           = 'ERR_GIT_PULL_FAILED',
  GIT_FETCH_FAILED          = 'ERR_GIT_FETCH_FAILED',
  GIT_CHECKOUT_FAILED       = 'ERR_GIT_CHECKOUT_FAILED',
  GIT_BRANCH_FAILED         = 'ERR_GIT_BRANCH_FAILED',
  GIT_MERGE_CONFLICT        = 'ERR_GIT_MERGE_CONFLICT',
  GIT_DISCARD_FAILED        = 'ERR_GIT_DISCARD_FAILED',
  GIT_CLONE_FAILED          = 'ERR_GIT_CLONE_FAILED',
  GIT_STASH_FAILED          = 'ERR_GIT_STASH_FAILED',
  GIT_AUTH_FAILED           = 'ERR_GIT_AUTH_FAILED',

  // Search
  SEARCH_FAILED             = 'ERR_SEARCH_FAILED',
  REPLACE_FAILED            = 'ERR_REPLACE_FAILED',
  SEARCH_INVALID_REGEX      = 'ERR_SEARCH_INVALID_REGEX',

  // Settings
  SETTINGS_READ_FAILED      = 'ERR_SETTINGS_READ_FAILED',
  SETTINGS_WRITE_FAILED     = 'ERR_SETTINGS_WRITE_FAILED',
  SETTINGS_INVALID_KEY      = 'ERR_SETTINGS_INVALID_KEY',
  SETTINGS_INVALID_VALUE    = 'ERR_SETTINGS_INVALID_VALUE',
  SETTINGS_IMPORT_FAILED    = 'ERR_SETTINGS_IMPORT_FAILED',
  SETTINGS_EXPORT_FAILED    = 'ERR_SETTINGS_EXPORT_FAILED',

  // Theme
  THEME_NOT_FOUND           = 'ERR_THEME_NOT_FOUND',
  THEME_LOAD_FAILED         = 'ERR_THEME_LOAD_FAILED',
  THEME_INVALID             = 'ERR_THEME_INVALID',

  // AI
  AI_NO_API_KEY             = 'ERR_AI_NO_API_KEY',
  AI_INVALID_API_KEY        = 'ERR_AI_INVALID_API_KEY',
  AI_REQUEST_FAILED         = 'ERR_AI_REQUEST_FAILED',
  AI_RATE_LIMITED           = 'ERR_AI_RATE_LIMITED',
  AI_CONTEXT_TOO_LONG       = 'ERR_AI_CONTEXT_TOO_LONG',
  AI_STREAM_FAILED          = 'ERR_AI_STREAM_FAILED',
  AI_CANCELLED              = 'ERR_AI_CANCELLED',
  AI_MODEL_NOT_FOUND        = 'ERR_AI_MODEL_NOT_FOUND',

  // Extension
  EXTENSION_NOT_FOUND       = 'ERR_EXTENSION_NOT_FOUND',
  EXTENSION_INSTALL_FAILED  = 'ERR_EXTENSION_INSTALL_FAILED',
  EXTENSION_LOAD_FAILED     = 'ERR_EXTENSION_LOAD_FAILED',
  EXTENSION_INVALID         = 'ERR_EXTENSION_INVALID',

  // Window / App
  WINDOW_NOT_FOUND          = 'ERR_WINDOW_NOT_FOUND',
  EXTERNAL_OPEN_FAILED      = 'ERR_EXTERNAL_OPEN_FAILED',
  UPDATE_CHECK_FAILED       = 'ERR_UPDATE_CHECK_FAILED',
}

// ─── VartaError class ─────────────────────────────────────────────────────────
export class VartaError extends Error {
  /** Typed error code — use this for programmatic handling, not message strings */
  public readonly code: VartaErrorCode

  /** Optional structured details (e.g. file path, git output, HTTP status) */
  public readonly details?: unknown

  constructor(code: VartaErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'VartaError'
    this.code = code
    this.details = details

    // Maintain proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, VartaError.prototype)
  }

  /**
   * Safely wrap any caught value into a VartaError.
   * Use this in catch blocks: `catch (e) { throw VartaError.from(e) }`
   */
  static from(
    caught: unknown,
    fallbackCode: VartaErrorCode = VartaErrorCode.UNKNOWN
  ): VartaError {
    if (caught instanceof VartaError) {
      return caught
    }

    if (caught instanceof Error) {
      return new VartaError(
        VartaError.inferCode(caught) ?? fallbackCode,
        caught.message,
        { originalStack: caught.stack }
      )
    }

    if (typeof caught === 'string') {
      return new VartaError(fallbackCode, caught)
    }

    return new VartaError(
      fallbackCode,
      'An unknown error occurred',
      { raw: caught }
    )
  }

  /**
   * Try to infer a VartaErrorCode from a native Error's properties.
   * Handles common Node.js error codes (ENOENT, EACCES, etc.)
   */
  private static inferCode(err: Error): VartaErrorCode | null {
    const code = (err as NodeJS.ErrnoException).code

    switch (code) {
      case 'ENOENT':  return VartaErrorCode.FILE_NOT_FOUND
      case 'EACCES':
      case 'EPERM':   return VartaErrorCode.FILE_PERMISSION_DENIED
      case 'EEXIST':  return VartaErrorCode.FILE_ALREADY_EXISTS
      case 'ETIMEDOUT':
      case 'ETIMEOUT': return VartaErrorCode.TIMEOUT
      default:        return null
    }
  }

  /** Serialize to a plain object safe for IPC transport */
  toPayload(): { code: string; message: string; details?: unknown } {
    return {
      code:    this.code,
      message: this.message,
      details: this.details
    }
  }

  /** Type guard */
  static isVartaError(value: unknown): value is VartaError {
    return value instanceof VartaError
  }
}
