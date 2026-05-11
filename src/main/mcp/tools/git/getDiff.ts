import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { gitService } from '../../../services/GitService'

export const getDiff: MCPToolHandler = {
  definition: {
    name: 'git_diff',
    description: 'Returns the diff of staged or unstaged changes.',
    inputSchema: {
      type: 'object',
      properties: {
        staged: {
          type: 'boolean',
          description: 'Whether to get the diff of staged changes. If false, returns unstaged changes.'
        },
        path: {
          type: 'string',
          description: 'Optional path to a specific file or directory.'
        }
      }
    }
  },

  execute: async (args: { staged?: boolean, path?: string }): Promise<MCPToolResult> => {
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

      const diff = await gitService.diff(args.path, args.staged ?? false)
      logger.info('MCP:GitTool', `Git diff retrieved (staged: ${args.staged ?? false})`)

      return {
        content: [{
          type: 'text',
          text: diff || 'No differences.'
        }]
      }
    } catch (e: any) {
      logger.error('MCP:GitTool', 'Failed to get git diff', e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error getting git diff: ${e.message}`
        }]
      }
    }
  }
}
