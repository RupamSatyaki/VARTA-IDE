import { ipcRenderer } from 'electron'
import { ExtensionChannel, IPCResponse } from '../../shared/ipc'
import { ExtensionInfo, MarketplaceExtension } from '../../shared/types/extension.types'

export const extensionApi = {
  list: (): Promise<IPCResponse<ExtensionInfo[]>> => 
    ipcRenderer.invoke(ExtensionChannel.LIST),

  marketplaceSearch: (query: string): Promise<IPCResponse<MarketplaceExtension[]>> =>
    ipcRenderer.invoke(ExtensionChannel.MARKETPLACE_SEARCH, query),

  install: (id: string): Promise<IPCResponse<boolean>> =>
    ipcRenderer.invoke(ExtensionChannel.INSTALL, id),

  installFromFile: (filePath: string): Promise<IPCResponse<boolean>> =>
    ipcRenderer.invoke(ExtensionChannel.INSTALL_FROM_FILE, filePath),

  getDetails: (id: string): Promise<IPCResponse<ExtensionInfo>> => 
    ipcRenderer.invoke(ExtensionChannel.GET_DETAILS, id),

  enable: (id: string): Promise<IPCResponse<boolean>> => 
    ipcRenderer.invoke(ExtensionChannel.ENABLE, id),

  disable: (id: string): Promise<IPCResponse<boolean>> => 
    ipcRenderer.invoke(ExtensionChannel.DISABLE, id),

  uninstall: (id: string): Promise<IPCResponse<boolean>> => 
    ipcRenderer.invoke(ExtensionChannel.UNINSTALL, id),

  reload: (id: string): Promise<IPCResponse<boolean>> => 
    ipcRenderer.invoke(ExtensionChannel.RELOAD, id),

  executeCommand: (id: string, ...args: any[]): Promise<IPCResponse<any>> =>
    ipcRenderer.invoke(ExtensionChannel.EXECUTE_COMMAND, id, ...args),

  onContributionsChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('EXTENSION:CONTRIBUTIONS_CHANGED', handler)
    return () => ipcRenderer.removeListener('EXTENSION:CONTRIBUTIONS_CHANGED', handler)
  },
}
