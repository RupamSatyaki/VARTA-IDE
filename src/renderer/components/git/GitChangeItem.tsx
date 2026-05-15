import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { GitStatusBadge } from './GitStatusBadge'
import { FileIcon } from '../filetree/FileIcon'
import { ContextMenu, type MenuItemDef } from '../ui/ContextMenu'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMinus, faRotateLeft, faCode } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'
import type { GitFileChange } from '../../../shared/types/git.types'

export interface GitChangeItemProps {
  change:     GitFileChange
  staged:     boolean
  onStage?:   () => void
  onUnstage?: () => void
  onDiscard?: () => void
  onOpenFile: () => void
  onOpenDiff: () => void
}

export function GitChangeItem({ change, staged, onStage, onUnstage, onDiscard, onOpenFile, onOpenDiff }: GitChangeItemProps) {
  const { rootPath } = useFileTreeStore()
  const [hovered, setHovered] = useState(false)

  const filename = change.path.replace(/\\/g, '/').split('/').pop() ?? change.path
  const dir      = (() => {
    const rel = rootPath
      ? change.path.replace(/\\/g, '/').replace(rootPath.replace(/\\/g, '/'), '').replace(/^\//, '')
      : change.path
    const parts = rel.split('/')
    return parts.length > 1 ? parts.slice(0, -1).join('/') : ''
  })()

  const menuItems: MenuItemDef[] = [
    { label: 'Open File',  onClick: onOpenFile },
    { label: 'View Diff',  onClick: onOpenDiff },
    { type: 'separator' },
    ...(staged
      ? [{ label: 'Unstage', onClick: onUnstage ?? (() => {}) }]
      : [
          { label: 'Stage',   onClick: onStage   ?? (() => {}) },
          ...(onDiscard ? [{ label: 'Discard Changes', onClick: onDiscard, danger: true }] : []),
        ]
    ),
    { type: 'separator' as const },
    { label: 'Copy Path', onClick: () => navigator.clipboard.writeText(change.path).catch(() => {}) },
  ]

  return (
    <ContextMenu items={menuItems}>
      <div
        className={cn(
          'flex items-center gap-2 h-[24px] pr-2 cursor-pointer select-none',
          'hover:bg-white/5 transition-colors',
        )}
        style={{ paddingLeft: 20 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onOpenDiff}
      >
        {/* Status badge */}
        <GitStatusBadge status={change.status} />

        {/* File icon */}
        <FileIcon filename={filename} size={13} className="shrink-0" />

        {/* Name + dir */}
        <span className="flex-1 min-w-0 truncate text-[12px] text-[#cccccc]" title={change.path}>
          {filename}
          {dir && <span className="text-[#4a3a5a] ml-1 text-[10px]">{dir}</span>}
        </span>

        {/* Hover actions */}
        <div className={cn('flex items-center gap-0.5 shrink-0 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
          <ActionBtn onClick={(e) => { e.stopPropagation(); onOpenDiff() }} tooltip="Open Diff" icon={faCode} color="text-[#c084fc]" />
          {!staged && onStage && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onStage() }} tooltip="Stage" icon={faPlus} color="text-[#34d399]" />
          )}
          {!staged && onDiscard && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onDiscard() }} tooltip="Discard" icon={faRotateLeft} color="text-[#f87171]" />
          )}
          {staged && onUnstage && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onUnstage() }} tooltip="Unstage" icon={faMinus} color="text-[#f59e0b]" />
          )}
        </div>
      </div>
    </ContextMenu>
  )
}

function ActionBtn({ onClick, tooltip, icon, color }: {
  onClick: (e: React.MouseEvent) => void; tooltip: string; icon: any; color: string
}) {
  return (
    <Tooltip content={tooltip} placement="left">
      <button
        onClick={onClick}
        className={cn('w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 transition-all', color)}
      >
        <FontAwesomeIcon icon={icon} style={{ fontSize: 9 }} />
      </button>
    </Tooltip>
  )
}
