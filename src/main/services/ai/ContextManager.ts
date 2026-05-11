import path from 'path'
import fsp from 'fs/promises'
import { logger } from '../../utils/logger'

export interface IDEContext {
  activeFile?: {
    path: string
    content: string
    language: string
    selection?: string
  }
  relevantFiles: Array<{
    path: string
    content: string
    language: string
  }>
  openTabs: string[]
  projectStructure: string // Compact tree string
  workspaceRoot: string
}

export class ContextManager {
  /**
   * Generates a deeper representation of the project structure.
   */
  async getProjectStructure(rootPath: string, depth = 5): Promise<string> {
    try {
      const tree: string[] = []
      await this.walk(rootPath, '', 0, depth, tree)
      return tree.join('\n')
    } catch (e) {
      logger.error('ContextManager', 'Failed to get project structure', e)
      return 'Error gathering project structure'
    }
  }

  private async walk(dir: string, prefix: string, currentDepth: number, maxDepth: number, tree: string[]) {
    if (currentDepth > maxDepth) return

    const ignoreList = ['node_modules', '.git', 'dist', 'build', 'out', '.next', '.vite']
    const entries = await fsp.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (ignoreList.includes(entry.name)) continue
      if (entry.name.startsWith('.')) continue

      tree.push(`${prefix}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`)
      
      if (entry.isDirectory()) {
        await this.walk(
          path.join(dir, entry.name),
          prefix + '  ',
          currentDepth + 1,
          maxDepth,
          tree
        )
      }
    }
  }

  /**
   * Gathers all available context for the AI, including multiple related files.
   */
  async gatherContext(
    rootPath: string, 
    activeFilePath?: string, 
    selection?: string,
    additionalFiles: string[] = []
  ): Promise<IDEContext> {
    const context: IDEContext = {
      workspaceRoot: rootPath,
      projectStructure: await this.getProjectStructure(rootPath),
      openTabs: [],
      relevantFiles: []
    }

    // 1. Process Active File (Increased limit to 100k chars for massive context)
    if (activeFilePath) {
      try {
        const fullPath = path.isAbsolute(activeFilePath) ? activeFilePath : path.join(rootPath, activeFilePath)
        const content = await fsp.readFile(fullPath, 'utf-8')
        context.activeFile = {
          path: activeFilePath,
          content: content.slice(0, 100000), 
          language: path.extname(activeFilePath).slice(1),
          selection
        }
      } catch (e) {
        logger.warn('ContextManager', `Could not read active file: ${activeFilePath}`)
      }
    }

    // 2. Process Additional/Relevant Files
    const uniqueFiles = [...new Set(additionalFiles)].filter(f => f !== activeFilePath)
    for (const filePath of uniqueFiles) {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootPath, filePath)
        const content = await fsp.readFile(fullPath, 'utf-8')
        context.relevantFiles.push({
          path: filePath,
          content: content.slice(0, 50000),
          language: path.extname(filePath).slice(1)
        })
      } catch (e) {
        logger.warn('ContextManager', `Could not read relevant file: ${filePath}`)
      }
    }

    return context
  }
}

export const contextManager = new ContextManager()
