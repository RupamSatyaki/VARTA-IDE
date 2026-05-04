import React from 'react'
import { cn } from '../../utils/cn'
import { FileIcon } from './FileIcon'
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
        'flex items-center h-[22px] pr-2 cursor-pointer select-none group',
        'hover:bg-[#2a2d2e] focus:outline-none focus:bg-[#2a2d2e]',
        isSelected && 'bg-[#37373d] hover:bg-[#37373d]',
      )}
      style={{ paddingLeft: depth * 12 + 8 }}
    >
      {/* Chevron */}
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#6e6e6e]">
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          className={cn('transition-transform duration-100', isExpanded ? 'rotate-90' : 'rotate-0')}
        >
          <path d="M3 1l4 4-4 4V1z" />
        </svg>
      </span>

      {/* Folder icon */}
      <FileIcon
        filename={node.name}
        isFolder={true}
        isOpen={isExpanded}
        size={16}
        className="mr-1.5 shrink-0"
      />

      {/* Folder name */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px] font-medium',
          gitChange ? 'text-[#e2c08d]' : 'text-[#d4d4d4]',
        )}
      >
        {node.name}
      </span>

      {/* Git badge count */}
      {gitChange && (
        <span className="text-[11px] text-[#e2c08d] ml-1 shrink-0">M</span>
      )}
    </div>
  )
}
