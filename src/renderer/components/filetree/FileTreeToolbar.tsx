import React from 'react'
import { Tooltip } from '../ui/Tooltip'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileCirclePlus,
  faFolderPlus,
  faArrowsRotate,
  faFolderMinus,
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
}: FileTreeToolbarProps) {
  const { rootPath } = useFileTreeStore()

  const folderName = rootPath
    ? rootPath.split(/[\\/]/).filter(Boolean).pop() ?? rootPath
    : null

  return (
    <div className="flex items-center justify-between h-9 px-3 shrink-0 border-b group/toolbar" style={{ borderColor: 'var(--varta-border)' }}>
      {/* Folder name */}
      <span
        className="text-[11px] font-semibold uppercase tracking-widest text-[#6e6e6e] truncate flex-1 min-w-0 mr-2"
        title={rootPath ?? undefined}
      >
        {folderName ?? 'EXPLORER'}
      </span>

      {/* Action buttons — visible on toolbar hover */}
      {rootPath && (
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/toolbar:opacity-100 transition-opacity duration-150">
          <ToolbarBtn tooltip="New File"         onClick={onNewFile}     icon={faFileCirclePlus} />
          <ToolbarBtn tooltip="New Folder"       onClick={onNewFolder}   icon={faFolderPlus}     />
          <ToolbarBtn tooltip="Refresh Explorer" onClick={onRefresh}     icon={faArrowsRotate}   />
          <ToolbarBtn tooltip="Collapse All"     onClick={onCollapseAll} icon={faFolderMinus}    />
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({ tooltip, onClick, icon }: {
  tooltip: string
  onClick: () => void
  icon: any
}) {
  return (
    <Tooltip content={tooltip} placement="bottom">
      <button
        onClick={onClick}
        aria-label={tooltip}
        className="w-6 h-6 flex items-center justify-center rounded
          text-[#6e6e6e] hover:text-[#cccccc] hover:bg-[#2a2d2e]
          transition-all duration-150"
      >
        <FontAwesomeIcon icon={icon} style={{ fontSize: 13 }} />
      </button>
    </Tooltip>
  )
}
