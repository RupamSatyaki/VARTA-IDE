import vm from 'vm'
import path from 'path'
import fsp from 'fs/promises'
import { VartaExtensionAPI, ExtensionContext, Disposable } from './api.types'
import { logger } from '../utils/logger'
import { ExtensionInfo } from '../../shared/types/extension.types'

export class ExtensionHost {
  private activeExtensions = new Map<string, {
    context: ExtensionContext,
    exports: any
  }>()

  private commands = new Map<string, (...args: any[]) => any>()

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
      const code = await fsp.readFile(entryPath, 'utf-8')
      
      const context: ExtensionContext = {
        subscriptions: [],
        extensionPath: installPath,
        storagePath: path.join(installPath, 'storage'),
        globalStoragePath: path.join(installPath, 'globalStorage'),
        logPath: path.join(installPath, 'logs')
      }

      const api = this.createAPI(info, context)

      // Simple sandbox
      const sandbox = {
        varta: api,
        console: {
          log: (...args: any[]) => logger.info(`Ext:${manifest.id}`, ...args),
          error: (...args: any[]) => logger.error(`Ext:${manifest.id}`, ...args),
          warn: (...args: any[]) => logger.warn(`Ext:${manifest.id}`, ...args),
        },
        Buffer,
        process: {
          platform: process.platform,
          env: { NODE_ENV: process.env.NODE_ENV }
        },
        exports: {},
        module: { exports: {} },
        require: (mod: string) => {
          // Restricted require
          const allowed = ['path', 'url', 'events']
          if (allowed.includes(mod)) return require(mod)
          throw new Error(`Access denied to module: ${mod}`)
        }
      }

      vm.createContext(sandbox)
      vm.runInContext(code, sandbox, { filename: entryPath })

      const extensionModule = (sandbox.module.exports as any).activate ? sandbox.module.exports : sandbox.exports
      
      if (typeof (extensionModule as any).activate === 'function') {
        await (extensionModule as any).activate(context)
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

  private createAPI(info: ExtensionInfo, context: ExtensionContext): VartaExtensionAPI {
    return {
      commands: {
        registerCommand: (id: string, callback: (...args: any[]) => any) => {
          this.commands.set(id, callback)
          
          // Notify renderer about the new command
          this.mainWindow.webContents.send('EXTENSION:REGISTER_COMMAND', {
            id,
            extensionId: info.manifest.id,
            label: id // Default label
          })

          const disposable: Disposable = {
            dispose: () => {
              this.commands.delete(id)
            }
          }
          context.subscriptions.push(disposable)
          return disposable
        },
        executeCommand: async (id: string, ...args: any[]) => {
          return this.executeCommand(id, ...args)
        }
      },
      window: {
        showMessage: (msg: string) => {
          this.mainWindow.webContents.send('DIALOG:SHOW_MESSAGE', { message: msg })
        },
        showErrorMessage: (msg: string) => {
          this.mainWindow.webContents.send('DIALOG:SHOW_ERROR', { message: msg })
        },
        showInformationMessage: (msg: string) => {
          this.mainWindow.webContents.send('DIALOG:SHOW_MESSAGE', { message: msg })
        }
      },
      workspace: {
        rootPath: null, // Should be populated from WorkspaceService
        onDidOpenTextDocument: () => ({ dispose: () => {} }) // Placeholder
      }
    }
  }

  async executeCommand(id: string, ...args: any[]): Promise<any> {
    const callback = this.commands.get(id)
    if (callback) {
      return await callback(...args)
    }
    throw new Error(`Command not found: ${id}`)
  }

  async deactivate(id: string): Promise<void> {
    const ext = this.activeExtensions.get(id)
    if (ext) {
      // Run deactivate if it exists
      if (typeof ext.exports.deactivate === 'function') {
        await ext.exports.deactivate()
      }
      
      // Dispose all subscriptions
      for (const sub of ext.context.subscriptions) {
        sub.dispose()
      }
      
      this.activeExtensions.delete(id)
      logger.info('ExtensionHost', `Deactivated extension: ${id}`)
    }
  }
}
