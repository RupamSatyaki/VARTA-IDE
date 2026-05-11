import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { gitService } from '../../../services/GitService'

export const stageFiles: MCPToolHandler = {
  definition: {
    name: 'git_stage',
    description: 'Stages files for commit.',
    inputSchema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths of the files to stage.'
        }
      },
      required: ['paths']
    }
  },

  execute: async (args: { paths: string[] }): Promise<MCPToolResult> => {
    try {
      if (!gitService.isRepo()) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'Not a git repository. Please ensure a repository is open.'
          }]
        }
      }

      await gitService.add(args.paths)
      logger.info('MCP:GitTool', `Staged ${args.paths.length} files`)

      return {
        content: [{
          type: 'text',
          text: `Successfully staged ${args.paths.length} files.`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:GitTool', 'Failed to stage files', e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error staging files: ${e.message}`
        }]
      }
    }
  }
}
