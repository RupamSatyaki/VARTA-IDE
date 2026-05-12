import { ipcRenderer } from 'electron'
import type { MCPToolDefinition, MCPToolResult } from '../../shared/types/mcp.types'

export interface MCPAPI {
  listTools: () => Promise<MCPToolDefinition[]>
  callTool: (name: string, args: any) => Promise<MCPToolResult>
  onConfirmRequest: (cb: (data: any) => void) => () => void
  confirmReply: (replyChannel: string, approved: boolean) => void
  undo: () => Promise<boolean>
  getHistory: () => Promise<any[]>
}

export const mcpApi: MCPAPI = {
  /**
   * List all available tools and their schemas.
   */
  listTools: (): Promise<MCPToolDefinition[]> => {
    return ipcRenderer.invoke('mcp:list-tools')
  },

  /**
   * Call an AI tool with arguments.
   */
  callTool: (name: string, args: any): Promise<MCPToolResult> => {
    return ipcRenderer.invoke('mcp:call-tool', { name, args })
  },

  /**
   * Listen for tool confirmation requests from main.
   */
  onConfirmRequest: (cb: (data: any) => void): (() => void) => {
    const handler = (_: any, data: any) => cb(data)
    ipcRenderer.on('mcp:confirm-request', handler)
    return () => ipcRenderer.off('mcp:confirm-request', handler)
  },

  /**
   * Reply to a confirmation request.
   */
  confirmReply: (replyChannel: string, approved: boolean) => {
    ipcRenderer.send(replyChannel, approved)
  },

  /**
   * Undo the last destructive MCP operation.
   */
  undo: (): Promise<boolean> => {
    return ipcRenderer.invoke('mcp:undo')
  },

  /**
   * Get the history of MCP tool executions.
   */
  getHistory: (): Promise<any[]> => {
    return ipcRenderer.invoke('mcp:get-history')
  }
}
