import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'

export const getActiveFile: MCPToolHandler = {
  definition: {
    name: 'get_active_file',
    description: 'Get the path of the currently active file in the editor.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  execute: async (): Promise<MCPToolResult> => {
    logger.info('MCP:EditorTool', 'getActiveFile requested (not yet fully implemented)')
    return {
      isError: true,
      content: [{
        type: 'text',
        text: 'Active file tracking not yet initialized. Please use open_file first or refer to recently opened files.'
      }]
    }
  }
}
