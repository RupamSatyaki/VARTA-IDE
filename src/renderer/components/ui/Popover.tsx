import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface PopoverProps {
  trigger: React.ReactElement
  children: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function Popover({ trigger, children, placement = 'bottom', open: controlledOpen, onOpenChange, className }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = useCallback((v: boolean) => {
    setInternalOpen(v)
    onOpenChange?.(v)
  }, [onOpenChange])

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) { return }
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 4
    if (placement === 'bottom') { setCoords({ top: rect.bottom + gap, left: rect.left }) }
    if (placement === 'top')    { setCoords({ top: rect.top - gap,    left: rect.left }) }
    if (placement === 'right')  { setCoords({ top: rect.top,          left: rect.right + gap }) }
    if (placement === 'left')   { setCoords({ top: rect.top,          left: rect.left - gap }) }
  }, [placement])

  useEffect(() => {
    if (!isOpen) { return }
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false) } }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey) }
  }, [isOpen, setOpen])

  const cloned = React.cloneElement(trigger, {
    ref: (el: HTMLElement) => { triggerRef.current = el },
    onClick: (e: React.MouseEvent) => {
      updateCoords()
      setOpen(!isOpen)
      trigger.props.onClick?.(e)
    },
  })

  return (
    <>
      {cloned}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9000 }}
          className={cn(
            'rounded border border-[#333333] bg-[#252525] shadow-lg animate-fade-in',
            className,
          )}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  )
}
