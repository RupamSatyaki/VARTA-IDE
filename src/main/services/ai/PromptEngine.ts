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
    lines.push('2. **Code blocks**: Always use markdown code blocks with the correct language tag.')
    lines.push('3. **Actions**: Use special tags for IDE actions:')
    lines.push('   - Use `<varta:terminal command="..."/>` to suggest shell commands.')
    lines.push('   - Use `<varta:replace path="..." start="..." end="...">...</varta:replace>` for code modifications.')
    lines.push('4. **Correctness**: Prioritize security, performance, and best practices.')

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
