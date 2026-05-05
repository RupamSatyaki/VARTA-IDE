import React, { useCallback, useRef } from 'react'
import { cn } from '../../utils/cn'

export interface ResizableDividerProps {
  orientation: 'horizontal' | 'vertical'
  onResize:    (delta: number) => void
  className?:  string
}

export function ResizableDivider({ orientation, onResize, className }: ResizableDividerProps) {
  const dragging = useRef(false)
  const lastPos  = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    lastPos.current  = orientation === 'vertical' ? e.clientX : e.clientY

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) { return }
      const cur   = orientation === 'vertical' ? ev.clientX : ev.clientY
      const delta = cur - lastPos.current
      lastPos.current = cur
      onResize(delta)
    }

    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor     = orientation === 'vertical' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }, [orientation, onResize])

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'shrink-0 bg-transparent transition-colors',
        orientation === 'vertical'   ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        className,
      )}
      aria-hidden="true"
    />
  )
}
