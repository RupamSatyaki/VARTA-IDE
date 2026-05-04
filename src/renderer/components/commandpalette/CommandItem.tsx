import React from 'react'
import { cn } from '../../utils/cn'
import { FileIcon } from '../filetree/FileIcon'
import type { Command } from '../../lib/commandRegistry'

export interface CommandItemProps {
  command:    Command
  isSelected: boolean
  isFile?:    boolean
  filePath?:  string
  rootPath?:  string
  onClick:    () => void
}

export function CommandItem({
  command, isSelected, isFile, filePath, rootPath, onClick,
}: CommandItemProps) {
  const filename = filePath?.replace(/\\/g, '/').split('/').pop() ?? command.label
  const relPath  = rootPath && filePath
    ? filePath.replace(/\\/g, '/').replace(rootPath.replace(/\\/g, '/'), '').replace(/^\//, '')
    : filePath ?? ''

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2 cursor-pointer select-none',
        'transition-colors',
        isSelected ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]',
      )}
    >
      {/* Icon */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {isFile && filePath ? (
          <FileIcon filename={filename} size={14} />
        ) : (
          <CommandIcon category={command.category} />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#d4d4d4] truncate block">
          {isFile ? filename : command.label}
        </span>
        {isFile && relPath && relPath !== filename && (
          <span className="text-[10px] text-[#6e6e6e] truncate block">{relPath}</span>
        )}
        {!isFile && (
          <span className="text-[10px] text-[#6e6e6e]">{command.category}</span>
        )}
      </div>

      {/* Keybinding hint */}
      {command.keybinding && (
        <kbd className="text-[10px] text-[#6e6e6e] border border-[#555555] rounded px-1 py-0.5 shrink-0 font-mono">
          {command.keybinding}
        </kbd>
      )}

      {isFile && (
        <span className="text-[10px] text-[#6e6e6e] shrink-0">↵</span>
      )}
    </div>
  )
}

function CommandIcon({ category }: { category: string }) {
  const cat = category.toLowerCase()
  const color = cat === 'git'      ? '#f44747'
              : cat === 'terminal' ? '#4ec9b0'
              : cat === 'ai'       ? '#569cd6'
              : cat === 'file'     ? '#c09553'
              : cat === 'view'     ? '#6e6e6e'
              : '#6e6e6e'

  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill={color}>
      <circle cx="6" cy="6" r="4" opacity="0.7"/>
    </svg>
  )
}
