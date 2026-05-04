import React from 'react'
import { ContextMenu, type MenuItemDef } from '../ui/ContextMenu'
import type { FileTreeNode } from '../../../shared/types/file.types'
import type { GitFileChange } from '../../../shared/types/git.types'

export interface FileTreeContextMenuProps {
  node:       FileTreeNode
  gitChange?: GitFileChange
  children:   React.ReactElement
  onNewFile:       () => void
  onNewFolder:     () => void
  onRename:        () => void
  onDelete:        () => void
  onCopyPath:      () => void
  onCopyRelPath:   () => void
  onRevealInShell: () => void
  onGitStage?:     () => void
  onGitDiscard?:   () => void
}

export function FileTreeContextMenu({
  node,
  gitChange,
  children,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopyPath,
  onCopyRelPath,
  onRevealInShell,
  onGitStage,
  onGitDiscard,
}: FileTreeContextMenuProps) {
  const isDir = node.type === 'directory'

  const items: MenuItemDef[] = [
    ...(isDir ? [
      { label: 'New File',   onClick: onNewFile,   icon: <PlusIcon /> },
      { label: 'New Folder', onClick: onNewFolder, icon: <FolderPlusIcon /> },
      { type: 'separator' as const },
    ] : []),
    { label: 'Rename',            onClick: onRename,        icon: <EditIcon /> },
    { label: 'Delete',            onClick: onDelete,        icon: <TrashIcon />, danger: true },
    { type: 'separator' as const },
    { label: 'Copy Path',         onClick: onCopyPath },
    { label: 'Copy Relative Path',onClick: onCopyRelPath },
    { label: 'Reveal in Explorer',onClick: onRevealInShell, icon: <FolderIcon /> },
    ...(gitChange ? [
      { type: 'separator' as const },
      ...(gitChange.status !== 'untracked' && onGitStage ? [
        { label: 'Stage Changes', onClick: onGitStage, icon: <PlusIcon /> },
      ] : []),
      ...(onGitDiscard ? [
        { label: 'Discard Changes', onClick: onGitDiscard, icon: <UndoIcon />, danger: true },
      ] : []),
    ] : []),
  ]

  return <ContextMenu items={items}>{children}</ContextMenu>
}

// Minimal inline SVG icons
const PlusIcon      = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M11 5H7V1H5v4H1v2h4v4h2V7h4z"/></svg>
const FolderPlusIcon= () => <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M1 2l1-1h3l1 1 1-1h4l1 1v7l-1 1H2l-1-1V2zm1 7h8V3H7L6 2H2v7zm4-5v2H3v1h2v2h1V8h2V7H6V5H5z"/></svg>
const EditIcon      = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M10.5 1l.5.5v1l-6 6H4v-1l6-6V1h.5zM2 9h1v1H2V9zm-1 1h1v1H1v-1zm8-9l1 1-1 1-1-1 1-1z"/></svg>
const TrashIcon     = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M8 2h2v1H2V2h2V1h4v1zM3 4h6l-.5 7h-5L3 4zm1 1l.4 5h.2L5 5H4zm2 0v5h1V5H6zm2 0-.4 5h.2L8.6 5H8z"/></svg>
const FolderIcon    = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M1 2l1-1h3l1 1 1-1h4l1 1v7l-1 1H2l-1-1V2zm1 7h8V3H7L6 2H2v7z"/></svg>
const UndoIcon      = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 6a4 4 0 104-4H4V0L1 3l3 3V4h2a3 3 0 11-3 3H1a4 4 0 001 3z"/></svg>
