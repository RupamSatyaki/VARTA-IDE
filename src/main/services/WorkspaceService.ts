import path from 'path'
import fsp from 'fs/promises'
import { app } from 'electron'
import { createHash } from 'crypto'
import {
  WorkspaceLayout, WorkspaceTabs, WorkspaceExplorer,
  WorkspaceSession, LastProjectSession
} from '../../shared/types/workspace.types'
import { logger } from '../utils/logger'

export class WorkspaceService {
  private workspacesDir: string = ''
  private lastProjectFile: string = ''
  private activeFilePath: string | null = null
  private projectRoot: string | null = null

  init(): void {
    const userData = app.getPath('userData')
    this.workspacesDir = path.join(userData, 'workspaces')
    this.lastProjectFile = path.join(this.workspacesDir, 'last-project.json')
    logger.info('WorkspaceService', 'Initialized')
  }

  setProjectRoot(path: string | null): void {
    this.projectRoot = path
    logger.info('WorkspaceService', `Project root set to: ${path}`)
  }

  getProjectRoot(): string | null {
    return this.projectRoot
  }

  setActiveFile(path: string | null): void {
    this.activeFilePath = path
    logger.debug('WorkspaceService', `Active file set to: ${path}`)
  }

  getActiveFile(): string | null {
    return this.activeFilePath
  }

  async ensureDir(dir: string): Promise<void> {
    try {
      await fsp.mkdir(dir, { recursive: true })
    } catch (e) {
      logger.error('WorkspaceService', `Failed to ensure directory: ${dir}`, e)
    }
  }

  private getProjectId(projectPath: string): string {
    // Sanitize the path to use as a folder name, or use a hash
    // Hash is safer for long paths and cross-platform consistency
    return createHash('md5').update(projectPath).digest('hex')
  }

  private getProjectDir(projectPath: string): string {
    return path.join(this.workspacesDir, this.getProjectId(projectPath))
  }

  // ── Last Project ──────────────────────────────────────────────────────────

  async getLastProjectPath(): Promise<string | null> {
    try {
      const content = await fsp.readFile(this.lastProjectFile, 'utf-8')
      const data = JSON.parse(content) as LastProjectSession
      return data.path
    } catch {
      return null
    }
  }

  async saveLastProjectPath(projectPath: string | null): Promise<void> {
    try {
      await this.ensureDir(this.workspacesDir)
      const data: LastProjectSession = { path: projectPath }
      await fsp.writeFile(this.lastProjectFile, JSON.stringify(data, null, 2))
    } catch (e) {
      logger.error('WorkspaceService', 'Failed to save last project path', e)
    }
  }

  // ── Session Loading ───────────────────────────────────────────────────────

  async loadSession(projectPath: string): Promise<WorkspaceSession> {
    const projectDir = this.getProjectDir(projectPath)
    const session: WorkspaceSession = { projectPath }

    try {
      const layoutPath = path.join(projectDir, 'layout.json')
      const tabsPath = path.join(projectDir, 'tabs.json')
      const explorerPath = path.join(projectDir, 'explorer.json')

      const [layoutRaw, tabsRaw, explorerRaw] = await Promise.allSettled([
        fsp.readFile(layoutPath, 'utf-8'),
        fsp.readFile(tabsPath, 'utf-8'),
        fsp.readFile(explorerPath, 'utf-8'),
      ])

      if (layoutRaw.status === 'fulfilled') {
        session.layout = JSON.parse(layoutRaw.value)
      }
      if (tabsRaw.status === 'fulfilled') {
        session.tabs = JSON.parse(tabsRaw.value)
      }
      if (explorerRaw.status === 'fulfilled') {
        session.explorer = JSON.parse(explorerRaw.value)
      }
    } catch (e) {
      logger.error('WorkspaceService', `Failed to load session for ${projectPath}`, e)
    }

    return session
  }

  // ── Partial Saves ─────────────────────────────────────────────────────────

  async saveLayout(projectPath: string, layout: WorkspaceLayout): Promise<void> {
    const projectDir = this.getProjectDir(projectPath)
    await this.ensureDir(projectDir)
    await fsp.writeFile(path.join(projectDir, 'layout.json'), JSON.stringify(layout, null, 2))
  }

  async saveTabs(projectPath: string, tabs: WorkspaceTabs): Promise<void> {
    const projectDir = this.getProjectDir(projectPath)
    await this.ensureDir(projectDir)
    await fsp.writeFile(path.join(projectDir, 'tabs.json'), JSON.stringify(tabs, null, 2))
  }

  async saveExplorer(projectPath: string, explorer: WorkspaceExplorer): Promise<void> {
    const projectDir = this.getProjectDir(projectPath)
    await this.ensureDir(projectDir)
    await fsp.writeFile(path.join(projectDir, 'explorer.json'), JSON.stringify(explorer, null, 2))
  }

  destroy(): void {
    logger.info('WorkspaceService', 'Destroyed')
  }
}

export const workspaceService = new WorkspaceService()
