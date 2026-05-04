/** Default keybinding definitions for Varta */

export interface DefaultKeybinding {
  command:  string
  key:      string        // Windows/Linux
  mac?:     string        // macOS override
  when?:    string        // context condition
}

export const DEFAULT_KEYBINDINGS: DefaultKeybinding[] = [
  // ── File ──────────────────────────────────────────────────────────────────
  { command: 'varta.file.newFile',        key: 'ctrl+n',          mac: 'cmd+n' },
  { command: 'varta.file.openFile',       key: 'ctrl+o',          mac: 'cmd+o' },
  { command: 'varta.file.openFolder',     key: 'ctrl+k ctrl+o',   mac: 'cmd+k cmd+o' },
  { command: 'varta.file.save',           key: 'ctrl+s',          mac: 'cmd+s' },
  { command: 'varta.file.saveAll',        key: 'ctrl+k s',        mac: 'cmd+k s' },
  { command: 'varta.file.saveAs',         key: 'ctrl+shift+s',    mac: 'cmd+shift+s' },
  { command: 'varta.file.close',          key: 'ctrl+w',          mac: 'cmd+w' },
  { command: 'varta.file.closeAll',       key: 'ctrl+k ctrl+w',   mac: 'cmd+k cmd+w' },
  { command: 'varta.file.revert',         key: 'ctrl+shift+z',    mac: 'cmd+shift+z', when: 'editorFocus' },

  // ── Edit ──────────────────────────────────────────────────────────────────
  { command: 'varta.edit.undo',           key: 'ctrl+z',          mac: 'cmd+z',       when: 'editorFocus' },
  { command: 'varta.edit.redo',           key: 'ctrl+y',          mac: 'cmd+shift+z', when: 'editorFocus' },
  { command: 'varta.edit.cut',            key: 'ctrl+x',          mac: 'cmd+x',       when: 'editorFocus' },
  { command: 'varta.edit.copy',           key: 'ctrl+c',          mac: 'cmd+c',       when: 'editorFocus' },
  { command: 'varta.edit.paste',          key: 'ctrl+v',          mac: 'cmd+v',       when: 'editorFocus' },
  { command: 'varta.edit.selectAll',      key: 'ctrl+a',          mac: 'cmd+a',       when: 'editorFocus' },
  { command: 'varta.edit.find',           key: 'ctrl+f',          mac: 'cmd+f',       when: 'editorFocus' },
  { command: 'varta.edit.replace',        key: 'ctrl+h',          mac: 'cmd+h',       when: 'editorFocus' },
  { command: 'varta.edit.findNext',       key: 'f3',              mac: 'cmd+g',       when: 'editorFocus' },
  { command: 'varta.edit.findPrev',       key: 'shift+f3',        mac: 'cmd+shift+g', when: 'editorFocus' },
  { command: 'varta.edit.formatDocument', key: 'shift+alt+f',     mac: 'shift+option+f', when: 'editorFocus' },
  { command: 'varta.edit.toggleComment',  key: 'ctrl+/',          mac: 'cmd+/',       when: 'editorFocus' },
  { command: 'varta.edit.indentLine',     key: 'tab',                                 when: 'editorFocus && !suggestWidgetVisible' },
  { command: 'varta.edit.outdentLine',    key: 'shift+tab',                           when: 'editorFocus' },
  { command: 'varta.edit.moveLinesUp',    key: 'alt+up',          mac: 'option+up',   when: 'editorFocus' },
  { command: 'varta.edit.moveLinesDown',  key: 'alt+down',        mac: 'option+down', when: 'editorFocus' },
  { command: 'varta.edit.copyLinesUp',    key: 'shift+alt+up',    mac: 'shift+option+up',   when: 'editorFocus' },
  { command: 'varta.edit.copyLinesDown',  key: 'shift+alt+down',  mac: 'shift+option+down', when: 'editorFocus' },
  { command: 'varta.edit.deleteLine',     key: 'ctrl+shift+k',    mac: 'cmd+shift+k', when: 'editorFocus' },
  { command: 'varta.edit.addCursorAbove', key: 'ctrl+alt+up',     mac: 'cmd+option+up',   when: 'editorFocus' },
  { command: 'varta.edit.addCursorBelow', key: 'ctrl+alt+down',   mac: 'cmd+option+down', when: 'editorFocus' },
  { command: 'varta.edit.selectNextOccurrence', key: 'ctrl+d',    mac: 'cmd+d',       when: 'editorFocus' },

  // ── View ──────────────────────────────────────────────────────────────────
  { command: 'varta.view.commandPalette', key: 'ctrl+shift+p',    mac: 'cmd+shift+p' },
  { command: 'varta.view.quickOpen',      key: 'ctrl+p',          mac: 'cmd+p' },
  { command: 'varta.view.toggleSidebar',  key: 'ctrl+b',          mac: 'cmd+b' },
  { command: 'varta.view.togglePanel',    key: 'ctrl+j',          mac: 'cmd+j' },
  { command: 'varta.view.toggleTerminal', key: 'ctrl+`',          mac: 'cmd+`' },
  { command: 'varta.view.toggleFullscreen', key: 'f11' },
  { command: 'varta.view.zoomIn',         key: 'ctrl+=',          mac: 'cmd+=' },
  { command: 'varta.view.zoomOut',        key: 'ctrl+-',          mac: 'cmd+-' },
  { command: 'varta.view.zoomReset',      key: 'ctrl+0',          mac: 'cmd+0' },
  { command: 'varta.view.explorer',       key: 'ctrl+shift+e',    mac: 'cmd+shift+e' },
  { command: 'varta.view.search',         key: 'ctrl+shift+f',    mac: 'cmd+shift+f' },
  { command: 'varta.view.git',            key: 'ctrl+shift+g',    mac: 'cmd+shift+g' },
  { command: 'varta.view.extensions',     key: 'ctrl+shift+x',    mac: 'cmd+shift+x' },
  { command: 'varta.view.problems',       key: 'ctrl+shift+m',    mac: 'cmd+shift+m' },
  { command: 'varta.view.ai',             key: 'ctrl+shift+a',    mac: 'cmd+shift+a' },
  { command: 'varta.view.splitEditor',    key: 'ctrl+\\',         mac: 'cmd+\\' },
  { command: 'varta.view.nextEditor',     key: 'ctrl+tab',        mac: 'ctrl+tab' },
  { command: 'varta.view.prevEditor',     key: 'ctrl+shift+tab',  mac: 'ctrl+shift+tab' },

  // ── Go ────────────────────────────────────────────────────────────────────
  { command: 'varta.go.definition',       key: 'f12',                                 when: 'editorFocus' },
  { command: 'varta.go.references',       key: 'shift+f12',                           when: 'editorFocus' },
  { command: 'varta.go.line',             key: 'ctrl+g',          mac: 'cmd+g',       when: 'editorFocus' },
  { command: 'varta.go.back',             key: 'alt+left',        mac: 'ctrl+-' },
  { command: 'varta.go.forward',          key: 'alt+right',       mac: 'ctrl+shift+-' },
  { command: 'varta.go.symbol',           key: 'ctrl+shift+o',    mac: 'cmd+shift+o' },

  // ── Terminal ──────────────────────────────────────────────────────────────
  { command: 'varta.terminal.new',        key: 'ctrl+shift+`',    mac: 'cmd+shift+`' },
  { command: 'varta.terminal.kill',       key: 'ctrl+shift+delete' },
  { command: 'varta.terminal.clear',      key: 'ctrl+k',                              when: 'terminalFocus' },

  // ── AI ────────────────────────────────────────────────────────────────────
  { command: 'varta.ai.chat',             key: 'ctrl+shift+a',    mac: 'cmd+shift+a' },
  { command: 'varta.ai.inlineHint',       key: 'ctrl+i',          mac: 'cmd+i',       when: 'editorFocus' },
  { command: 'varta.ai.explainCode',      key: 'ctrl+shift+i',    mac: 'cmd+shift+i', when: 'editorFocus && editorHasSelection' },

  // ── Settings ──────────────────────────────────────────────────────────────
  { command: 'varta.settings.open',       key: 'ctrl+,',          mac: 'cmd+,' },
  { command: 'varta.settings.openJson',   key: 'ctrl+shift+,',    mac: 'cmd+shift+,' },
  { command: 'varta.settings.keybindings', key: 'ctrl+k ctrl+s',  mac: 'cmd+k cmd+s' },
]
