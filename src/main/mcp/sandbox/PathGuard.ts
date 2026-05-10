import path from 'path'
import { app } from 'electron'

/**
 * PathGuard ensures that the AI cannot access files outside the workspace root.
 * This is a critical security sandbox for MCP tools.
 */
export class PathGuard {
  static getRoot(): string {
    return (app as any).varta_workspaceRoot ?? process.cwd()
  }

  static validate(targetPath: string): string {
    const root = this.getRoot()
    const fullPath = path.isAbsolute(targetPath) 
      ? targetPath 
      : path.join(root, targetPath)

    const normalizedPath = path.normalize(fullPath)
    const normalizedRoot = path.normalize(root)

    if (!normalizedPath.startsWith(normalizedRoot)) {
      throw new Error(`Security Violation: Access denied to path outside workspace: ${targetPath}`)
    }

    return normalizedPath
  }

  static isSafe(targetPath: string): boolean {
    try {
      this.validate(targetPath)
      return true
    } catch {
      return false
    }
  }
}
