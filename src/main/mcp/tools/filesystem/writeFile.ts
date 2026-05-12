import fsp from 'fs/promises'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const writeFile: MCPToolHandler = {
  definition: {
    name: 'write_file',
    description: 'Writes content to an existing file or overwrites it. Use this for modifying code.',
    dangerous: true,
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the file to write, relative to the workspace root.'
        },
        content: {
          type: 'string',
          description: 'The new content for the file.'
        }
      },
      required: ['path', 'content']
    }
  },

  execute: async (args: { path: string; content: string }): Promise<MCPToolResult> => {
    try {
      const fullPath = PathGuard.validate(args.path)
      await fsp.writeFile(fullPath, args.content, 'utf-8')

      logger.info('MCP:FileTool', `File written: ${args.path}`)

      return {
        content: [{
          type: 'text',
          text: `Successfully wrote to ${args.path}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to write file: ${args.path}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error writing file: ${e.message}`
        }]
      }
    }
  }
}
