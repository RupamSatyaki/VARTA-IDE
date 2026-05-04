import React from 'react'
import { cn } from '../../utils/cn'
import type { GitFileStatus } from '../../../shared/types/git.types'

export interface GitStatusBadgeProps {
  status:    GitFileStatus
  className?: string
}

const BADGE_MAP: Record<GitFileStatus, { label: string; color: string; title: string }> = {
  modified:   { label: 'M', color: '#e2c08d', title: 'Modified' },
  added:      { label: 'A', color: '#73c991', title: 'Added' },
  deleted:    { label: 'D', color: '#f44747', title: 'Deleted' },
  renamed:    { label: 'R', color: '#569cd6', title: 'Renamed' },
  copied:     { label: 'C', color: '#569cd6', title: 'Copied' },
  untracked:  { label: 'U', color: '#73c991', title: 'Untracked' },
  conflicted: { label: '!', color: '#f44747', title: 'Conflict' },
  ignored:    { label: 'I', color: '#6e6e6e', title: 'Ignored' },
  unmodified: { label: ' ', color: 'transparent', title: '' },
}

export function GitStatusBadge({ status, className }: GitStatusBadgeProps) {
  const def = BADGE_MAP[status] ?? BADGE_MAP.unmodified
  if (!def.label.trim()) { return null }
  return (
    <span
      className={cn('text-[11px] font-semibold shrink-0 w-3 text-center', className)}
      style={{ color: def.color }}
      title={def.title}
    >
      {def.label}
    </span>
  )
}
