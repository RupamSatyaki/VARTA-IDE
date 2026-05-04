import React from 'react'
import { useUIStore }        from '../../store/uiStore'
import { useFileTreeStore }  from '../../store/fileTreeStore'
import { FileTree }          from '../filetree/FileTree'
import { FileTreeToolbar }   from '../filetree/FileTreeToolbar'
import { useFileTree }       from '../../hooks/useFileTree'
import { useEditor }         from '../../hooks/useEditor'

export function Sidebar() {
  const { activeSidebarPanel, sidebarVisible, sidebarWidth } = useUIStore()

  if (!sidebarVisible) { return null }

  return (
    <div
      className="flex flex-col shrink-0 bg-[#252526] border-r border-[#333333] overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      {activeSidebarPanel === 'explorer' && <ExplorerPanel />}
      {activeSidebarPanel !== 'explorer' && <PlaceholderPanel panel={activeSidebarPanel} />}
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

  // File open goes through useEditor so content is cached properly
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
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] border-b border-[#333333]">
        {panel.toUpperCase()}
      </div>
      <div className="flex-1 flex items-center justify-center text-[#6e6e6e] text-sm opacity-40">
        {panel}
      </div>
    </div>
  )
}
