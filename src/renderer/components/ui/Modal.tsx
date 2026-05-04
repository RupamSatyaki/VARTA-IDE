import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  closeOnBackdrop?: boolean
  className?: string
}

export function Modal({ open, onClose, children, closeOnBackdrop = true, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Trap focus inside modal
  useEffect(() => {
    if (!open) { return }
    const prev = document.activeElement as HTMLElement | null
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.[0]?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) { return }
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      prev?.focus()
    }
  }, [open, onClose])

  if (!open) { return null }

  return createPortal(
    <div
      className="fixed inset-0 z-[8000] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative z-10 rounded border border-[#333333] bg-[#252525] shadow-xl',
          'animate-fade-in',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
