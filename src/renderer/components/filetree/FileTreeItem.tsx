import React, { useState, useCallback, useRef } from 'react'
import { FileTreeFile }        from './FileTreeFile'
import { FileTreeFolder }      from './FileTreeFolder'
import { FileTreeContextMenu } from './FileTreeContextMenu'
import { RenameInput }         from './RenameInput'
import type { FileTreeNode }   from '../../../shared/types/file.types'
import type { GitFileChange }  from '../../../shared/types/git.types'

export interface FileTreeItemProps {
  node:          FileTreeNode
  depth:         number
  isExpanded:    boolean
  isSelected:    boolean
  isDirty?:      boolean
  gitChange?:    GitFileChange
  isIgnored?:    boolean
  isDragOver?:   boolean
  onFileClick:        (node: FileTreeNode, preview: boolean) => void
  onFolderClick:      (node: FileTreeNode) => void
  onNewFile:          (parentPath: string) => void
  onNewFolder:        (parentPath: string) => void
  onRename:           (node: FileTreeNode, newName: string) => void
  onDelete:           (node: FileTreeNode) => void
  onMove:             (sourcePath: string, targetDirPath: string) => void
  onDragOver:         (path: string) => void
  onDragLeave:        () => void
  onGitStage?:        (node: FileTreeNode) => void
  onGitDiscard?:      (node: FileTreeNode) => void
  rootPath:           string
}

export function FileTreeItem({
  node, depth, isExpanded, isSelected, isDirty, gitChange, isIgnored, isDragOver,
  onFileClick, onFolderClick, onNewFile, onNewFolder,
  onRename, onDelete, onMove, onDragOver, onDragLeave,
  onGitStage, onGitDiscard, rootPath,
}: FileTreeItemProps) {
  const [renaming, setRenaming] = useState(false)
  const isDir = node.type === 'directory'
  const dragCounter = useRef(0)

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(node.path).catch(() => {})
  }, [node.path])

  const handleCopyRelPath = useCallback(() => {
    const rel = node.path.replace(rootPath, '').replace(/^[\\/]/, '')
    navigator.clipboard.writeText(rel).catch(() => {})
  }, [node.path, rootPath])

  const handleRevealInShell = useCallback(() => {
    window.varta.fs.openInShell(node.path).catch(() => {})
  }, [node.path])

  const handleRenameConfirm = useCallback((newName: string) => {
    setRenaming(false)
    if (newName !== node.name) { onRename(node, newName) }
  }, [node, onRename])

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.path)
    // Ghost image — use the element itself
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 12, 12)
  }, [node.path])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    // Only folders are valid drop targets
    if (isDir) { onDragOver(node.path) }
  }, [isDir, node.path, onDragOver])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (isDir) { onDragOver(node.path) }
  }, [isDir, node.path, onDragOver])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) { onDragLeave() }
  }, [onDragLeave])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    onDragLeave()

    const sourcePath = e.dataTransfer.getData('text/plain')
    if (!sourcePath || sourcePath === node.path) { return }

    // Drop target: if folder → move into it; if file → move into its parent
    const targetDir = isDir ? node.path : rootPath
    if (targetDir) { onMove(sourcePath, targetDir) }
  }, [isDir, node.path, rootPath, onMove, onDragLeave])

  if (renaming) {
    return (
      <RenameInput
        depth={depth}
        oldName={node.name}
        onConfirm={handleRenameConfirm}
        onCancel={() => setRenaming(false)}
      />
    )
  }

  const contextMenuProps = {
    node, gitChange,
    onNewFile:       () => onNewFile(node.path),
    onNewFolder:     () => onNewFolder(node.path),
    onRename:        () => setRenaming(true),
    onDelete:        () => onDelete(node),
    onCopyPath:      handleCopyPath,
    onCopyRelPath:   handleCopyRelPath,
    onRevealInShell: handleRevealInShell,
    onGitStage:      onGitStage  ? () => onGitStage(node)  : undefined,
    onGitDiscard:    onGitDiscard ? () => onGitDiscard(node) : undefined,
  }

  const dragProps = {
    draggable:     true,
    onDragStart:   handleDragStart,
    onDragOver:    handleDragOver,
    onDragEnter:   handleDragEnter,
    onDragLeave:   handleDragLeave,
    onDrop:        handleDrop,
  }

  if (isDir) {
    return (
      <FileTreeContextMenu {...contextMenuProps}>
        <FileTreeFolder
          node={node} depth={depth} isExpanded={isExpanded}
          isSelected={isSelected} gitChange={gitChange}
          isIgnored={isIgnored} isDragOver={isDragOver}
          onClick={() => onFolderClick(node)} onContextMenu={() => {}}
          dragProps={dragProps}
        />
      </FileTreeContextMenu>
    )
  }

  return (
    <FileTreeContextMenu {...contextMenuProps}>
      <FileTreeFile
        node={node} depth={depth} isSelected={isSelected}
        isDirty={isDirty} gitChange={gitChange} isIgnored={isIgnored}
        onClick={(e) => onFileClick(node, !e.detail || e.detail === 1)}
        onDoubleClick={() => onFileClick(node, false)}
        onContextMenu={() => {}}
        dragProps={dragProps}
      />
    </FileTreeContextMenu>
  )
}
