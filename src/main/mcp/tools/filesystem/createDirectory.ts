import fsp from 'fs/promises'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const createDirectory: MCPToolHandler = {
  definition: {
    name: 'create_directory',
    description: 'Creates a new directory and any necessary parent directories.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the directory to create, relative to the workspace root.'
        }
      },
      required: ['path']
    }
  },

  execute: async (args: { path: string }): Promise<MCPToolResult> => {
    try {
      const fullPath = PathGuard.validate(args.path)
      
      await fsp.mkdir(fullPath, { recursive: true })

      logger.info('MCP:FileTool', `Directory created: ${args.path}`)

      return {
        content: [{
          type: 'text',
          text: `Successfully created directory at ${args.path}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to create directory: ${args.path}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error creating directory: ${e.message}`
        }]
      }
    }
  }
}
