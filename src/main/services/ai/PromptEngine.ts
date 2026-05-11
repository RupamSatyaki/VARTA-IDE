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

    // 1. Active File
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

    // 2. Relevant Files (Massive Context)
    if (context.relevantFiles.length > 0) {
      lines.push('#### Related Project Files:')
      for (const file of context.relevantFiles) {
        lines.push(`Path: ${file.path}`)
        lines.push('```' + file.language)
        lines.push(file.content)
        lines.push('```')
        lines.push('')
      }
    }

    lines.push('### RESPONSE GUIDELINES')
    lines.push('1. **Conciseness**: Avoid filler phrases like "Certainly!" or "I hope this helps."')
    lines.push('2. **Code blocks**: Always use markdown code blocks for snippets (if not using tools).')
    lines.push('3. **MCP TOOLS (CRITICAL)**: You have access to real-time tools for workspace operations.')
    lines.push('   - **list_directory**: Use this to explore folders and find relevant files.')
    lines.push('   - **read_file**: Use this to read the content of ANY file in the project. Always read before suggesting changes.')
    lines.push('   - **write_file / create_file**: Use these to create, update, or overwrite files.')
    lines.push('   - **delete_file**: Use this to remove unwanted files (use with caution).')
    lines.push('   - **run_command**: Use this to execute shell commands (npm install, tests, build, etc.).')
    lines.push('   - **git_status**: Use this to see the current state of the repository.')
    lines.push('   - **Workflow**: 1. Explore (list_directory) -> 2. Read (read_file) -> 3. Modify (write_file) -> 4. Verify (run_command/git_status).')
    lines.push('   - **Success Summary**: After using a tool, explain briefly what was achieved.')
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
