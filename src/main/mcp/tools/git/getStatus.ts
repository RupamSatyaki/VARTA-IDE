import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { gitService } from '../../../services/GitService'

export const getStatus: MCPToolHandler = {
  definition: {
    name: 'git_status',
    description: 'Returns the current git status of the workspace, including staged, unstaged, and untracked files.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  execute: async (): Promise<MCPToolResult> => {
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

      const status = await gitService.status()
      
      const summary = [
        `Branch: ${status.branch}`,
        `Clean: ${status.isClean}`,
        `Staged: ${status.staged.length} files`,
        `Unstaged: ${status.unstaged.length} files`,
        `Untracked: ${status.untracked.length} files`,
      ].join('\n')

      const details = status.staged.map(f => `[Staged] ${f.path}`).join('\n') + 
                      '\n' + 
                      status.unstaged.map(f => `[Unstaged] ${f.path}`).join('\n') +
                      '\n' +
                      status.untracked.map(f => `[Untracked] ${f.path}`).join('\n')

      logger.info('MCP:GitTool', 'Git status retrieved')

      return {
        content: [{
          type: 'text',
          text: `${summary}\n\nDetails:\n${details.trim() || 'No changes.'}`
        }]
      }
    } catch (e: any) {
      logger.error('MCP:GitTool', 'Failed to get git status', e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error getting git status: ${e.message}`
        }]
      }
    }
  }
}
