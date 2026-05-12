import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { logger } from '../../utils/logger'

/**
 * MCPSnapshot captures the state of a file before it is modified by an AI tool.
 */
export class MCPSnapshot {
  private static snapshotDir = path.join(app.getPath('userData'), 'mcp_snapshots')

  static async init() {
    if (!fs.existsSync(this.snapshotDir)) {
      await fsp.mkdir(this.snapshotDir, { recursive: true })
    }
  }

  /**
   * Captures the current content of a file.
   * @param filePath The absolute path to the file.
   * @returns The snapshot ID, or null if it failed.
   */
  static async takeSnapshot(filePath: string): Promise<string | null> {
    try {
      await this.init()
      if (!fs.existsSync(filePath)) return null

      const stats = await fsp.stat(filePath)
      if (stats.isDirectory()) return null

      const snapshotId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const snapshotPath = path.join(this.snapshotDir, snapshotId)

      await fsp.copyFile(filePath, snapshotPath)
      
      logger.info('MCPSnapshot', `Snapshot taken for ${filePath} -> ${snapshotId}`)
      return snapshotId
    } catch (e) {
      logger.error('MCPSnapshot', `Failed to take snapshot for ${filePath}`, e)
      return null
    }
  }

  /**
   * Restores a file from a snapshot.
   */
  static async restoreSnapshot(snapshotId: string, targetPath: string): Promise<boolean> {
    try {
      const snapshotPath = path.join(this.snapshotDir, snapshotId)
      if (!fs.existsSync(snapshotPath)) {
        throw new Error(`Snapshot not found: ${snapshotId}`)
      }

      // Ensure parent directory exists
      const parentDir = path.dirname(targetPath)
      if (!fs.existsSync(parentDir)) {
        await fsp.mkdir(parentDir, { recursive: true })
      }

      await fsp.copyFile(snapshotPath, targetPath)
      logger.info('MCPSnapshot', `Restored snapshot ${snapshotId} to ${targetPath}`)
      return true
    } catch (e) {
      logger.error('MCPSnapshot', `Failed to restore snapshot ${snapshotId}`, e)
      return false
    }
  }

  /**
   * Deletes a snapshot file.
   */
  static async deleteSnapshot(snapshotId: string) {
    try {
      const snapshotPath = path.join(this.snapshotDir, snapshotId)
      if (fs.existsSync(snapshotPath)) {
        await fsp.unlink(snapshotPath)
      }
    } catch (e) {
      logger.error('MCPSnapshot', `Failed to delete snapshot ${snapshotId}`, e)
    }
  }
}
