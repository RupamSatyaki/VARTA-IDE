import React from 'react'
import { cn } from '../../utils/cn'
import { FileIcon } from '../filetree/FileIcon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
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

  return (
    <div
      role="tab"
      aria-selected={isActive}
      style={style}
      className={cn(
        'group relative flex items-center gap-1.5 h-[38px] px-3.5',
        'min-w-[90px] max-w-[180px] cursor-pointer select-none shrink-0',
        'transition-all duration-150',
        isActive
          ? 'bg-[#1e1e1e] text-[#e0e0e0]'
          : 'bg-transparent text-[#6e6e8a] hover:text-[#b0b0c8] hover:bg-[#ffffff06]',
      )}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.() }}
      {...dragHandleProps}
    >
      {/* Active top accent bar */}
      {isActive && (
        <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-b-sm" />
      )}

      {/* Right separator for inactive tabs */}
      {!isActive && (
        <span className="absolute right-0 top-2 bottom-2 w-px bg-[#2a2a3d]" />
      )}

      {/* File icon */}
      <FileIcon filename={filename} size={14} className="shrink-0 mt-px" />

      {/* Filename */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[12.5px]',
          tab.isPreview && 'italic opacity-80',
        )}
        title={tab.filePath}
      >
        {filename}
      </span>

      {/* Dirty dot / close button */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {tab.isDirty ? (
          <>
            <span className="group-hover:hidden w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              aria-label="Close tab"
              className="hidden group-hover:flex items-center justify-center w-4 h-4 rounded
                hover:bg-white/10 text-[#9090b0] hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
            </button>
          </>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            aria-label="Close tab"
            className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-4 h-4 rounded
              hover:bg-white/10 text-[#6e6e8a] hover:text-[#cccccc] transition-all"
          >
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
          </button>
        )}
      </div>
    </div>
  )
}
