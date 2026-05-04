import React, { useCallback, useMemo, useState } from 'react'
import { VirtualList }         from '../ui/VirtualList'
import { FileTreeItem }        from './FileTreeItem'
import { NewFileInput }        from './NewFileInput'
import { Button }              from '../ui/Button'
import { useFileTreeStore }    from '../../store/fileTreeStore'
import { useTabStore }         from '../../store/tabStore'
import { useGitStore }         from '../../store/gitStore'
import type { FileTreeNode }   from '../../../shared/types/file.types'
import type { GitFileChange }  from '../../../shared/types/git.types'

const ROW_HEIGHT = 22

export interface FileTreeProps {
  onOpenFolder:  () => void
  onFileOpen:    (path: string, preview: boolean) => void
  onFolderToggle:(path: string) => void
  onNewFile:     (parentPath: string, name: string) => void
  onNewFolder:   (parentPath: string, name: string) => void
  onRename:      (oldPath: string, newName: string) => void
  onDelete:      (path: string, isDir: boolean) => void
  onGitStage?:   (path: string) => void
  onGitDiscard?: (path: string) => void
}

interface FlatRow {
  node:  FileTreeNode
  depth: number
}

interface NewItemState {
  parentPath: string
  type:       'file' | 'folder'
}

/** Flatten visible tree rows — only recurse into expanded folders */
function flattenTree(nodes: FileTreeNode[], expandedPaths: Set<string>, depth = 0): FlatRow[] {
  const rows: FlatRow[] = []
  for (const node of nodes) {
    rows.push({ node, depth })
    if (
      node.type === 'directory' &&
      expandedPaths.has(node.path) &&
      node.children &&
      node.children.length > 0
    ) {
      const childRows = flattenTree(node.children, expandedPaths, depth + 1)
      for (const r of childRows) { rows.push(r) }
    }
  }
  return rows
}

export function FileTree({
  onOpenFolder,
  onFileOpen,
  onFolderToggle,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onGitStage,
  onGitDiscard,
}: FileTreeProps) {
  const { rootPath, nodes, expandedPaths, selectedPath, setSelected } = useFileTreeStore()
  const { tabs }              = useTabStore()
  const { status: gitStatus } = useGitStore()

  const [newItem, setNewItem] = useState<NewItemState | null>(null)

  // Git change map
  const gitChangeMap = useMemo(() => {
    const map = new Map<string, GitFileChange>()
    if (!gitStatus) { return map }
    for (const c of [...gitStatus.staged, ...gitStatus.unstaged, ...gitStatus.untracked]) {
      map.set(c.path, c)
    }
    return map
  }, [gitStatus])

  // Dirty paths from open tabs
  const dirtyPaths = useMemo(
    () => new Set(tabs.filter((t) => t.isDirty).map((t) => t.filePath)),
    [tabs],
  )

  // Flatten visible rows — memoized on nodes + expandedPaths
  const rows = useMemo(
    () => flattenTree(nodes, expandedPaths),
    [nodes, expandedPaths],
  )

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = rows.findIndex((r) => r.node.path === selectedPath)
    if (idx < 0 && rows.length > 0) { setSelected(rows[0].node.path); return }
    if (idx < 0) { return }

    const node = rows[idx].node
    if (e.key === 'ArrowDown') { e.preventDefault(); rows[idx + 1] && setSelected(rows[idx + 1].node.path) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); rows[idx - 1] && setSelected(rows[idx - 1].node.path) }
    else if (e.key === 'ArrowRight' && node.type === 'directory') { e.preventDefault(); if (!expandedPaths.has(node.path)) { onFolderToggle(node.path) } }
    else if (e.key === 'ArrowLeft' && node.type === 'directory')  { e.preventDefault(); if (expandedPaths.has(node.path))  { onFolderToggle(node.path) } }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (node.type === 'file') { onFileOpen(node.path, false) }
      else { onFolderToggle(node.path) }
    }
  }, [rows, selectedPath, expandedPaths, setSelected, onFileOpen, onFolderToggle])

  const renderRow = useCallback((row: FlatRow) => {
    return (
      <FileTreeItem
        node={row.node}
        depth={row.depth}
        isExpanded={expandedPaths.has(row.node.path)}
        isSelected={selectedPath === row.node.path}
        isDirty={dirtyPaths.has(row.node.path)}
        gitChange={gitChangeMap.get(row.node.path)}
        onFileClick={(node, preview) => { setSelected(node.path); onFileOpen(node.path, preview) }}
        onFolderClick={(node) => { setSelected(node.path); onFolderToggle(node.path) }}
        onNewFile={(parentPath) => setNewItem({ parentPath, type: 'file' })}
        onNewFolder={(parentPath) => setNewItem({ parentPath, type: 'folder' })}
        onRename={(node, newName) => onRename(node.path, newName)}
        onDelete={(node) => onDelete(node.path, node.type === 'directory')}
        onGitStage={onGitStage   ? (node) => onGitStage(node.path)   : undefined}
        onGitDiscard={onGitDiscard ? (node) => onGitDiscard(node.path) : undefined}
        rootPath={rootPath ?? ''}
      />
    )
  }, [
    expandedPaths, selectedPath, dirtyPaths, gitChangeMap,
    setSelected, onFileOpen, onFolderToggle, onNewFile, onNewFolder,
    onRename, onDelete, onGitStage, onGitDiscard, rootPath,
  ])

  // Empty state
  if (!rootPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
        <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" className="text-[#3c3c3c]">
          <path d="M.5 3l1-1h4l1 1 1-1h7l1 1v9l-1 1h-13l-1-1V3zm1 9h12V4H8L7 3H2L1 4v8z"/>
        </svg>
        <p className="text-sm text-[#6e6e6e]">No folder opened</p>
        <Button variant="primary" size="sm" onClick={onOpenFolder}>
          Open Folder
        </Button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="tree"
      aria-label="File Explorer"
    >
      {/* Inline new item input */}
      {newItem && (
        <NewFileInput
          depth={0}
          placeholder={newItem.type === 'file' ? 'filename.ts' : 'folder name'}
          onConfirm={(name) => {
            if (newItem.type === 'file') { onNewFile(newItem.parentPath, name) }
            else { onNewFolder(newItem.parentPath, name) }
            setNewItem(null)
          }}
          onCancel={() => setNewItem(null)}
        />
      )}

      <VirtualList
        items={rows}
        rowHeight={ROW_HEIGHT}
        renderItem={renderRow}
        overscan={5}
        className="flex-1"
        getKey={(row) => row.node.path}
      />
    </div>
  )
}
