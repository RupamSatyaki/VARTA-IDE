import vm from 'vm'
import path from 'path'
import fs from 'fs'
import fsp from 'fs/promises'
import * as ts from 'typescript'
import { VartaExtensionAPI, ExtensionContext, Disposable } from './api.types'
import { logger } from '../utils/logger'
import { ExtensionInfo } from '../../shared/types/extension.types'

import { workspaceService } from '../services/WorkspaceService'
import { fileService } from '../services/FileService'

export class ExtensionHost {
  private activeExtensions = new Map<string, {
    context: ExtensionContext,
    exports: any
  }>()

  private commands = new Map<string, (...args: any[]) => any>()
  private moduleCache = new Map<string, any>()

  constructor(private mainWindow: any) {}

  /**
   * Activates an extension by loading its main entry point in a sandbox.
   */
  async activate(info: ExtensionInfo): Promise<void> {
    const { manifest, installPath } = info
    if (this.activeExtensions.has(manifest.id)) return

    if (!manifest.main) {
      logger.warn('ExtensionHost', `Extension ${manifest.id} has no main entry point.`)
      return
    }

    const entryPath = path.join(installPath, manifest.main)
    try {
      const context: ExtensionContext = {
        subscriptions: [],
        extensionPath: installPath,
        storagePath: path.join(installPath, 'storage'),
        globalStoragePath: path.join(installPath, 'globalStorage'),
        logPath: path.join(installPath, 'logs')
      }

      const api = this.createAPI(info, context)
      const extensionModule = this.loadModule(entryPath, info, context, api)

      if (typeof extensionModule.activate === 'function') {
        await extensionModule.activate(context)
      }

      this.activeExtensions.set(manifest.id, {
        context,
        exports: extensionModule
      })

      logger.info('ExtensionHost', `Activated extension: ${manifest.id}`)
    } catch (e: any) {
      logger.error('ExtensionHost', `Failed to activate extension ${manifest.id}`, e)
      throw e
    }
  }

  /**
   * Recursive module loader for the sandbox.
   */
  private loadModule(filePath: string, info: ExtensionInfo, context: ExtensionContext, api: any): any {
    const resolvedPath = this.resolvePath(filePath)
    if (this.moduleCache.has(resolvedPath)) {
      return this.moduleCache.get(resolvedPath).exports
    }

    let code = fs.readFileSync(resolvedPath, 'utf-8')

    // On-the-fly transpilation for TypeScript or ESM
    if (resolvedPath.endsWith('.ts') || code.includes('export ')) {
      try {
        const result = ts.transpileModule(code, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ESNext,
            allowJs: true,
            skipLibCheck: true,
            esModuleInterop: true
          }
        })
        code = result.outputText
      } catch (e) {
        logger.error('ExtensionHost', `Transpilation failed for ${resolvedPath}`, e)
      }
    }

    const module = { exports: {} }
    const dirname = path.dirname(resolvedPath)

    const requireShim = (mod: string) => {
      // 1. VS Code API Shim
      if (mod === 'vscode') return api
      
      // 2. Allowed Node.js Core Modules
      const allowed = [
        'path', 'url', 'events', 'fs', 'os', 'util', 'crypto', 
        'stream', 'buffer', 'http', 'https', 'zlib', 'net', 'tls', 'child_process'
      ]
      if (allowed.includes(mod)) return require(mod)

      // 3. Relative Imports
      if (mod.startsWith('.')) {
        const targetPath = path.resolve(dirname, mod)
        return this.loadModule(targetPath, info, context, api)
      }

      // 4. Local node_modules or nested files in extension
      try {
        // Use Node's own resolution logic but restricted to the extension's paths
        const resolved = require.resolve(mod, { 
          paths: [
            path.join(info.installPath, 'node_modules'),
            dirname
          ] 
        })
        return require(resolved)
      } catch (e) {
        // Fall through to specific shims or error
      }

      // 5. Common optional dependencies shims (return mock to avoid crashes)
      if (mod.startsWith('vsls')) {
        return {
          getApi: () => Promise.resolve(null),
          getApiAsync: () => Promise.resolve(null)
        }
      }

      const err = new Error(`Cannot find module '${mod}'`)
      ;(err as any).code = 'MODULE_NOT_FOUND'
      throw err
    }

    const sandbox: any = {
      varta: api,
      console: {
        log: (...args: any[]) => logger.info(`Ext:${info.manifest.id}`, ...args),
        error: (...args: any[]) => logger.error(`Ext:${info.manifest.id}`, ...args),
        warn: (...args: any[]) => logger.warn(`Ext:${info.manifest.id}`, ...args),
      },
      Buffer,
      URL,
      TextEncoder,
      TextDecoder,
      process: {
        platform: process.platform,
        arch: process.arch,
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV },
        nextTick: process.nextTick,
        cwd: () => info.installPath,
        argv: [process.execPath, resolvedPath],
        execPath: process.execPath,
        stdin:  { on: () => {} },
        stdout: { write: () => {} },
        stderr: { write: () => {} },
      },
      exports: module.exports,
      module: module,
      require: requireShim,
      __filename: resolvedPath,
      __dirname: dirname,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      setImmediate,
      clearImmediate,
    }

    // Circular reference for global/globalThis
    sandbox.global = sandbox
    sandbox.globalThis = sandbox

    vm.createContext(sandbox)
    vm.runInContext(code, sandbox, { filename: resolvedPath })
    
    this.moduleCache.set(resolvedPath, module)
    return module.exports
  }

  private resolvePath(p: string): string {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
    if (fs.existsSync(p + '.ts')) return p + '.ts'
    if (fs.existsSync(p + '.js')) return p + '.js'
    if (fs.existsSync(path.join(p, 'index.ts'))) return path.join(p, 'index.ts')
    if (fs.existsSync(path.join(p, 'index.js'))) return path.join(p, 'index.js')
    throw new Error(`Module not found: ${p}`)
  }

  private createAPI(info: ExtensionInfo, context: ExtensionContext): any {
    const StatusBarAlignment = { Left: 1, Right: 2 }
    
    const api = {
      // ── Enums (Top level in VS Code API) ──────────────────────────────────
      StatusBarAlignment,
      ViewColumn: {
        Active: -1, Beside: -2, One: 1, Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7, Eight: 8, Nine: 9
      },
      TextEditorRevealType: {
        Default: 0, InCenter: 1, InCenterIfOutsideViewport: 2, AtTop: 3
      },
      ConfigurationTarget: {
        Global: 1, Workspace: 2, WorkspaceFolder: 3
      },
      TreeItemCollapsibleState: {
        None: 0, Collapsed: 1, Expanded: 2
      },

      commands: {
        registerCommand: (id: string, callback: (...args: any[]) => any) => {
          this.commands.set(id, callback)
          this.mainWindow.webContents.send('EXTENSION:REGISTER_COMMAND', {
            id,
            extensionId: info.manifest.id,
            label: id
          })
          const disposable: Disposable = { dispose: () => this.commands.delete(id) }
          context.subscriptions.push(disposable)
          return disposable
        },
        executeCommand: async (id: string, ...args: any[]) => {
          return this.executeCommand(id, ...args)
        }
      },
      window: {
        StatusBarAlignment,
        createStatusBarItem: (alignment?: any, priority?: number) => ({
          alignment: alignment || 1,
          priority: priority || 0,
          text: '',
          tooltip: '',
          command: '',
          color: '',
          backgroundColor: '',
          show: () => {},
          hide: () => {},
          dispose: () => {}
        }),
        get activeTextEditor() {
          const activeFile = workspaceService.getActiveFile()
          if (!activeFile) return undefined
          return {
            document: {
              uri: { fsPath: activeFile, scheme: 'file', toString: () => `file://${activeFile}` },
              fileName: activeFile,
              getText: () => {
                try {
                  // Synchronous read for the shim, as VS Code API is often sync here
                  return fs.readFileSync(activeFile, 'utf-8')
                } catch (e) {
                  return ''
                }
              }
            }
          }
        },
        showMessage: (msg: string) => this.mainWindow.webContents.send('DIALOG:SHOW_MESSAGE', { message: msg }),
        showErrorMessage: (msg: string) => this.mainWindow.webContents.send('DIALOG:SHOW_ERROR', { message: msg }),
        showInformationMessage: (msg: string) => this.mainWindow.webContents.send('DIALOG:SHOW_MESSAGE', { message: msg }),
        createOutputChannel: (name: string) => ({
          appendLine: (line: string) => logger.info(`Ext:${info.manifest.id}:Output:${name}`, line),
          show: () => {},
          dispose: () => {}
        })
      },
      workspace: {
        get rootPath() {
          return workspaceService.getProjectRoot()
        },
        onDidOpenTextDocument: () => ({ dispose: () => {} }),
        getConfiguration: () => ({
          get: (key: string, defaultValue: any) => defaultValue,
          has: () => false,
          update: () => Promise.resolve()
        })
      },
      // Placeholders for VS Code compatibility
      EventEmitter: class {
        private listeners: any[] = []
        event = (listener: any) => { this.listeners.push(listener); return { dispose: () => {} } }
        fire(data: any) { this.listeners.forEach(l => l(data)) }
      },
      Uri: {
        file: (p: string) => ({ fsPath: p, scheme: 'file' }),
        parse: (s: string) => ({ fsPath: s, scheme: 'unknown' })
      },
      Range: class { constructor(public start: any, public end: any) {} },
      Position: class { constructor(public line: number, public character: number) {} },
      Location: class { constructor(public uri: any, public range: any) {} },
      ThemeColor: class { constructor(public id: string) {} },
      Disposable: class { 
        constructor(private callOnDispose: () => any) {}
        dispose() { this.callOnDispose() }
        static from(...disposables: { dispose(): any }[]) {
          return { dispose: () => disposables.forEach(d => d.dispose()) }
        }
      }
    }
    return api
  }

  async executeCommand(id: string, ...args: any[]): Promise<any> {
    let callback = this.commands.get(id)
    
    if (!callback) {
      const extId = extensionService.getOwnerOfCommand(id)
      if (extId) {
        logger.info('ExtensionHost', `Auto-activating extension ${extId} for command ${id}`)
        const info = extensionService.list().find(e => e.manifest.id === extId)
        if (info && info.status === 'enabled') {
          await this.activate(info)
          callback = this.commands.get(id)
        }
      }
    }

    if (callback) return await callback(...args)
    throw new Error(`Command not found: ${id}`)
  }

  async deactivate(id: string): Promise<void> {
    const ext = this.activeExtensions.get(id)
    if (ext) {
      if (typeof ext.exports.deactivate === 'function') {
        await ext.exports.deactivate()
      }
      for (const sub of ext.context.subscriptions) sub.dispose()
      this.activeExtensions.delete(id)
      logger.info('ExtensionHost', `Deactivated extension: ${id}`)
    }
  }
}

