import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { windowManager } from '../../../window/WindowManager'
import { PathGuard } from '../../sandbox/PathGuard'
import { logger } from '../../../utils/logger'

export const openFile: MCPToolHandler = {
  definition: {
    name: 'open_file',
    description: 'Open a file in an editor tab.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the file to open (relative to workspace root).'
        }
      },
      required: ['path']
    }
  },

  execute: async ({ path: filePath }: { path: string }): Promise<MCPToolResult> => {
    try {
      const validatedPath = PathGuard.validate(filePath)
      windowManager.send('tab:open', validatedPath)
      
      logger.info('MCP:EditorTool', `File opened: ${validatedPath}`)

      return {
        content: [{
          type: 'text',
          text: `Opened file: ${filePath}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:EditorTool', `Failed to open file: ${filePath}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error opening file: ${e.message}`
        }]
      }
    }
  }
}
