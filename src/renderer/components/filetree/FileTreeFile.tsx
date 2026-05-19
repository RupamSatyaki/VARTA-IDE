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
  isIgnored?:  boolean
  dragProps?:  React.HTMLAttributes<HTMLDivElement>
  onClick:     (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

// Git status → color + letter badge (VS Code style)
const GIT_STATUS: Record<GitFileStatus, { label: string; color: string }> = {
  modified:   { label: 'M', color: '#e2c08d' },  // yellow
  added:      { label: 'A', color: '#73c991' },  // green
  deleted:    { label: 'D', color: '#f44747' },  // red
  renamed:    { label: 'R', color: '#e2c08d' },  // yellow
  copied:     { label: 'C', color: '#73c991' },  // green
  untracked:  { label: 'U', color: '#73c991' },  // green
  conflicted: { label: '!', color: '#e2c08d' },  // yellow-orange
  ignored:    { label: 'I', color: '#6e6e6e' },  // grey
  unmodified: { label: '',  color: 'transparent' },
}

// Filename color based on git status
function getFileNameColor(gitChange?: GitFileChange): string {
  if (!gitChange) { return 'var(--varta-text)' }
  switch (gitChange.status) {
    case 'added':
    case 'untracked':  return '#73c991'  // green — new file
    case 'modified':
    case 'renamed':
    case 'copied':     return '#e2c08d'  // yellow — modified
    case 'deleted':    return 'var(--varta-text-faint)'  // grey — deleted
    case 'conflicted': return '#e2c08d'  // yellow-orange
    default:           return 'var(--varta-text)'
  }
}

export function FileTreeFile({
  node, depth, isSelected, isDirty = false, gitChange, isIgnored, dragProps,
  onClick, onDoubleClick, onContextMenu,
}: FileTreeFileProps) {
  const badge = gitChange ? GIT_STATUS[gitChange.status] : null
  const nameColor = isIgnored ? 'var(--varta-text-faint)' : getFileNameColor(gitChange)

  return (
    <div
      role="treeitem"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      {...dragProps}
      className={cn(
        'relative flex items-center h-[26px] pr-3 cursor-grab select-none group',
        'hover:bg-varta-hover focus:outline-none',
        isSelected ? 'bg-varta-active hover:bg-varta-active' : 'hover:bg-varta-hover',
      )}
      style={{ paddingLeft: depth * 16 + 8 }}
    >
      {/* Indent guide lines */}
      {Array.from({ length: depth }).map((_, i) => (
        <span key={i} className="absolute top-0 bottom-0 w-px bg-varta-border/50"
          style={{ left: i * 16 + 14 }} />
      ))}

      {/* File icon */}
      <FileIcon filename={node.name} size={20} className="mr-2 shrink-0" />

      {/* Filename — colored by git status, dimmed if ignored */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px]',
          isIgnored && 'opacity-50 italic',
          gitChange?.status === 'deleted' && 'line-through opacity-60',
        )}
        style={{ color: nameColor }}
      >
        {node.name}
      </span>

      {/* Dirty dot */}
      {isDirty && (
        <span className="w-1.5 h-1.5 rounded-full bg-varta-text-muted shrink-0 ml-1.5 opacity-70"
          title="Unsaved changes" />
      )}

      {/* Git letter badge */}
      {badge && badge.label && (
        <span
          className="text-[11px] font-bold ml-1.5 shrink-0"
          style={{ color: badge.color }}
          title={`Git: ${gitChange?.status}`}
        >
          {badge.label}
        </span>
      )}
    </div>
  )
}
