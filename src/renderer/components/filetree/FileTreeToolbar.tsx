import React from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from '../ui/IconButton'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileMedical,
  faFolderPlus,
  faRotateRight,
  faAnglesDown,
  faFolderOpen,
} from '@fortawesome/free-solid-svg-icons'

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
          <ToolbarBtn tooltip="New File"         onClick={onNewFile}     icon={<FontAwesomeIcon icon={faFileMedical}  style={{ fontSize: 12 }} />} />
          <ToolbarBtn tooltip="New Folder"       onClick={onNewFolder}   icon={<FontAwesomeIcon icon={faFolderPlus}  style={{ fontSize: 12 }} />} />
          <ToolbarBtn tooltip="Refresh Explorer" onClick={onRefresh}     icon={<FontAwesomeIcon icon={faRotateRight} style={{ fontSize: 12 }} />} />
          <ToolbarBtn tooltip="Collapse All"     onClick={onCollapseAll} icon={<FontAwesomeIcon icon={faAnglesDown}  style={{ fontSize: 12 }} />} />
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({ tooltip, onClick, icon }: { tooltip: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <IconButton tooltip={tooltip} size="sm" onClick={onClick} aria-label={tooltip}>
      {icon}
    </IconButton>
  )
}
