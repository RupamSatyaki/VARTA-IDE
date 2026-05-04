import { create } from 'zustand'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface AppNotification {
  id:        string
  type:      NotificationType
  message:   string
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
  // Convenience helpers
  success: (message: string, duration?: number) => string
  error:   (message: string) => string
  warning: (message: string, duration?: number) => string
  info:    (message: string, duration?: number) => string
}

export const useNotificationStore = create<NotificationState & NotificationActions>()((set, get) => ({
  notifications: [],

  add: (n) => {
    const id       = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const duration = n.duration ?? (n.type === 'error' ? 0 : 4000)
    set((s) => ({ notifications: [...s.notifications, { ...n, id, duration }] }))

    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }))
      }, duration)
    }
    return id
  },

  dismiss: (id) => set((s) => ({
    notifications: s.notifications.filter((n) => n.id !== id),
  })),

  clear: () => set({ notifications: [] }),
  reset: () => set({ notifications: [] }),

  // Helpers
  success: (message, duration = 2500) =>
    get().add({ type: 'success', message, duration }),
  error:   (message) =>
    get().add({ type: 'error',   message, duration: 0 }),
  warning: (message, duration = 4000) =>
    get().add({ type: 'warning', message, duration }),
  info:    (message, duration = 3000) =>
    get().add({ type: 'info',    message, duration }),
}))
