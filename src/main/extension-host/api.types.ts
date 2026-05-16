/**
 * Public API exposed to Varta extensions.
 * This is the 'varta' module that extensions can import or access.
 */
export interface VartaExtensionAPI {
  commands: {
    registerCommand(id: string, callback: (...args: any[]) => any): Disposable
    executeCommand(id: string, ...args: any[]): Promise<any>
  }
  window: {
    showMessage(message: string): void
    showErrorMessage(message: string): void
    showInformationMessage(message: string): void
  }
  workspace: {
    rootPath: string | null
    onDidOpenTextDocument: (callback: (doc: any) => void) => Disposable
  }
}

export interface Disposable {
  dispose(): void
}

export interface ExtensionContext {
  subscriptions: Disposable[]
  extensionPath: string
  storagePath: string
  globalStoragePath: string
  logPath: string
}
