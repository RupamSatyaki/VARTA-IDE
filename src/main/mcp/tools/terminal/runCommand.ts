import { exec } from 'child_process'
import { MCPToolHandler, MCPToolResult } from '../../../../shared/types/mcp.types'
import { logger } from '../../../utils/logger'
import { PathGuard } from '../../sandbox/PathGuard'
import { CommandFilter } from '../../sandbox/CommandFilter'

export const runCommand: MCPToolHandler = {
  definition: {
    name: 'run_command',
    description: 'Executes a shell command in the workspace root. Use this to run tests, build projects, or execute scripts.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute.'
        }
      },
      required: ['command']
    }
  },

  execute: async (args: { command: string }): Promise<MCPToolResult> => {
    try {
      CommandFilter.validate(args.command)
      const root = PathGuard.getRoot()
      logger.info('MCP:TerminalTool', `Executing command: ${args.command}`)

      return new Promise((resolve) => {
        exec(args.command, { cwd: root, timeout: 60000 }, (error, stdout, stderr) => {
          if (error) {
            logger.error('MCP:TerminalTool', `Command failed: ${args.command}`, error)
            resolve({
              isError: true,
              content: [
                { type: 'text', text: `Command failed with exit code ${error.code}` },
                { type: 'text', text: `STDOUT: ${stdout}` },
                { type: 'text', text: `STDERR: ${stderr}` }
              ]
            })
          } else {
            logger.info('MCP:TerminalTool', `Command succeeded: ${args.command}`)
            resolve({
              content: [
                { type: 'text', text: stdout || '(no output)' },
                { type: 'text', text: stderr ? `STDERR: ${stderr}` : '' }
              ].filter(c => c.text !== '')
            })
          }
        })
      })
    } catch (e: any) {
      logger.error('MCP:TerminalTool', `Failed to run command: ${args.command}`, e)
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error executing command: ${e.message}`
        }]
      }
    }
  }
}
