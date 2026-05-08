import React, { useCallback, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

export interface ResizableDividerProps {
  orientation: 'horizontal' | 'vertical'
  onResize:    (delta: number) => void
  className?:  string
}

export function ResizableDivider({ orientation, onResize, className }: ResizableDividerProps) {
  const dragging  = useRef(false)
  const lastPos   = useRef(0)
  const [active, setActive] = useState(false)
  const [hovered, setHovered] = useState(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    lastPos.current  = orientation === 'vertical' ? e.clientX : e.clientY
    setActive(true)

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) { return }
      const cur   = orientation === 'vertical' ? ev.clientX : ev.clientY
      const delta = cur - lastPos.current
      lastPos.current = cur
      onResize(delta)
    }

    const onUp = () => {
      dragging.current = false
      setActive(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor     = orientation === 'vertical' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }, [orientation, onResize])

  const isVert = orientation === 'vertical'

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'shrink-0 relative flex items-center justify-center transition-all duration-150',
        isVert ? 'w-[5px] cursor-col-resize' : 'h-[5px] cursor-row-resize',
        className,
      )}
      aria-hidden="true"
    >
      {/* Visible line */}
      <div
        className={cn(
          'absolute rounded-full transition-all duration-150',
          isVert ? 'w-[2px] top-4 bottom-4' : 'h-[2px] left-4 right-4',
          active  ? 'bg-[#a855f7] shadow-[0_0_6px_#a855f7]' :
          hovered ? 'bg-[#7c3aed]/60' :
                    'bg-transparent',
        )}
      />
    </div>
  )
}
