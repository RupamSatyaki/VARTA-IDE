import React, { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { NotificationIcon } from './NotificationIcon'
import type { AppNotification } from '../../store/notificationStore'

export interface NotificationProps {
  notification: AppNotification
  onDismiss:    (id: string) => void
}

const BORDER_COLORS = {
  info:    'border-l-[#569cd6]',
  success: 'border-l-[#4ec9b0]',
  warning: 'border-l-[#ff8c00]',
  error:   'border-l-[#f44747]',
}

export function Notification({ notification, onDismiss }: NotificationProps) {
  const { id, type, message, duration, action } = notification
  const [progress, setProgress] = useState(100)
  const [visible,  setVisible]  = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Slide in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Progress bar + auto-dismiss
  useEffect(() => {
    if (!duration || duration === 0) { return }

    const step     = 100 / (duration / 50)
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) {
          clearInterval(intervalRef.current!)
          onDismiss(id)
          return 0
        }
        return p - step
      })
    }, 50)

    return () => { if (intervalRef.current) { clearInterval(intervalRef.current) } }
  }, [id, duration, onDismiss])

  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 w-80 rounded border border-[#333333] border-l-4 bg-[#252526]',
        'shadow-xl transition-all duration-200',
        BORDER_COLORS[type],
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
      )}
    >
      <div className="flex items-start gap-2 px-3 pt-3 pb-2">
        <NotificationIcon type={type} />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#d4d4d4] font-medium leading-snug">{message}</p>
        </div>

        <button
          onClick={() => onDismiss(id)}
          className="shrink-0 text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 5.293L9.646 1.646l.708.708L6.707 6l3.647 3.646-.708.708L6 6.707 2.354 10.354l-.708-.708L5.293 6 1.646 2.354l.708-.708L6 5.293z"/>
          </svg>
        </button>
      </div>

      {/* Action button */}
      {action && (
        <div className="px-3 pb-2">
          <button
            onClick={() => { action.onClick(); onDismiss(id) }}
            className="text-xs text-[#569cd6] hover:text-[#4fc1ff] transition-colors"
          >
            {action.label}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {duration && duration > 0 && (
        <div className="h-0.5 bg-[#333333] rounded-b overflow-hidden">
          <div
            className="h-full bg-[#569cd6] transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
