import React from 'react'
import { cn } from '../../utils/cn'
import { FileIcon } from './FileIcon'
import type { FileTreeNode } from '../../../shared/types/file.types'
import type { GitFileChange, GitFileStatus } from '../../../shared/types/git.types'

export interface FileTreeFileProps {
  node:        FileTreeNode
  depth:       number
  isSelected:  boolean
  isDirty?:    boolean
  gitChange?:  GitFileChange
  onClick:     (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

const GIT_BADGE: Record<GitFileStatus, { label: string; color: string }> = {
  modified:   { label: 'M', color: '#e2c08d' },
  added:      { label: 'A', color: '#73c991' },
  deleted:    { label: 'D', color: '#f44747' },
  renamed:    { label: 'R', color: '#e2c08d' },
  copied:     { label: 'C', color: '#73c991' },
  untracked:  { label: 'U', color: '#73c991' },
  conflicted: { label: '!', color: '#f44747' },
  ignored:    { label: 'I', color: '#6e6e6e' },
  unmodified: { label: '',  color: 'transparent' },
}

export function FileTreeFile({
  node,
  depth,
  isSelected,
  isDirty = false,
  gitChange,
  onClick,
  onDoubleClick,
  onContextMenu,
}: FileTreeFileProps) {
  const badge = gitChange ? GIT_BADGE[gitChange.status] : null

  return (
    <div
      role="treeitem"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={cn(
        'flex items-center h-[22px] pr-2 cursor-pointer select-none group',
        'hover:bg-[#2a2d2e] focus:outline-none focus:bg-[#2a2d2e]',
        isSelected && 'bg-[#37373d] hover:bg-[#37373d]',
      )}
      style={{ paddingLeft: depth * 12 + 8 }}
    >
      {/* Indent spacer */}
      <span className="w-4 shrink-0" />

      {/* File icon */}
      <FileIcon filename={node.name} size={16} className="mr-1.5 shrink-0" />

      {/* Filename */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px]',
          gitChange?.status === 'deleted'
            ? 'line-through text-[#6e6e6e]'
            : gitChange
              ? 'text-[#e2c08d]'
              : 'text-[#d4d4d4]',
        )}
      >
        {node.name}
      </span>

      {/* Dirty dot */}
      {isDirty && (
        <span
          className="w-2 h-2 rounded-full bg-[#d4d4d4] shrink-0 ml-1"
          title="Unsaved changes"
          aria-label="Unsaved changes"
        />
      )}

      {/* Git badge */}
      {badge && badge.label && (
        <span
          className="text-[11px] font-medium ml-1 shrink-0"
          style={{ color: badge.color }}
          title={`Git: ${gitChange?.status}`}
        >
          {badge.label}
        </span>
      )}
    </div>
  )
}
