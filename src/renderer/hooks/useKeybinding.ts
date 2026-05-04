import { useEffect } from 'react'
import { registry } from '../lib/commandRegistry'

function getKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) { parts.push('Ctrl') }
  if (e.shiftKey)              { parts.push('Shift') }
  if (e.altKey)                { parts.push('Alt') }

  const key = e.key
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key)
  }

  return parts.join('+')
}

// Keys that work even when Monaco editor is focused
const GLOBAL_COMBOS = new Set([
  'Ctrl+Shift+P', 'Ctrl+P', 'Ctrl+,',
  'Ctrl+Shift+A', 'Ctrl+B', 'Ctrl+`',
  'Ctrl+Shift+F', 'Ctrl+Shift+G', 'Ctrl+Shift+E',
  'F11',
])

const KEYBINDING_MAP: Record<string, string> = {
  'Ctrl+Shift+P':  'palette.commands',
  'Ctrl+P':        'palette.files',
  'Ctrl+,':        'settings.open',
  'Ctrl+S':        'file.save',
  'Ctrl+Shift+S':  'file.saveAll',
  'Ctrl+W':        'file.closeTab',
  'Ctrl+Shift+T':  'file.reopenClosed',
  'Ctrl+B':        'view.toggleSidebar',
  'Ctrl+J':        'view.togglePanel',
  'Ctrl+`':        'view.toggleTerminal',
  'Ctrl+Shift+F':  'edit.findInFiles',
  'Ctrl+Shift+G':  'git.openPanel',
  'Ctrl+Shift+E':  'view.explorer',
  'Ctrl+Shift+A':  'ai.openChat',
  'Ctrl+Shift+`':  'terminal.new',
  'F11':           'view.fullscreen',
}

export function useKeybinding() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const combo     = getKeyCombo(e)
      const commandId = KEYBINDING_MAP[combo]
      if (!commandId) { return }

      // Check if focus is inside Monaco editor
      const target   = e.target as HTMLElement
      const inMonaco = !!target.closest('.monaco-editor')

      // Only global combos work inside Monaco
      if (inMonaco && !GLOBAL_COMBOS.has(combo)) { return }

      // Don't intercept if typing in an input/textarea (except global combos)
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (inInput && !GLOBAL_COMBOS.has(combo)) { return }

      e.preventDefault()
      registry.execute(commandId)
    }

    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [])
}
