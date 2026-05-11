import fsp from 'fs/promises'
import path from 'path'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const createFile: MCPToolHandler = {
  definition: {
    name: 'create_file',
    description: 'Creates a new file with the specified content. Automatically creates parent directories if they do not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path where the file should be created, relative to the workspace root.'
        },
        content: {
          type: 'string',
          description: 'The content to write into the file.'
        }
      },
      required: ['path', 'content']
    }
  },

  execute: async (args: { path: string; content: string }): Promise<MCPToolResult> => {
    try {
      const fullPath = PathGuard.validate(args.path)
      
      const dir = path.dirname(fullPath)
      await fsp.mkdir(dir, { recursive: true })
      await fsp.writeFile(fullPath, args.content, 'utf-8')

      logger.info('MCP:FileTool', `File created: ${args.path}`)

      return {
        content: [{
          type: 'text',
          text: `Successfully created file at ${args.path}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to create file: ${args.path}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error creating file: ${e.message}`
        }]
      }
    }
  }
}
