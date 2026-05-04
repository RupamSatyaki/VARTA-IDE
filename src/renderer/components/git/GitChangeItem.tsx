import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { GitStatusBadge } from './GitStatusBadge'
import { ContextMenu, type MenuItemDef } from '../ui/ContextMenu'
import { useFileTreeStore } from '../../store/fileTreeStore'
import type { GitFileChange } from '../../../shared/types/git.types'

export interface GitChangeItemProps {
  change:    GitFileChange
  staged:    boolean
  onStage?:  () => void
  onUnstage?:() => void
  onDiscard?:() => void
  onOpenFile:() => void
  onOpenDiff:() => void
}

export function GitChangeItem({
  change, staged,
  onStage, onUnstage, onDiscard,
  onOpenFile, onOpenDiff,
}: GitChangeItemProps) {
  const { rootPath } = useFileTreeStore()
  const [hovered, setHovered] = useState(false)

  const filename = change.path.replace(/\\/g, '/').split('/').pop() ?? change.path
  const relPath  = rootPath
    ? change.path.replace(/\\/g, '/').replace(rootPath.replace(/\\/g, '/'), '').replace(/^\//, '')
    : change.path

  const handleCopyPath = () => {
    navigator.clipboard.writeText(change.path).catch(() => {})
  }

  const menuItems: MenuItemDef[] = [
    { label: 'Open File',  onClick: onOpenFile },
    { label: 'View Diff',  onClick: onOpenDiff },
    { type: 'separator' },
    ...(staged
      ? [{ label: 'Unstage', onClick: onUnstage ?? (() => {}) }]
      : [
          { label: 'Stage Changes',   onClick: onStage   ?? (() => {}) },
          { label: 'Discard Changes', onClick: onDiscard ?? (() => {}), danger: true },
        ]
    ),
    { type: 'separator' as const },
    { label: 'Copy Path', onClick: handleCopyPath },
  ]

  return (
    <ContextMenu items={menuItems}>
      <div
        className={cn(
          'flex items-center gap-1.5 h-[22px] px-2 cursor-pointer select-none group',
          'hover:bg-[#2a2d2e] transition-colors',
        )}
        style={{ paddingLeft: 16 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onOpenDiff}
      >
        {/* Status badge */}
        <GitStatusBadge status={change.status} />

        {/* File path */}
        <span
          className="flex-1 min-w-0 truncate text-xs text-[#d4d4d4]"
          title={change.path}
        >
          {filename}
          <span className="text-[#6e6e6e] ml-1 text-[10px]">
            {relPath !== filename ? relPath.replace(filename, '').replace(/\/$/, '') : ''}
          </span>
        </span>

        {/* Hover action buttons */}
        <div className={cn('flex items-center gap-0.5 shrink-0', hovered ? 'opacity-100' : 'opacity-0')}>
          {!staged && onStage && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onStage() }} title="Stage Changes">
              <PlusIcon />
            </ActionBtn>
          )}
          {!staged && onDiscard && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onDiscard() }} title="Discard Changes">
              <DiscardIcon />
            </ActionBtn>
          )}
          {staged && onUnstage && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onUnstage() }} title="Unstage">
              <MinusIcon />
            </ActionBtn>
          )}
        </div>
      </div>
    </ContextMenu>
  )
}

function ActionBtn({ onClick, title, children }: {
  onClick: (e: React.MouseEvent) => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-4 h-4 flex items-center justify-center rounded text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#ffffff15]"
    >
      {children}
    </button>
  )
}

const PlusIcon    = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M9 4H6V1H4v3H1v2h3v3h2V6h3z"/></svg>
const MinusIcon   = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1 4h8v2H1z"/></svg>
const DiscardIcon = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 4.293L8.146 1.146l.708.708L5.707 5l3.147 3.146-.708.708L5 5.707 1.854 8.854l-.708-.708L4.293 5 1.146 1.854l.708-.708L5 4.293z"/></svg>
