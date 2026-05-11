import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { windowManager } from '../../../window/WindowManager'
import { logger } from '../../../utils/logger'

export const replaceText: MCPToolHandler = {
  definition: {
    name: 'replace_text',
    description: 'Replace a range of text in the active editor.',
    inputSchema: {
      type: 'object',
      properties: {
        range: {
          type: 'object',
          description: 'The range to replace.',
          properties: {
            startLineNumber: { type: 'number' },
            startColumn: { type: 'number' },
            endLineNumber: { type: 'number' },
            endColumn: { type: 'number' }
          },
          required: ['startLineNumber', 'startColumn', 'endLineNumber', 'endColumn']
        },
        text: {
          type: 'string',
          description: 'The new text.'
        }
      },
      required: ['range', 'text']
    }
  },

  execute: async ({ range, text }: { range: any, text: string }): Promise<MCPToolResult> => {
    try {
      windowManager.send('editor:replace-text', { range, text })
      logger.info('MCP:EditorTool', 'Text replaced in range')

      return {
        content: [{
          type: 'text',
          text: 'Text replaced successfully.'
        }]
      }
    } catch (e: any) {
      logger.error('MCP:EditorTool', 'Failed to replace text', e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error replacing text: ${e.message}`
        }]
      }
    }
  }
}
