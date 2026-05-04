import React from 'react'
import { Notification } from './Notification'
import { useNotificationStore } from '../../store/notificationStore'

const MAX_VISIBLE = 5

export function NotificationContainer() {
  const { notifications, dismiss } = useNotificationStore()

  const visible = notifications.slice(0, MAX_VISIBLE)

  if (visible.length === 0) { return null }

  return (
    <div
      className="fixed bottom-8 right-4 z-[9800] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {visible.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <Notification
            notification={n}
            onDismiss={dismiss}
          />
        </div>
      ))}
    </div>
  )
}
