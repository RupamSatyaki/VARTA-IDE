import React from 'react'
import { cn } from '../../utils/cn'
import { Modal } from './Modal'
import { Button } from './Button'

export interface DialogAction {
  label: string
  variant?: 'default' | 'ghost' | 'danger' | 'primary'
  onClick: () => void
  loading?: boolean
}

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: DialogAction[]
  closeOnBackdrop?: boolean
  width?: string
  className?: string
}

export function Dialog({ open, onClose, title, children, actions, closeOnBackdrop = true, width = 'w-[480px]', className }: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} closeOnBackdrop={closeOnBackdrop} className={cn(width, 'max-w-[90vw]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333]">
        <h2 className="text-sm font-semibold text-[#d4d4d4]">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors rounded focus-visible:ring-2 focus-visible:ring-[#569cd6]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 7.293L12.646 2.646l.708.708L8.707 8l4.647 4.646-.708.708L8 8.707l-4.646 4.647-.708-.708L7.293 8 2.646 3.354l.708-.708L8 7.293z"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-4 text-sm text-[#d4d4d4]">
        {children}
      </div>

      {/* Footer */}
      {actions && actions.length > 0 && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#333333]">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant ?? 'default'}
              size="sm"
              onClick={action.onClick}
              loading={action.loading}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Modal>
  )
}
