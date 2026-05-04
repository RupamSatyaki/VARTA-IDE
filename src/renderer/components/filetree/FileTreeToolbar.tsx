import React from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from '../ui/IconButton'
import { useFileTreeStore } from '../../store/fileTreeStore'

export interface FileTreeToolbarProps {
  onNewFile:    () => void
  onNewFolder:  () => void
  onRefresh:    () => void
  onCollapseAll:() => void
  onOpenFolder: () => void
}

export function FileTreeToolbar({
  onNewFile,
  onNewFolder,
  onRefresh,
  onCollapseAll,
  onOpenFolder,
}: FileTreeToolbarProps) {
  const { rootPath } = useFileTreeStore()

  const folderName = rootPath
    ? rootPath.split(/[\\/]/).filter(Boolean).pop() ?? rootPath
    : null

  return (
    <div className="flex items-center justify-between h-9 px-2 shrink-0 border-b border-[#333333]">
      {/* Folder name */}
      <span
        className="text-[11px] font-semibold uppercase tracking-widest text-[#6e6e6e] truncate flex-1 min-w-0 mr-1"
        title={rootPath ?? undefined}
      >
        {folderName ?? 'EXPLORER'}
      </span>

      {/* Action buttons — only show when folder is open */}
      {rootPath && (
        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            tooltip="New File"
            size="sm"
            onClick={onNewFile}
            aria-label="New File"
          >
            <NewFileIcon />
          </IconButton>
          <IconButton
            tooltip="New Folder"
            size="sm"
            onClick={onNewFolder}
            aria-label="New Folder"
          >
            <NewFolderIcon />
          </IconButton>
          <IconButton
            tooltip="Refresh Explorer"
            size="sm"
            onClick={onRefresh}
            aria-label="Refresh"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton
            tooltip="Collapse All"
            size="sm"
            onClick={onCollapseAll}
            aria-label="Collapse All"
          >
            <CollapseIcon />
          </IconButton>
        </div>
      )}
    </div>
  )
}

const NewFileIcon   = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M9 1H4L3 2v11l1 1h9l1-1V6L9 1zm0 1.5L13.5 6H9V2.5zM4 13V2h4v5h5v6H4z"/><path d="M7 9h2v2H7V9zm0-3h2v2H7V6z" opacity="0"/><path d="M11 9H9V7H8v2H6v1h2v2h1v-2h2V9z"/></svg>
const NewFolderIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3l1-1h4l1 1 1-1h6l1 1v9l-1 1H2l-1-1V3zm1 9h12V4H8L7 3H2v9zm6-6v2H6v1h2v2h1v-2h2V8h-2V6H8z"/></svg>
const RefreshIcon   = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c.045.218.068.438.068.66 0 2.606-2.116 4.722-4.722 4.722S1.31 12.192 1.31 9.586 3.426 4.864 6.032 4.864c.314 0 .62.031.917.09l.217.046.224-.04.345-.062c.218-.039.44-.059.664-.059.222 0 .44.02.654.059l.345.062.224.04.217-.046c.297-.059.603-.09.917-.09"/></svg>
const CollapseIcon  = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M9 9H4v1h5V9zm0-4H4v1h5V5zM4 7h5V6H4v1zm9 4l-4-4 4-4v8z"/></svg>
