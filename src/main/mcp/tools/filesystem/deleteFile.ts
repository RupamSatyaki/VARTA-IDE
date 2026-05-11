import fsp from 'fs/promises'
import fsp from 'fs/promises'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'
import { ConfirmationGate } from '../../sandbox/ConfirmationGate'

export const deleteFile: MCPToolHandler = {
  definition: {
    name: 'delete_file',
    description: 'Deletes a file from the workspace. Requires user confirmation.',
    dangerous: true,
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the file to delete, relative to the workspace root.'
        }
      },
      required: ['path']
    }
  },

  execute: async (args: { path: string }): Promise<MCPToolResult> => {
    try {
      const fullPath = PathGuard.validate(args.path)

      const confirmed = await ConfirmationGate.confirm(
        `Are you sure you want to delete the file: ${args.path}?`,
        'This action cannot be undone.'
      )

      if (!confirmed) {
        return {
          content: [{ type: 'text', text: 'Operation cancelled by user.' }]
        }
      }

      await fsp.unlink(fullPath)
      logger.info('MCP:FileTool', `File deleted: ${args.path}`)


      return {
        content: [{
          type: 'text',
          text: `Successfully deleted ${args.path}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:FileTool', `Failed to delete file: ${args.path}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error deleting file: ${e.message}`
        }]
      }
    }
  }
}
