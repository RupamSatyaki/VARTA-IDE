import React from 'react'
import { cn } from '../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { FileTreeNode } from '../../../shared/types/file.types'
import type { GitFileChange } from '../../../shared/types/git.types'

export interface FileTreeFolderProps {
  node:          FileTreeNode
  depth:         number
  isExpanded:    boolean
  isSelected:    boolean
  gitChange?:    GitFileChange
  onClick:       (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function FileTreeFolder({
  node,
  depth,
  isExpanded,
  isSelected,
  gitChange,
  onClick,
  onContextMenu,
}: FileTreeFolderProps) {
  return (
    <div
      role="treeitem"
      aria-expanded={isExpanded}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        'relative flex items-center h-[26px] pr-3 cursor-pointer select-none group',
        isSelected ? 'bg-[#352f3d] hover:bg-[#352f3d]' : 'hover:bg-[#2a2d2e]',
        'focus:outline-none',
      )}
      style={{ paddingLeft: depth * 16 + 8 }}
    >
      {/* Indent guide lines */}
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 bottom-0 w-px bg-[#3c3c3c]"
          style={{ left: i * 16 + 14 }}
        />
      ))}

      {/* FA Chevron — amber color matching folder */}
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#c09553]">
        <FontAwesomeIcon
          icon={isExpanded ? faChevronDown : faChevronRight}
          style={{ fontSize: 10 }}
        />
      </span>

      {/* Folder name */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px] font-medium',
          gitChange ? 'text-[#e2c08d]' : 'text-[#cccccc]',
        )}
      >
        {node.name}
      </span>

      {/* Git badge */}
      {gitChange && (
        <span className="text-[11px] font-semibold text-[#e2c08d] ml-1.5 shrink-0">M</span>
      )}
    </div>
  )
}
