import { ipcRenderer } from 'electron'
import type { MCPToolDefinition, MCPToolResult } from '../../shared/types/mcp.types'

export interface MCPAPI {
  listTools: () => Promise<MCPToolDefinition[]>
  callTool: (name: string, args: any) => Promise<MCPToolResult>
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
}
