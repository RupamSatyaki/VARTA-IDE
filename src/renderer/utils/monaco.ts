import * as monaco from 'monaco-editor'

let themeRegistered = false

export function ensureMonacoTheme() {
  if (themeRegistered) { return }
  monaco.editor.defineTheme('varta-dark', {
    base:    'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment',                 foreground: '6a9955', fontStyle: 'italic' },
      { token: 'string',                  foreground: 'ce9178' },
      { token: 'string.escape',           foreground: 'd7ba7d' },
      { token: 'keyword',                 foreground: '569cd6' },
      { token: 'keyword.control',         foreground: 'c586c0' },
      { token: 'number',                  foreground: 'b5cea8' },
      { token: 'type',                    foreground: '4ec9b0' },
      { token: 'type.identifier',         foreground: '4ec9b0' },
      { token: 'entity.name.type',        foreground: '4ec9b0' },
      { token: 'entity.name.class',       foreground: '4ec9b0' },
      { token: 'entity.name.function',    foreground: 'dcdcaa' },
      { token: 'support.function',        foreground: 'dcdcaa' },
      { token: 'variable',                foreground: '9cdcfe' },
      { token: 'variable.parameter',      foreground: '9cdcfe' },
      { token: 'variable.other.constant', foreground: '4fc1ff' },
      { token: 'constant',                foreground: '4fc1ff' },
      { token: 'constant.language',       foreground: '569cd6' },
      { token: 'tag',                     foreground: '569cd6' },
      { token: 'attribute.name',          foreground: '9cdcfe' },
      { token: 'attribute.value',         foreground: 'ce9178' },
      { token: 'regexp',                  foreground: 'd16969' },
      { token: 'invalid',                 foreground: 'f44747' },
    ],
    colors: {
      'editor.background':                  '#28242e',
      'editor.foreground':                  '#d4d4d4',
      'editor.lineHighlightBackground':     '#1f1f2e',
      'editor.lineHighlightBorder':         '#1f1f2e',
      'editor.selectionBackground':         '#3d2b6e',
      'editor.inactiveSelectionBackground': '#2d2040',
      'editorCursor.foreground':            '#a855f7',
      'editorLineNumber.foreground':        '#6b6070',
      'editorLineNumber.activeForeground':  '#c8b8d8',
      'editorWhitespace.foreground':        '#2a2a3a',
      'editorIndentGuide.background1':      '#2a2a3a',
      'editorIndentGuide.activeBackground1':'#4a4a6a',
      'editorGutter.background':            '#221e28',
      'editorWidget.background':            '#1e1e2e',
      'editorWidget.border':                '#3a3a5a',
      'editorSuggestWidget.background':     '#1e1e2e',
      'editorSuggestWidget.border':         '#3a3a5a',
      'editorSuggestWidget.selectedBackground': '#2d1f5e',
      'editorSuggestWidget.highlightForeground': '#a855f7',
      'editorHoverWidget.background':       '#1e1e2e',
      'editorHoverWidget.border':           '#3a3a5a',
      'input.background':                   '#252535',
      'focusBorder':                        '#7c3aed',
      'scrollbarSlider.background':         '#2a2a4a40',
      'scrollbarSlider.hoverBackground':    '#4a4a7a',
      'scrollbarSlider.activeBackground':   '#7c3aed',
      'minimap.background':                 '#211d27',
      'editorOverviewRuler.border':         '#1a1a1a',
      'editorBracketMatch.background':      '#2d1f5e',
      'editorBracketMatch.border':          '#7c3aed',
    },
  })
  monaco.editor.setTheme('varta-dark')
  themeRegistered = true
}
