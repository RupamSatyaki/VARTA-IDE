import { EditorTab } from './editor.types'

export type WorkspaceSidebarPanel = 'explorer' | 'search' | 'git' | 'extensions' | 'debug' | 'ai' | 'outline'
export type WorkspaceBottomPanel  = 'terminal' | 'problems' | 'output' | 'debug'

export interface WorkspaceLayout {
  sidebarWidth:           number
  panelHeight:            number
  secondarySidebarWidth:  number
  sidebarVisible:         boolean
  panelVisible:           boolean
  secondarySidebarVisible: boolean
  activeSidebarPanel:     WorkspaceSidebarPanel
  activeBottomPanel:      WorkspaceBottomPanel
}

export interface WorkspaceTabs {
  tabs:           EditorTab[]
  activeTabId:    string | null
}

export interface WorkspaceExplorer {
  expandedPaths: string[]
}

export interface WorkspaceSession {
  projectPath: string
  layout?:     WorkspaceLayout
  tabs?:       WorkspaceTabs
  explorer?:   WorkspaceExplorer
}

export interface LastProjectSession {
  path: string | null
}
