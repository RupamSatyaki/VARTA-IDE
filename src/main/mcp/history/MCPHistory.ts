import { logger } from '../../utils/logger'
import { MCPSnapshot } from './MCPSnapshot'

export interface ToolCallEntry {
  id: string
  timestamp: number
  toolName: string
  args: any
  snapshotIds: Record<string, string> // path -> snapshotId
  result?: any
  undone?: boolean
}

/**
 * MCPHistory records all destructive tool calls and their snapshots.
 */
export class MCPHistory {
  private static history: ToolCallEntry[] = []

  /**
   * Adds a new entry to the history.
   */
  static addEntry(entry: ToolCallEntry) {
    this.history.push(entry)
    logger.info('MCPHistory', `Added history entry: ${entry.toolName} (${entry.id})`)
  }

  /**
   * Returns the full history of tool calls.
   */
  static getHistory(): ToolCallEntry[] {
    return this.history
  }

  /**
   * Undoes the last destructive tool call.
   */
  static async undoLast(): Promise<boolean> {
    // Find the last entry that hasn't been undone and has snapshots
    const lastEntry = [...this.history].reverse().find(e => !e.undone && Object.keys(e.snapshotIds).length > 0)
    
    if (!lastEntry) {
      logger.warn('MCPHistory', 'No undoable history entry found')
      return false
    }

    logger.info('MCPHistory', `Undoing last entry: ${lastEntry.toolName} (${lastEntry.id})`)

    // Restore all files in this entry
    for (const [filePath, snapshotId] of Object.entries(lastEntry.snapshotIds)) {
      const success = await MCPSnapshot.restoreSnapshot(snapshotId, filePath)
      if (!success) {
        logger.error('MCPHistory', `Failed to restore ${filePath} during undo`)
        return false
      }
    }

    lastEntry.undone = true
    return true
  }

  /**
   * Undoes a specific tool call by ID.
   */
  static async undo(id: string): Promise<boolean> {
    const entry = this.history.find(e => e.id === id)
    if (!entry || entry.undone) return false

    for (const [filePath, snapshotId] of Object.entries(entry.snapshotIds)) {
      await MCPSnapshot.restoreSnapshot(snapshotId, filePath)
    }

    entry.undone = true
    return true
  }
}
