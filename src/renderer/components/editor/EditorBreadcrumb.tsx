import React from 'react'
import { cn } from '../../utils/cn'
import { useFileTreeStore } from '../../store/fileTreeStore'

export interface EditorBreadcrumbProps {
  filePath:      string
  currentSymbol?: string
  onSegmentClick?: (path: string) => void
}

export function EditorBreadcrumb({ filePath, currentSymbol, onSegmentClick }: EditorBreadcrumbProps) {
  const { rootPath } = useFileTreeStore()

  // Build segments relative to rootPath
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

  return (
    <div className="flex items-center h-[22px] px-3 bg-[#1e1e1e] border-b border-[#252525] overflow-hidden">
      <div className="flex items-center gap-0 text-xs text-[#6e6e6e] overflow-hidden">
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1
          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="mx-1 text-[#3c3c3c]">›</span>
              )}
              <button
                onClick={() => !isLast && onSegmentClick?.(buildPath(idx))}
                className={cn(
                  'truncate max-w-[160px] hover:text-[#d4d4d4] transition-colors',
                  isLast ? 'text-[#d4d4d4] cursor-default' : 'cursor-pointer',
                )}
                title={seg}
              >
                {seg}
              </button>
            </React.Fragment>
          )
        })}

        {/* Current symbol */}
        {currentSymbol && (
          <>
            <span className="mx-1 text-[#3c3c3c]">›</span>
            <span className="text-[#dcdcaa] truncate max-w-[160px]">{currentSymbol}</span>
          </>
        )}
      </div>
    </div>
  )
}
