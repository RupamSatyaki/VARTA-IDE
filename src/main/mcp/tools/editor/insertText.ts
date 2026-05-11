import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { windowManager } from '../../../window/WindowManager'
import { logger } from '../../../utils/logger'

export const insertText: MCPToolHandler = {
  definition: {
    name: 'insert_text',
    description: 'Insert text at the current cursor position in the active editor.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to insert.'
        }
      },
      required: ['text']
    }
  },

  execute: async ({ text }: { text: string }): Promise<MCPToolResult> => {
    try {
      windowManager.send('editor:insert-text', { text })
      logger.info('MCP:EditorTool', 'Text inserted at cursor')

      return {
        content: [{
          type: 'text',
          text: 'Text inserted successfully.'
        }]
      }
    } catch (e: any) {
      logger.error('MCP:EditorTool', 'Failed to insert text', e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error inserting text: ${e.message}`
        }]
      }
    }
  }
}
