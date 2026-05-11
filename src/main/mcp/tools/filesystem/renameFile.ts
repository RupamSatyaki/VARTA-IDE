import fsp from 'fs/promises'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'

export const renameFile: MCPToolHandler = {
  definition: {
    name: 'rename_file',
    description: 'Renames or moves a file or directory.',
    inputSchema: {
      type: 'object',
      properties: {
        oldPath: {
          type: 'string',
          description: 'The current path of the file or directory, relative to the workspace root.'
        },
        newPath: {
          type: 'string',
          description: 'The new path for the file or directory, relative to the workspace root.'
        }
      },
      required: ['oldPath', 'newPath']
    }
  },

  execute: async (args: { oldPath: string; newPath: string }): Promise<MCPToolResult> => {
    try {
      const fullOldPath = PathGuard.validate(args.oldPath)
      const fullNewPath = PathGuard.validate(args.newPath)
      
      await fsp.rename(fullOldPath, fullNewPath)

      logger.info('MCP:FileTool', `Renamed: ${args.oldPath} -> ${args.newPath}`)

      return {
        content: [{
          type: 'text',
          text: `Successfully renamed ${args.oldPath} to ${args.newPath}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to rename: ${args.oldPath}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error renaming file: ${e.message}`
        }]
      }
    }
  }
}
