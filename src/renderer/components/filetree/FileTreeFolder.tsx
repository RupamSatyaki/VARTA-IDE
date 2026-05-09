import React from 'react'
import { cn } from '../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { FileTreeNode } from '../../../shared/types/file.types'
import type { GitFileChange, GitFileStatus } from '../../../shared/types/git.types'

export interface FileTreeFolderProps {
  node:          FileTreeNode
  depth:         number
  isExpanded:    boolean
  isSelected:    boolean
  gitChange?:    GitFileChange
  isIgnored?:    boolean
  isDragOver?:   boolean
  dragProps?:    React.HTMLAttributes<HTMLDivElement>
  onClick:       (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

// Folder name color — if any child is new → green, modified → yellow
function getFolderColor(gitChange?: GitFileChange): string {
  if (!gitChange) { return '#cccccc' }
  switch (gitChange.status) {
    case 'added':
    case 'untracked':  return '#73c991'  // green
    case 'modified':
    case 'renamed':    return '#e2c08d'  // yellow
    case 'deleted':    return '#6e6e6e'
    case 'conflicted': return '#e2c08d'
    default:           return '#cccccc'
  }
}

// Badge letter for folder
const FOLDER_BADGE: Partial<Record<GitFileStatus, string>> = {
  modified:  'M',
  added:     'A',
  untracked: 'U',
  deleted:   'D',
  conflicted:'!',
}

export function FileTreeFolder({
  node, depth, isExpanded, isSelected, gitChange, isIgnored, isDragOver,
  dragProps, onClick, onContextMenu,
}: FileTreeFolderProps) {
  const nameColor   = isIgnored ? '#6e6e6e' : getFolderColor(gitChange)
  const badgeLetter = !isIgnored && gitChange ? FOLDER_BADGE[gitChange.status] : null
  const badgeColor  = nameColor !== '#cccccc' && nameColor !== '#6e6e6e' ? nameColor : undefined

  return (
    <div
      role="treeitem"
      aria-expanded={isExpanded}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={onClick}
      onContextMenu={onContextMenu}
      {...dragProps}
      className={cn(
        'relative flex items-center h-[26px] pr-3 cursor-pointer select-none group',
        isSelected ? 'bg-[#352f3d] hover:bg-[#352f3d]' : 'hover:bg-[#2a2d2e]',
        isDragOver && 'bg-[#7c3aed]/20 outline outline-1 outline-[#7c3aed]/60',
        'focus:outline-none',
      )}
      style={{ paddingLeft: depth * 16 + 8 }}
    >
      {/* Indent guide lines */}
      {Array.from({ length: depth }).map((_, i) => (
        <span key={i} className="absolute top-0 bottom-0 w-px bg-[#3c3c3c]"
          style={{ left: i * 16 + 14 }} />
      ))}

      {/* Chevron */}
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#c09553]">
        <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} style={{ fontSize: 10 }} />
      </span>

      {/* Folder name — dimmed if ignored */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px] font-medium',
          isIgnored && 'opacity-50 italic',
        )}
        style={{ color: nameColor }}
      >
        {node.name}
      </span>

      {/* Git badge */}
      {badgeLetter && badgeColor && (
        <span
          className="text-[11px] font-bold ml-1.5 shrink-0"
          style={{ color: badgeColor }}
          title={`Git: ${gitChange?.status}`}
        >
          {badgeLetter}
        </span>
      )}
    </div>
  )
}
