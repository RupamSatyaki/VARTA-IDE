import React from 'react'
import { cn } from '../../utils/cn'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FileIcon } from '../filetree/FileIcon'

export interface EditorBreadcrumbProps {
  filePath:       string
  currentSymbol?: string
  onSegmentClick?: (path: string) => void
}

export function EditorBreadcrumb({ filePath, currentSymbol, onSegmentClick }: EditorBreadcrumbProps) {
  const { rootPath } = useFileTreeStore()

  const norm     = filePath.replace(/\\/g, '/')
  const normRoot = (rootPath ?? '').replace(/\\/g, '/')
  const relative = norm.startsWith(normRoot)
    ? norm.slice(normRoot.length).replace(/^\//, '')
    : norm

  const segments = relative.split('/').filter(Boolean)

  const buildPath = (idx: number) => {
    const parts = normRoot ? [normRoot, ...segments.slice(0, idx + 1)] : segments.slice(0, idx + 1)
    return parts.join('/')
  }

  const filename = segments[segments.length - 1] ?? ''

  return (
    <div className="flex items-center h-[26px] px-3 bg-[#1a1a1a] border-b border-[#222233] overflow-hidden shrink-0">
      <div className="flex items-center gap-0.5 text-[11px] text-[#5a5a7a] overflow-hidden">
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1
          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <FontAwesomeIcon
                  icon={faChevronRight}
                  style={{ fontSize: 8 }}
                  className="mx-1 text-[#3a3a4a] shrink-0"
                />
              )}
              <button
                onClick={() => !isLast && onSegmentClick?.(buildPath(idx))}
                className={cn(
                  'flex items-center gap-1 truncate max-w-[160px] transition-colors rounded px-0.5',
                  isLast
                    ? 'text-[#cccccc] cursor-default'
                    : 'hover:text-[#9090b0] cursor-pointer',
                )}
                title={seg}
              >
                {/* Show file icon only for last segment */}
                {isLast && (
                  <FileIcon filename={seg} size={12} className="shrink-0" />
                )}
                <span>{seg}</span>
              </button>
            </React.Fragment>
          )
        })}

        {currentSymbol && (
          <>
            <FontAwesomeIcon
              icon={faChevronRight}
              style={{ fontSize: 8 }}
              className="mx-1 text-[#3a3a4a] shrink-0"
            />
            <span className="text-[#dcdcaa] truncate max-w-[160px]">{currentSymbol}</span>
          </>
        )}
      </div>
    </div>
  )
}
