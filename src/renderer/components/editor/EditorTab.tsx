import React, { useRef } from 'react'
import { cn } from '../../utils/cn'
import { FileIcon } from '../filetree/FileIcon'
import type { EditorTab as EditorTabType } from '../../../shared/types/editor.types'

export interface EditorTabProps {
  tab:      EditorTabType
  isActive: boolean
  onClick:  () => void
  onClose:  () => void
  onMiddleClick?: () => void
  onDoubleClick?: () => void
  style?: React.CSSProperties
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function EditorTab({
  tab,
  isActive,
  onClick,
  onClose,
  onMiddleClick,
  onDoubleClick,
  style,
  dragHandleProps,
}: EditorTabProps) {
  const filename = tab.filePath.replace(/\\/g, '/').split('/').pop() ?? tab.title

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { e.preventDefault(); onMiddleClick?.() }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClick?.()
  }

  return (
    <div
      role="tab"
      aria-selected={isActive}
      style={style}
      className={cn(
        'group relative flex items-center gap-1.5 h-[35px] px-3 min-w-[80px] max-w-[200px]',
        'border-r border-[#252525] cursor-pointer select-none shrink-0',
        'transition-colors',
        isActive
          ? 'bg-[#1e1e1e] text-[#d4d4d4] border-t-2 border-t-[#569cd6]'
          : 'bg-[#2d2d2d] text-[#6e6e6e] border-t-2 border-t-transparent hover:bg-[#252525] hover:text-[#d4d4d4]',
      )}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      {...dragHandleProps}
    >
      {/* File icon */}
      <FileIcon filename={filename} size={14} className="shrink-0" />

      {/* Filename */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px]',
          tab.isPreview && 'italic',
        )}
        title={tab.filePath}
      >
        {filename}
      </span>

      {/* Dirty indicator / close button */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {tab.isDirty ? (
          // Dirty: show dot, show X on hover
          <>
            <span className="group-hover:hidden w-2 h-2 rounded-full bg-[#d4d4d4]" />
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              aria-label="Close tab"
              className="hidden group-hover:flex items-center justify-center w-4 h-4 rounded hover:bg-[#ffffff20] text-[#d4d4d4]"
            >
              <CloseIcon />
            </button>
          </>
        ) : (
          // Clean: show X on hover only
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            aria-label="Close tab"
            className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-4 h-4 rounded hover:bg-[#ffffff20] text-[#6e6e6e] hover:text-[#d4d4d4] transition-opacity"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Active bottom border already handled by border-t-[#569cd6] */}
    </div>
  )
}

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
    <path d="M5 4.293L8.646.646l.708.708L5.707 5l3.647 3.646-.708.708L5 5.707 1.354 9.354l-.708-.708L4.293 5 .646 1.354l.708-.708L5 4.293z"/>
  </svg>
)
