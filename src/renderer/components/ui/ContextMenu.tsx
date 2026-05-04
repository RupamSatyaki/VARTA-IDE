import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface MenuItemDef {
  type?: 'item' | 'separator' | 'submenu'
  label?: string
  icon?: React.ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  onClick?: () => void
  submenu?: MenuItemDef[]
}

export interface ContextMenuProps {
  items: MenuItemDef[]
  children: React.ReactElement
  className?: string
}

interface MenuCoords { x: number; y: number }

export function ContextMenu({ items, children, className }: ContextMenuProps) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState<MenuCoords>({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) { return }
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) { close() }
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close() } }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey) }
  }, [open, close])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // Auto-flip near viewport edges
    const x = Math.min(e.clientX, window.innerWidth  - 200)
    const y = Math.min(e.clientY, window.innerHeight - items.length * 28 - 16)
    setCoords({ x, y })
    setOpen(true)
  }

  const cloned = React.cloneElement(children, { onContextMenu: handleContextMenu })

  return (
    <>
      {cloned}
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: coords.y, left: coords.x, zIndex: 9500 }}
          className={cn(
            'min-w-[180px] rounded border border-[#333333] bg-[#252525] py-1 shadow-xl animate-fade-in',
            className,
          )}
          role="menu"
        >
          {items.map((item, i) => <MenuItemRow key={i} item={item} onClose={close} />)}
        </div>,
        document.body,
      )}
    </>
  )
}

function MenuItemRow({ item, onClose }: { item: MenuItemDef; onClose: () => void }) {
  if (item.type === 'separator') {
    return <div className="my-1 h-px bg-[#333333]" role="separator" />
  }
  return (
    <button
      role="menuitem"
      disabled={item.disabled}
      onClick={() => { item.onClick?.(); onClose() }}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1 text-sm text-left',
        'transition-colors outline-none',
        item.danger
          ? 'text-[#f44747] hover:bg-[#3a1a1a] focus:bg-[#3a1a1a]'
          : 'text-[#d4d4d4] hover:bg-[#2a2d2e] focus:bg-[#2a2d2e]',
        item.disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {item.icon && <span className="w-4 h-4 flex items-center justify-center text-[#6e6e6e]">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && <span className="text-xs text-[#6e6e6e]">{item.shortcut}</span>}
    </button>
  )
}
