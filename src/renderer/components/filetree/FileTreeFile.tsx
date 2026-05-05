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
        'relative flex items-center h-[26px] pr-3 cursor-pointer select-none group',
        'hover:bg-[#2a2d2e] focus:outline-none',
        isSelected ? 'bg-[#352f3d] hover:bg-[#352f3d]' : 'hover:bg-[#2a2d2e]',
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

      {/* File icon — size 18 */}
      <FileIcon filename={node.name} size={20} className="mr-2 shrink-0" />

      {/* Filename */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px]',
          gitChange?.status === 'deleted'
            ? 'line-through text-[#6e6e6e]'
            : gitChange
              ? 'text-[#e2c08d]'
              : 'text-[#cccccc]',
        )}
      >
        {node.name}
      </span>

      {/* Dirty dot */}
      {isDirty && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#cccccc] shrink-0 ml-1.5 opacity-70"
          title="Unsaved changes"
          aria-label="Unsaved changes"
        />
      )}

      {/* Git badge */}
      {badge && badge.label && (
        <span
          className="text-[11px] font-semibold ml-1.5 shrink-0 opacity-90"
          style={{ color: badge.color }}
          title={`Git: ${gitChange?.status}`}
        >
          {badge.label}
        </span>
      )}
    </div>
  )
}
