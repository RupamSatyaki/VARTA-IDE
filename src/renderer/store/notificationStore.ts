import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface AppNotification {
  id:        string
  type:      NotificationType
  message:   string
  detail?:   string
  duration?: number   // ms, 0 = persistent
  action?:   { label: string; onClick: () => void }
}

export interface NotificationState {
  notifications: AppNotification[]
}

export interface NotificationActions {
  add:     (n: Omit<AppNotification, 'id'>) => string
  dismiss: (id: string) => void
  clear:   () => void
  reset:   () => void
}

const INITIAL: NotificationState = { notifications: [] }

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  immer((set) => ({
    ...INITIAL,

    add: (n) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`
      set((s) => { s.notifications.push({ ...n, id }) })

      const duration = n.duration ?? (n.type === 'error' ? 0 : 4000)
      if (duration > 0) {
        setTimeout(() => {
          set((s) => {
            const idx = s.notifications.findIndex((x) => x.id === id)
            if (idx >= 0) { s.notifications.splice(idx, 1) }
          })
        }, duration)
      }
      return id
    },

    dismiss: (id) => set((s) => {
      const idx = s.notifications.findIndex((n) => n.id === id)
      if (idx >= 0) { s.notifications.splice(idx, 1) }
    }),

    clear: () => set((s) => { s.notifications = [] }),
    reset: () => set(() => ({ ...INITIAL })),
  }))
)
