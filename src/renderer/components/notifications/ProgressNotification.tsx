import React, { useEffect } from 'react'
import { cn } from '../../utils/cn'
import { useNotificationStore } from '../../store/notificationStore'

export interface ProgressNotificationProps {
  id:       string
  label:    string
  progress: number   // 0–100
}

export function ProgressNotification({ id, label, progress }: ProgressNotificationProps) {
  const { dismiss } = useNotificationStore()

  // Auto-dismiss when complete
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => dismiss(id), 1000)
      return () => clearTimeout(t)
    }
    return undefined
  }, [progress, id, dismiss])

  return (
    <div className="flex flex-col gap-2 w-80 rounded border border-[#333333] border-l-4 border-l-[#569cd6] bg-[#252526] px-3 py-3 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#d4d4d4]">{label}</span>
        <span className="text-xs text-[#6e6e6e]">{Math.round(progress)}%</span>
      </div>
      <div className="h-1 bg-[#333333] rounded overflow-hidden">
        <div
          className="h-full bg-[#569cd6] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
