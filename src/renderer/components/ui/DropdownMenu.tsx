import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import type { MenuItemDef } from './ContextMenu'

export interface DropdownMenuProps {
  trigger: React.ReactElement
  items: MenuItemDef[]
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  className?: string
}

export function DropdownMenu({ trigger, items, placement = 'bottom-start', className }: DropdownMenuProps) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLElement | null>(null)
  const menuRef    = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => setOpen(false), [])

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) { return }
    const rect = triggerRef.current.getBoundingClientRect()
    const gap  = 2
    let top  = placement.startsWith('bottom') ? rect.bottom + gap : rect.top - gap
    let left = placement.endsWith('start')    ? rect.left         : rect.right

    // Auto-flip near viewport edges
    top  = Math.min(top,  window.innerHeight - items.length * 28 - 16)
    left = Math.min(left, window.innerWidth  - 200)
    setCoords({ top, left })
  }, [placement, items.length])

  useEffect(() => {
    if (!open) { return }
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) { close() }
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close() } }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey) }
  }, [open, close])

  const cloned = React.cloneElement(trigger, {
    ref: (el: HTMLElement) => { triggerRef.current = el },
    onClick: (e: React.MouseEvent) => {
      updateCoords()
      setOpen((v) => !v)
      trigger.props.onClick?.(e)
    },
    'aria-expanded': open,
    'aria-haspopup': 'menu',
  })

  return (
    <>
      {cloned}
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9500 }}
          className={cn(
            'min-w-[180px] rounded border border-[#333333] bg-[#252525] py-1 shadow-xl animate-fade-in',
            className,
          )}
          role="menu"
        >
          {items.map((item, i) => {
            if (item.type === 'separator') {
              return <div key={i} className="my-1 h-px bg-[#333333]" role="separator" />
            }
            return (
              <button
                key={i}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { item.onClick?.(); close() }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1 text-sm text-left',
                  'transition-colors outline-none',
                  item.danger
                    ? 'text-[#f44747] hover:bg-[#3a1a1a]'
                    : 'text-[#d4d4d4] hover:bg-[#2a2d2e]',
                  item.disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                {item.icon && <span className="w-4 h-4 flex items-center justify-center text-[#6e6e6e]">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && <span className="text-xs text-[#6e6e6e]">{item.shortcut}</span>}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
