import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { VirtualList }         from '../ui/VirtualList'
import { FileTreeItem }        from './FileTreeItem'
import { NewFileInput }        from './NewFileInput'
import { useFileTreeStore }    from '../../store/fileTreeStore'
import { useTabStore }         from '../../store/tabStore'
import { useGitStore }         from '../../store/gitStore'
import { isIPCSuccess }        from '../../../shared/ipc'
import type { FileTreeNode }   from '../../../shared/types/file.types'
import type { GitFileChange }  from '../../../shared/types/git.types'

const ROW_HEIGHT = 26

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
  const { status: gitStatus, setStatus } = useGitStore()

  const [newItem, setNewItem] = useState<NewItemState | null>(null)

  // Auto-refresh git status every 3 seconds
  useEffect(() => {
    if (!rootPath) { return }
    const refresh = async () => {
      const res = await window.varta.git.status().catch(() => null)
      if (res && isIPCSuccess(res)) { setStatus(res.data) }
    }
    refresh() // immediate on mount
    const timer = setInterval(refresh, 3000)
    return () => clearInterval(timer)
  }, [rootPath, setStatus])

  // Git change map — normalize relative git paths to absolute + folder propagation
  const gitChangeMap = useMemo(() => {
    const map = new Map<string, GitFileChange>()
    if (!gitStatus || !rootPath) { return map }

    const root = rootPath.replace(/\\/g, '/')
    const allChanges = [...gitStatus.staged, ...gitStatus.unstaged, ...gitStatus.untracked, ...gitStatus.conflicted]

    // Convert relative git path → absolute normalized path
    const toAbs = (relPath: string) => {
      const rel = relPath.replace(/\\/g, '/')
      if (rel.startsWith('/') || /^[A-Za-z]:/.test(rel)) { return rel }
      return `${root}/${rel}`
    }

    const normalized = allChanges.map(c => ({ ...c, path: toAbs(c.path) }))

    // Map files
    for (const c of normalized) {
      map.set(c.path, c)
    }

    // Propagate up to parent dirs
    for (const c of normalized) {
      const parts = c.path.split('/')
      for (let i = parts.length - 1; i > 0; i--) {
        const dirPath = parts.slice(0, i).join('/')
        if (!dirPath || dirPath === root) { continue }
        if (!map.has(dirPath)) {
          map.set(dirPath, { ...c, path: dirPath })
        }
      }
    }

    return map
  }, [gitStatus, rootPath])

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
        gitChange={gitChangeMap.get(row.node.path.replace(/\\/g, '/'))}
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
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center select-none">

        {/* Animated folder illustration */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute w-24 h-24 rounded-full bg-[#7c3aed]/5 blur-xl" />
          {/* Icon container */}
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center
            bg-gradient-to-br from-[#2a2a3a] to-[#1e1e2e]
            border border-[#3a3a4a]
            shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#6e6e9a]">
              <path d="M3 7C3 5.9 3.9 5 5 5H9.6C10.1 5 10.6 5.2 10.9 5.6L12 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 11V15M10 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-[#cccccc]">No folder opened</p>
          <p className="text-[11px] text-[#6e6e6e] leading-relaxed">
            Open a folder to browse<br />your files and projects
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onOpenFolder}
          className="group relative px-5 py-2 text-[12px] font-medium rounded-lg overflow-hidden
            border border-[#3a3a4a] text-[#cccccc]
            hover:border-[#a855f7]/40 hover:text-white
            transition-all duration-200"
        >
          <span className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/0 to-[#a855f7]/0
            group-hover:from-[#7c3aed]/20 group-hover:to-[#a855f7]/10
            transition-all duration-200" />
          <span className="relative flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M.5 3l1-1h4l1 1 1-1h7l1 1v9l-1 1h-13l-1-1V3zm1 9h12V4H8L7 3H2L1 4v8z"/>
            </svg>
            Open Folder
          </span>
        </button>

        {/* Keyboard hint */}
        <p className="text-[10px] text-[#3c3c3c]">
          <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#3a3a3a] text-[#6e6e6e] font-mono">Ctrl</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#3a3a3a] text-[#6e6e6e] font-mono">K</kbd>
          {' '}
          <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#3a3a3a] text-[#6e6e6e] font-mono">Ctrl</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#3a3a3a] text-[#6e6e6e] font-mono">O</kbd>
        </p>

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
