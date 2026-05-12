import { ipcMain } from 'electron'
import { toolRegistry } from '../mcp/registry/ToolRegistry'
import { MCPHistory } from '../mcp/history/MCPHistory'
import { logger } from '../utils/logger'

export function registerMCPHandlers(): void {
  // List all available tools
  ipcMain.handle('mcp:list-tools', async () => {
    try {
      return toolRegistry.getToolDefinitions()
    } catch (error: any) {
      logger.error('MCP:IPC', 'Failed to list tools', error)
      throw error
    }
  })

  // Call a specific tool
  ipcMain.handle('mcp:call-tool', async (_event, { name, args }) => {
    try {
      logger.info('MCP:IPC', `Calling tool: ${name}`)
      const result = await toolRegistry.executeTool(name, args)
      return result
    } catch (error: any) {
      logger.error('MCP:IPC', `Tool execution failed: ${name}`, error)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }]
      }
    }
  })

  // Undo last destructive operation
  ipcMain.handle('mcp:undo', async () => {
    try {
      return await MCPHistory.undoLast()
    } catch (error: any) {
      logger.error('MCP:IPC', 'Undo failed', error)
      return false
    }
  })

  // Get tool execution history
  ipcMain.handle('mcp:get-history', async () => {
    return MCPHistory.getHistory()
  })
}

export function removeMCPHandlers(): void {
  ipcMain.removeHandler('mcp:list-tools')
  ipcMain.removeHandler('mcp:call-tool')
  ipcMain.removeHandler('mcp:undo')
  ipcMain.removeHandler('mcp:get-history')
}
