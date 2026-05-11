import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { gitService } from '../../../services/GitService'

export const commit: MCPToolHandler = {
  definition: {
    name: 'git_commit',
    description: 'Creates a new git commit with the specified message. Requires user confirmation.',
    dangerous: true,
    inputSchema: {

      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The commit message.'
        },
        amend: {
          type: 'boolean',
          description: 'Whether to amend the last commit.'
        },
        signOff: {
          type: 'boolean',
          description: 'Whether to add a Signed-off-by line at the end of the commit message.'
        }
      },
      required: ['message']
    }
  },

  execute: async (args: { message: string, amend?: boolean, signOff?: boolean }): Promise<MCPToolResult> => {
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

      await gitService.commit({
        message: args.message,
        amend: args.amend,
        signOff: args.signOff
      })
      logger.info('MCP:GitTool', 'Created commit')

      return {
        content: [{
          type: 'text',
          text: 'Successfully created commit.'
        }]
      }
    } catch (e: any) {
      logger.error('MCP:GitTool', 'Failed to commit', e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error creating commit: ${e.message}`
        }]
      }
    }
  }
}
