import fsp from 'fs/promises'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const readFile: MCPToolHandler = {
  definition: {
    name: 'read_file',
    description: 'Reads the content of a file from the workspace. Use this to understand existing code before making changes.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the file to read, relative to the workspace root.'
        }
      },
      required: ['path']
    }
  },

  execute: async (args: { path: string }): Promise<MCPToolResult> => {
    try {
      const fullPath = PathGuard.validate(args.path)
      const content = await fsp.readFile(fullPath, 'utf-8')

      logger.info('MCP:FileTool', `File read: ${args.path}`)

      return {
        content: [{
          type: 'text',
          text: content
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to read file: ${args.path}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error reading file: ${e.message}`
        }]
      }
    }
  }
}
