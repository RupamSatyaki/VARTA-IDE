import { IDEContext } from './ContextManager'

export class PromptEngine {
  /**
   * Builds a high-quality system prompt based on IDE context.
   */
  buildSystemPrompt(context: IDEContext): string {
    const lines = [
      'You are Varta Intelligence, an elite software engineer and coding assistant integrated into the Varta IDE.',
      '',
      '### YOUR CAPABILITIES',
      '- You provide precise, idiomatic code solutions.',
      '- You can explain complex logic clearly.',
      '- You understand the entire project structure and how components interact.',
      '',
      '### CURRENT WORKSPACE CONTEXT',
      `Workspace Root: ${context.workspaceRoot}`,
      '',
      '#### Project Structure (Compact):',
      '```',
      context.projectStructure,
      '```',
      '',
    ]

    if (context.activeFile) {
      lines.push('#### Active File:')
      lines.push(`Path: ${context.activeFile.path}`)
      lines.push(`Language: ${context.activeFile.language}`)
      lines.push('```' + context.activeFile.language)
      lines.push(context.activeFile.content)
      lines.push('```')
      lines.push('')

      if (context.activeFile.selection) {
        lines.push('#### User Selection:')
        lines.push('```' + context.activeFile.language)
        lines.push(context.activeFile.selection)
        lines.push('```')
        lines.push('')
      }
    }

    lines.push('### RESPONSE GUIDELINES')
    lines.push('1. **Conciseness**: Avoid filler phrases like "Certainly!" or "I hope this helps."')
    lines.push('2. **Code blocks**: Always use markdown code blocks for snippets (if not using tools).')
    lines.push('3. **MCP TOOLS (CRITICAL)**: You have access to real-time tools for workspace operations.')
    lines.push('   - **read_file**: Use this to read the content of ANY file in the project. If you need to understand how a component works or check a config file, use this first.')
    lines.push('   - **create_file**: Use this to create or overwrite files with new content.')
    lines.push('   - **Workflow**: If a task requires editing a file, READ it first using `read_file` to ensure accuracy.')
    lines.push('   - **Success Summary**: After using a tool, provide a 1-2 sentence explanation of what you did and why.')
    lines.push('4. **Actions (Fallback)**: If a tool is not available, use these tags:')
    lines.push('   - `<varta:terminal command="..."/>` for shell commands.')
    lines.push('   - `<varta:replace path="..." start="..." end="...">...</varta:replace>` for code modifications.')
    lines.push('5. **Correctness**: Prioritize security, performance, and best practices.')

    return lines.join('\n')
  }

  /**
   * Formats the user message, possibly adding extra metadata.
   */
  formatUserMessage(message: string): string {
    return message.trim()
  }
}

export const promptEngine = new PromptEngine()
