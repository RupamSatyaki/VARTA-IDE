import { useCallback, useEffect, useRef } from 'react'
import { useTerminalStore }    from '../store/terminalStore'
import { useNotificationStore } from '../store/notificationStore'
import { isIPCSuccess }        from '../../shared/ipc'

export function useTerminal() {
  const { add: notify } = useNotificationStore()
  const notifyRef = useRef(notify)
  notifyRef.current = notify

  // ── Create terminal ────────────────────────────────────────────────────────

  const createTerminal = useCallback(async (cwd?: string) => {
    try {
      const res = await window.varta.terminal.create({ cwd })
      if (!isIPCSuccess(res)) {
        notifyRef.current({ type: 'error', message: `Failed to create terminal: ${res.error.message}` })
        return null
      }

      const instance = res.data
      useTerminalStore.getState().addInstance(instance)
      useTerminalStore.getState().setActive(instance.id)

      // Listen for exit
      const offExit = window.varta.terminal.onExit((event) => {
        if (event.id !== instance.id) { return }
        notifyRef.current({
          type:     'info',
          message:  `Terminal exited (code: ${event.exitCode ?? 0})`,
          duration: 3000,
        })
        useTerminalStore.getState().updateInstance(instance.id, { isAlive: false })
      })

      // Store cleanup — called when terminal is destroyed
      ;(instance as any)._cleanup = offExit

      return instance.id
    } catch (e) {
      notifyRef.current({ type: 'error', message: 'Failed to create terminal' })
      return null
    }
  }, [])

  // ── Destroy terminal ───────────────────────────────────────────────────────

  const destroyTerminal = useCallback(async (id: string) => {
    const store = useTerminalStore.getState()
    const inst  = store.instances.get(id)

    // Call cleanup (remove exit listener)
    if (inst && (inst as any)._cleanup) {
      ;(inst as any)._cleanup()
    }

    // Tell main process to kill the PTY
    await window.varta.terminal.destroy(id).catch(() => {})

    // Remove from store
    store.removeInstance(id)

    // If no terminals left, auto-create a new one
    const remaining = useTerminalStore.getState().instances.size
    if (remaining === 0) {
      // Small delay so the UI settles before creating new terminal
      setTimeout(() => {
        createTerminal()
      }, 100)
    }
  }, [createTerminal])

  // ── Set CWD ────────────────────────────────────────────────────────────────

  const setTerminalCwd = useCallback(async (id: string, cwd: string) => {
    await window.varta.terminal.setCwd(id, cwd).catch(() => {})
  }, [])

  return {
    createTerminal,
    destroyTerminal,
    setTerminalCwd,
  }
}
