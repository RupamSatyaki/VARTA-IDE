import fsp from 'fs/promises'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const deleteDirectory: MCPToolHandler = {
  definition: {
    name: 'delete_directory',
    description: 'Deletes a directory and its contents.',
    dangerous: true,
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the directory to delete, relative to the workspace root.'
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to delete recursively. Defaults to true.',
          default: true
        }
      },
      required: ['path']
    }
  },

  execute: async (args: { path: string; recursive?: boolean }): Promise<MCPToolResult> => {
    try {
      const fullPath = PathGuard.validate(args.path)
      const recursive = args.recursive !== false
      
      await fsp.rm(fullPath, { recursive, force: true })

      logger.info('MCP:FileTool', `Directory deleted: ${args.path}`)

      return {
        content: [{
          type: 'text',
          text: `Successfully deleted directory at ${args.path}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to delete directory: ${args.path}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error deleting directory: ${e.message}`
        }]
      }
    }
  }
}
