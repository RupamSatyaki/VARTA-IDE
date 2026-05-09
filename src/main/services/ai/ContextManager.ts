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
  openTabs: string[]
  projectStructure: string // Compact tree string
  workspaceRoot: string
}

export class ContextManager {
  /**
   * Generates a compact string representation of the project structure.
   * Skips ignored directories like node_modules.
   */
  async getProjectStructure(rootPath: string, depth = 2): Promise<string> {
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
   * Gathers all available context for the AI.
   */
  async gatherContext(rootPath: string, activeFilePath?: string, selection?: string): Promise<IDEContext> {
    const context: IDEContext = {
      workspaceRoot: rootPath,
      projectStructure: await this.getProjectStructure(rootPath),
      openTabs: [] // This might need info from the renderer via IPC
    }

    if (activeFilePath) {
      try {
        const fullPath = path.isAbsolute(activeFilePath) ? activeFilePath : path.join(rootPath, activeFilePath)
        const content = await fsp.readFile(fullPath, 'utf-8')
        context.activeFile = {
          path: activeFilePath,
          content: content.slice(0, 10000), // Limit content size
          language: path.extname(activeFilePath).slice(1),
          selection
        }
      } catch (e) {
        logger.warn('ContextManager', `Could not read active file: ${activeFilePath}`)
      }
    }

    return context
  }
}

export const contextManager = new ContextManager()
