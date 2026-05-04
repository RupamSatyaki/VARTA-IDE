import React from 'react'
import { ContextMenu, type MenuItemDef } from '../ui/ContextMenu'

export interface TerminalContextMenuProps {
  children:   React.ReactElement
  onCopy:     () => void
  onPaste:    () => void
  onClear:    () => void
  onSelectAll:() => void
}

export function TerminalContextMenu({
  children,
  onCopy,
  onPaste,
  onClear,
  onSelectAll,
}: TerminalContextMenuProps) {
  const items: MenuItemDef[] = [
    { label: 'Copy',       onClick: onCopy,      shortcut: 'Ctrl+C' },
    { label: 'Paste',      onClick: onPaste,     shortcut: 'Ctrl+V' },
    { type: 'separator' },
    { label: 'Select All', onClick: onSelectAll, shortcut: 'Ctrl+A' },
    { label: 'Clear',      onClick: onClear },
  ]

  return <ContextMenu items={items}>{children}</ContextMenu>
}
