import React, { useState, useCallback } from 'react'
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
  onFileClick:        (node: FileTreeNode, preview: boolean) => void
  onFolderClick:      (node: FileTreeNode) => void
  onNewFile:          (parentPath: string) => void
  onNewFolder:        (parentPath: string) => void
  onRename:           (node: FileTreeNode, newName: string) => void
  onDelete:           (node: FileTreeNode) => void
  onGitStage?:        (node: FileTreeNode) => void
  onGitDiscard?:      (node: FileTreeNode) => void
  rootPath:           string
}

export function FileTreeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  isDirty,
  gitChange,
  onFileClick,
  onFolderClick,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onGitStage,
  onGitDiscard,
  rootPath,
}: FileTreeItemProps) {
  const [renaming, setRenaming] = useState(false)
  const isDir = node.type === 'directory'

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
    node,
    gitChange,
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

  if (isDir) {
    return (
      <FileTreeContextMenu {...contextMenuProps}>
        <FileTreeFolder
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isSelected={isSelected}
          gitChange={gitChange}
          onClick={() => onFolderClick(node)}
          onContextMenu={() => {}}  // ContextMenu handles this via wrapper
        />
      </FileTreeContextMenu>
    )
  }

  return (
    <FileTreeContextMenu {...contextMenuProps}>
      <FileTreeFile
        node={node}
        depth={depth}
        isSelected={isSelected}
        isDirty={isDirty}
        gitChange={gitChange}
        onClick={(e) => onFileClick(node, !e.detail || e.detail === 1)}
        onDoubleClick={(e) => onFileClick(node, false)}
        onContextMenu={() => {}}
      />
    </FileTreeContextMenu>
  )
}
