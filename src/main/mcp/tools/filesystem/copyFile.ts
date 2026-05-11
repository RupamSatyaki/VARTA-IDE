import fsp from 'fs/promises'
import path from 'path'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const copyFile: MCPToolHandler = {
  definition: {
    name: 'copy_file',
    description: 'Copies a file from source to destination.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'The path of the source file, relative to the workspace root.'
        },
        destination: {
          type: 'string',
          description: 'The path of the destination, relative to the workspace root.'
        }
      },
      required: ['source', 'destination']
    }
  },

  execute: async (args: { source: string; destination: string }): Promise<MCPToolResult> => {
    try {
      const fullSourcePath = PathGuard.validate(args.source)
      const fullDestPath = PathGuard.validate(args.destination)
      
      const destDir = path.dirname(fullDestPath)
      await fsp.mkdir(destDir, { recursive: true })
      await fsp.copyFile(fullSourcePath, fullDestPath)

      logger.info('MCP:FileTool', `Copied: ${args.source} -> ${args.destination}`)

      return {
        content: [{
          type: 'text',
          text: `Successfully copied ${args.source} to ${args.destination}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to copy: ${args.source}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error copying file: ${e.message}`
        }]
      }
    }
  }
}
