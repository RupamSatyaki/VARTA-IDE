import fsp from 'fs/promises'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const listDirectory: MCPToolHandler = {
  definition: {
    name: 'list_directory',
    description: 'Lists the contents of a directory. Use this to explore the project structure.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the directory to list, relative to the workspace root.'
        }
      },
      required: ['path']
    }
  },

  execute: async (args: { path: string }): Promise<MCPToolResult> => {
    try {
      const fullPath = PathGuard.validate(args.path)
      const entries = await fsp.readdir(fullPath, { withFileTypes: true })

      const result = entries.map(entry => {
        return `${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`
      }).join('\n')

      logger.info('MCP:FileTool', `Directory listed: ${args.path}`)

      return {
        content: [{
          type: 'text',
          text: result || '(empty directory)'
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to list directory: ${args.path}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error listing directory: ${e.message}`
        }]
      }
    }
  }
}
