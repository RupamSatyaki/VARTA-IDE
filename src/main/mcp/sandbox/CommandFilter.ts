import { logger } from '../../utils/logger'

/**
 * CommandFilter prevents the AI from executing dangerous shell commands.
 */
export class CommandFilter {
  private static readonly BLACKLIST = [
    'rm -rf /',
    'rm -rf *',
    'mkfs',
    'dd if=',
    'shutdown',
    'reboot',
    ':(){ :|:& };:', // Fork bomb
    '> /dev/sda',
    'chmod -R 777 /',
    'chown -R',
  ]

  private static readonly BLOCKED_PATTERNS = [
    /rm\s+-rf\s+\//,
    /rm\s+-rf\s+\*/,
    /rm\s+-rf\s+\.\./,
    />\s*\/dev\//,
    /format\s+[a-z]:/i,
  ]

  static validate(command: string): void {
    const trimmed = command.trim().toLowerCase()

    // Check exact matches in blacklist
    for (const blocked of this.BLACKLIST) {
      if (trimmed.includes(blocked.toLowerCase())) {
        throw new Error(`Security Violation: Command "${command}" is blocked for safety.`)
      }
    }

    // Check regex patterns
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(trimmed)) {
        throw new Error(`Security Violation: Command "${command}" matches a dangerous pattern.`)
      }
    }
    
    logger.debug('CommandFilter', `Command validated: ${command}`)
  }

  static isSafe(command: string): boolean {
    try {
      this.validate(command)
      return true
    } catch {
      return false
    }
  }
}
