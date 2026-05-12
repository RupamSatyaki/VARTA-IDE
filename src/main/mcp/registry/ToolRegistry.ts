import { MCPToolHandler } from '../../../shared/types/mcp.types'
import { allTools } from '../tools'
import { logger } from '../../utils/logger'
import { PathGuard } from '../sandbox/PathGuard'
import { ConfirmationGate } from '../sandbox/ConfirmationGate'
import { MCPSnapshot } from '../history/MCPSnapshot'
import { MCPHistory } from '../history/MCPHistory'

export class ToolRegistry {
  private tools = new Map<string, MCPToolHandler>()

  constructor() {
    this.registerAll(allTools)
    logger.info('ToolRegistry', 'Initialized with core tools')
  }

  register(handler: MCPToolHandler) {
    this.tools.set(handler.definition.name, handler)
  }

  registerAll(handlers: MCPToolHandler[]) {
    for (const handler of handlers) {
      this.register(handler)
    }
  }

  getToolDefinitions() {
    return Array.from(this.tools.values()).map(t => t.definition)
  }

  /**
   * Executes a tool with security, confirmation, and snapshotting.
   */
  async executeTool(name: string, args: any) {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }

    // ── 1. Path Security Validation ──────────────────────────────────────────
    // Automatically validate any argument that looks like a path
    const pathKeys = ['path', 'filePath', 'targetPath', 'to', 'from', 'oldPath', 'newPath', 'destination']
    for (const key of pathKeys) {
      if (args[key] && typeof args[key] === 'string') {
        try {
          PathGuard.validate(args[key])
        } catch (e: any) {
          logger.error('ToolRegistry', `Security violation in ${name}: ${e.message}`)
          return { isError: true, content: [{ type: 'text', text: e.message }] }
        }
      }
    }

    // ── 2. Confirmation Gate ─────────────────────────────────────────────────
    if (tool.definition.dangerous) {
      const confirmed = await ConfirmationGate.confirm(
        `AI is requesting to run a dangerous tool: ${name}`,
        `Arguments: ${JSON.stringify(args, null, 2)}`
      )
      if (!confirmed) {
        logger.info('ToolRegistry', `User rejected dangerous tool: ${name}`)
        return { isError: true, content: [{ type: 'text', text: 'Operation cancelled by user.' }] }
      }
    }

    // ── 3. Snapshotting for Undo System ──────────────────────────────────────
    const snapshotIds: Record<string, string> = {}
    const isDestructive = name.includes('write') || 
                          name.includes('delete') || 
                          name.includes('rename') || 
                          name.includes('replace') || 
                          tool.definition.dangerous

    if (isDestructive) {
      // Identify paths to snapshot before modification
      const pathsToSnapshot = []
      if (args.path) pathsToSnapshot.push(args.path)
      if (args.from) pathsToSnapshot.push(args.from)
      if (args.oldPath) pathsToSnapshot.push(args.oldPath)
      
      for (const p of pathsToSnapshot) {
        try {
          // Get absolute path for snapshotting
          const fullPath = PathGuard.validate(p)
          const sid = await MCPSnapshot.takeSnapshot(fullPath)
          if (sid) snapshotIds[fullPath] = sid
        } catch { /* ignore validation errors here, already checked above */ }
      }
    }

    // ── 4. Execution ─────────────────────────────────────────────────────────
    const result = await tool.execute(args)

    // ── 5. History Recording ─────────────────────────────────────────────────
    if (isDestructive || Object.keys(snapshotIds).length > 0) {
      MCPHistory.addEntry({
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        toolName: name,
        args,
        snapshotIds,
        result
      })
    }

    return result
  }
}

export const toolRegistry = new ToolRegistry()
