import React, { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '../../utils/cn'

export interface VirtualListProps<T> {
  items: T[]
  rowHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  getKey?: (item: T, index: number) => string | number
}

export function VirtualList<T>({
  items,
  rowHeight,
  renderItem,
  overscan = 3,
  className,
  getKey,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [scrollTop, setScrollTop]             = useState(0)

  // Observe container height changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) { return }
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height)
    })
    ro.observe(el)
    setContainerHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)
  }, [])

  const totalHeight  = items.length * rowHeight
  const startIndex   = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleCount = containerHeight > 0 ? Math.ceil(containerHeight / rowHeight) : 0
  const endIndex     = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)

  const visibleItems = items.slice(startIndex, endIndex + 1)

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('overflow-y-auto overflow-x-hidden relative', className)}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible rows absolutely positioned */}
        <div style={{ position: 'absolute', top: startIndex * rowHeight, left: 0, right: 0 }}>
          {visibleItems.map((item, i) => {
            const actualIndex = startIndex + i
            const key = getKey ? getKey(item, actualIndex) : actualIndex
            return (
              <div key={key} style={{ height: rowHeight, overflow: 'hidden' }}>
                {renderItem(item, actualIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
