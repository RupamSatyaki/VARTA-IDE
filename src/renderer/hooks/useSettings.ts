import { useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useNotificationStore } from '../store/notificationStore'
import { isIPCSuccess } from '../../shared/ipc'
import { BUILT_IN_THEMES } from '../components/settings/ThemeSelector'
import type * as Monaco from 'monaco-editor'

// ── Theme application ─────────────────────────────────────────────────────────

export function applyTheme(themeId: string) {
  // Apply CSS variables via data-theme attribute
  document.documentElement.setAttribute('data-theme', themeId)

  // Also update Monaco theme
  const theme = BUILT_IN_THEMES.find((t) => t.id === themeId)
  if (!theme) { return }

  // Import monaco lazily to avoid circular deps
  import('monaco-editor').then((m) => {
    const isDark = theme.bg < '#888888'  // rough dark detection by hex value
    const base: Monaco.editor.BuiltinTheme = isDark ? 'vs-dark' : 'vs'

    m.editor.defineTheme('varta-active', {
      base,
      inherit: true,
      rules: [],
      colors: {
        'editor.background': theme.bg,
        'editor.foreground': theme.text,
      },
    })
    m.editor.setTheme('varta-active')
  }).catch(() => {})
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSettings() {
  const { settings, setSettings, update } = useSettingsStore()
  const { add: notify } = useNotificationStore()

  // ── Load settings ─────────────────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    const res = await window.varta.settings.getAll()
    if (isIPCSuccess(res)) {
      setSettings(res.data)
      applyTheme(res.data.workbench.theme)
    }
  }, [setSettings])

  // ── Update a single setting ───────────────────────────────────────────────

  const updateSetting = useCallback(async (section: string, value: unknown) => {
    const patch = { [section]: value } as any
    update(patch)

    // Apply theme immediately if appearance changed
    if (section === 'workbench' && (value as any)?.theme) {
      applyTheme((value as any).theme)
    }

    // Persist to main process
    await window.varta.settings.set(patch).catch(() => {})
  }, [update])

  // ── Reset all ─────────────────────────────────────────────────────────────

  const resetSettings = useCallback(async () => {
    const confirmRes = await window.varta.dialog.confirm(
      'Reset all settings to defaults?',
      'This will revert all your customizations.',
    )
    if (!isIPCSuccess(confirmRes) || !confirmRes.data.confirmed) { return }

    await window.varta.settings.resetAll()
    await loadSettings()
    notify({ type: 'success', message: 'Settings reset to defaults', duration: 2000 })
  }, [loadSettings, notify])

  // ── Export settings ───────────────────────────────────────────────────────

  const exportSettings = useCallback(async () => {
    const dataRes = await window.varta.settings.export()
    if (!isIPCSuccess(dataRes)) { return }

    const saveRes = await window.varta.dialog.saveFile({
      title:       'Export Settings',
      defaultPath: 'varta-settings.json',
      filters:     [{ name: 'JSON', extensions: ['json'] }],
    })
    if (!isIPCSuccess(saveRes) || saveRes.data.cancelled || !saveRes.data.path) { return }

    await window.varta.fs.writeFile({
      path:    saveRes.data.path,
      content: dataRes.data,
    })
    notify({ type: 'success', message: 'Settings exported', duration: 2000 })
  }, [notify])

  // ── Import settings ───────────────────────────────────────────────────────

  const importSettings = useCallback(async () => {
    const openRes = await window.varta.dialog.openFile({
      title:   'Import Settings',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (!isIPCSuccess(openRes) || openRes.data.cancelled || !openRes.data.paths[0]) { return }

    const fileRes = await window.varta.fs.readFile(openRes.data.paths[0])
    if (!isIPCSuccess(fileRes)) { return }

    const importRes = await window.varta.settings.import(fileRes.data.content)
    if (!isIPCSuccess(importRes)) {
      notify({ type: 'error', message: 'Invalid settings file' })
      return
    }

    await loadSettings()
    notify({ type: 'success', message: 'Settings imported', duration: 2000 })
  }, [loadSettings, notify])

  return {
    loadSettings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  }
}
