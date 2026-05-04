import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface TooltipProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  children: React.ReactElement
  className?: string
}

export function Tooltip({
  content,
  placement = 'bottom',
  delay = 500,
  children,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords]   = useState({ top: 0, left: 0 })
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const show = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let top = 0, left = 0
    const gap = 6
    if (placement === 'top')    { top = rect.top - gap;           left = rect.left + rect.width / 2 }
    if (placement === 'bottom') { top = rect.bottom + gap;        left = rect.left + rect.width / 2 }
    if (placement === 'left')   { top = rect.top + rect.height/2; left = rect.left - gap }
    if (placement === 'right')  { top = rect.top + rect.height/2; left = rect.right + gap }
    setCoords({ top, left })
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }, [placement, delay])

  const hide = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current) }
    setVisible(false)
  }, [])

  useEffect(() => () => { if (timerRef.current) { clearTimeout(timerRef.current) } }, [])

  const transformMap: Record<string, string> = {
    top:    'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left:   'translate(-100%, -50%)',
    right:  'translate(0, -50%)',
  }

  const child = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => { show(e); children.props.onMouseEnter?.(e) },
    onMouseLeave: (e: React.MouseEvent) => { hide();  children.props.onMouseLeave?.(e) },
    onFocus:      (e: React.FocusEvent) => { show(e as unknown as React.MouseEvent); children.props.onFocus?.(e) },
    onBlur:       (e: React.FocusEvent) => { hide();  children.props.onBlur?.(e) },
  })

  return (
    <>
      {child}
      {visible && createPortal(
        <div
          role="tooltip"
          style={{ position: 'fixed', top: coords.top, left: coords.left, transform: transformMap[placement], zIndex: 9999 }}
          className={cn(
            'px-2 py-1 text-xs rounded pointer-events-none whitespace-nowrap',
            'bg-[#252525] text-[#d4d4d4] border border-[#333333]',
            'shadow-lg animate-fade-in',
            className,
          )}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  )
}
