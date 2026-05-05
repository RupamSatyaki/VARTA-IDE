import React from 'react'
import { useUIStore }        from '../../store/uiStore'
import { useFileTreeStore }  from '../../store/fileTreeStore'
import { FileTree }          from '../filetree/FileTree'
import { FileTreeToolbar }   from '../filetree/FileTreeToolbar'
import { useFileTree }       from '../../hooks/useFileTree'
import { useEditor }         from '../../hooks/useEditor'
import { SearchPanel }       from '../search/SearchPanel'
import { GitPanel }          from '../git/GitPanel'
import { ExtensionsPanel }   from '../extensions/ExtensionsPanel'
import { DebugPanel }        from '../debug/DebugPanel'
import { OutlinePanel }      from '../outline/OutlinePanel'
import { AIChatPanel }       from '../ai/AIChatPanel'

export function Sidebar() {
  const { activeSidebarPanel, sidebarVisible, sidebarWidth } = useUIStore()

  if (!sidebarVisible) { return null }

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden rounded-tr-3xl rounded-br-3xl mr-2"
      style={{
        width:           sidebarWidth,
        backgroundColor: 'var(--varta-sidebar)',
      }}
    >
      {activeSidebarPanel === 'explorer'   && <ExplorerPanel />}
      {activeSidebarPanel === 'search'     && <SearchPanel />}
      {activeSidebarPanel === 'git'        && <GitPanel />}
      {activeSidebarPanel === 'extensions' && <ExtensionsPanel />}
      {activeSidebarPanel === 'debug'      && <DebugPanel />}
      {activeSidebarPanel === 'outline'    && <OutlinePanel />}
      {activeSidebarPanel === 'ai'         && <AIChatPanel />}
      {!['explorer','search','git','extensions','debug','outline','ai'].includes(activeSidebarPanel) && (
        <PlaceholderPanel panel={activeSidebarPanel} />
      )}
    </div>
  )
}

function ExplorerPanel() {
  const {
    openFolder, toggleFolder,
    createFile, createFolder,
    deleteItem, renameItem,
    refreshNode, collapseAll,
  } = useFileTree()

  const { openFile } = useEditor()
  const { rootPath } = useFileTreeStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FileTreeToolbar
        onNewFile={() => {}}
        onNewFolder={() => {}}
        onRefresh={() => rootPath && refreshNode(rootPath)}
        onCollapseAll={collapseAll}
        onOpenFolder={openFolder}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <FileTree
          onOpenFolder={openFolder}
          onFileOpen={(path, _preview) => openFile(path, false)}
          onFolderToggle={toggleFolder}
          onNewFile={createFile}
          onNewFolder={createFolder}
          onRename={renameItem}
          onDelete={deleteItem}
          onGitStage={(p) => window.varta.git.stage([p]).catch(() => {})}
          onGitDiscard={(p) => window.varta.git.discard([p]).catch(() => {})}
        />
      </div>
    </div>
  )
}

function PlaceholderPanel({ panel }: { panel: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#7c7ca8] border-b border-[#333333] bg-[#252526]">
        {panel.toUpperCase()}
      </div>
      <div className="flex-1 flex items-center justify-center text-[#6e6e6e] text-sm opacity-40">
        {panel}
      </div>
    </div>
  )
}
