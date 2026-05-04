import React, { useRef, useEffect } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useEditorStore } from '../../store/editorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore } from '../../store/uiStore'
import { useTabStore } from '../../store/tabStore'

export interface CodeCanvasProps {
  tabId:    string
  path:     string
  content:  string
  language: string
  onChange: (value: string) => void
  onSave:   () => void
  onSaveAll:() => void
  onClose:  () => void
  onNextTab:() => void
  onReopenClosed: () => void
}

// ── Varta Dark theme — defined once ──────────────────────────────────────────
let themeRegistered = false

function ensureTheme() {
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
      'editor.background':                  '#1a1a1a',
      'editor.foreground':                  '#d4d4d4',
      'editor.lineHighlightBackground':     '#252525',
      'editor.selectionBackground':         '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
      'editorCursor.foreground':            '#d4d4d4',
      'editorLineNumber.foreground':        '#6e6e6e',
      'editorLineNumber.activeForeground':  '#c6c6c6',
      'editorWhitespace.foreground':        '#3b3b3b',
      'editorIndentGuide.background1':      '#404040',
      'editorIndentGuide.activeBackground1':'#707070',
      'editorGutter.background':            '#1a1a1a',
      'editorWidget.background':            '#252526',
      'editorWidget.border':                '#454545',
      'editorSuggestWidget.background':     '#252526',
      'editorSuggestWidget.border':         '#454545',
      'editorSuggestWidget.selectedBackground': '#062f4a',
      'editorHoverWidget.background':       '#252526',
      'editorHoverWidget.border':           '#454545',
      'input.background':                   '#3c3c3c',
      'focusBorder':                        '#569cd6',
      'scrollbarSlider.background':         '#42424260',
      'scrollbarSlider.hoverBackground':    '#686868',
      'scrollbarSlider.activeBackground':   '#bfbfbf',
      'minimap.background':                 '#1a1a1a',
      'editorOverviewRuler.border':         '#1a1a1a',
    },
  })
  monaco.editor.setTheme('varta-dark')
  themeRegistered = true
}

// ── Normalize path for consistent URI across Windows/Mac/Linux ───────────────
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}

export function CodeCanvas({
  tabId, path, content, language,
  onChange, onSave, onSaveAll, onClose, onNextTab, onReopenClosed,
}: CodeCanvasProps) {
  const editorRef      = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const previousTabId  = useRef<string | null>(null)

  // Always-current callback refs — keybindings read these, never stale
  const onSaveRef    = useRef(onSave);         onSaveRef.current    = onSave
  const onSaveAllRef = useRef(onSaveAll);      onSaveAllRef.current = onSaveAll
  const onCloseRef   = useRef(onClose);        onCloseRef.current   = onClose
  const onNextRef    = useRef(onNextTab);      onNextRef.current    = onNextTab
  const onReopenRef  = useRef(onReopenClosed); onReopenRef.current  = onReopenClosed
  const onChangeRef  = useRef(onChange);       onChangeRef.current  = onChange

  const { saveCursorState, getCursorState } = useEditorStore()
  const { settings } = useSettingsStore()
  const { openCommandPalette, setActiveBottomPanel, setPanelVisible } = useUIStore()
  const uiRef = useRef({ openCommandPalette, setActiveBottomPanel, setPanelVisible })
  uiRef.current = { openCommandPalette, setActiveBottomPanel, setPanelVisible }

  // ── onMount: called once when Monaco editor instance is created ───────────
  const handleMount: OnMount = (editor) => {
    editorRef.current = editor

    // Register Varta Dark theme
    ensureTheme()

    // Restore cursor for the initial tab
    const saved = getCursorState(tabId)
    if (saved?.position) {
      editor.setPosition(saved.position)
      editor.setScrollTop(saved.scrollTop ?? 0)
    }
    editor.focus()

    // ── Keybindings ──────────────────────────────────────────────────────────
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => onSaveRef.current())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS,
      () => onSaveAllRef.current())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW,
      () => onCloseRef.current())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Tab,
      () => onNextRef.current())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyT,
      () => onReopenRef.current())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP,
      () => uiRef.current.openCommandPalette())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote,
      () => { uiRef.current.setActiveBottomPanel('terminal'); uiRef.current.setPanelVisible(true) })

    // ── Cursor tracking ───────────────────────────────────────────────────────
    editor.onDidChangeCursorPosition((e) => {
      useTabStore.setState((s) => {
        const t = s.tabs.find((x) => x.id === tabId)
        if (t) { t.cursorLine = e.position.lineNumber; t.cursorCol = e.position.column }
      })
    })

    // ── Content change ────────────────────────────────────────────────────────
    // Monaco owns the content — we just notify parent of changes
    editor.onDidChangeModelContent(() => {
      onChangeRef.current(editor.getValue())
    })
  }

  // ── Tab switch: save old cursor, swap model, restore new cursor ───────────
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) { return }

    // 1. Save cursor state of the tab we're leaving
    if (previousTabId.current && previousTabId.current !== tabId) {
      saveCursorState(previousTabId.current, {
        position:  editor.getPosition(),
        scrollTop: editor.getScrollTop(),
      })
    }
    previousTabId.current = tabId

    // 2. Build URI — ALWAYS use this format for consistency
    const normalizedPath = normalizePath(path)
    const uri = monaco.Uri.parse(`file://${normalizedPath}`)

    // 3. Get or create model — ONLY set content on creation, never overwrite
    let model = monaco.editor.getModel(uri)
    if (!model) {
      model = monaco.editor.createModel(content, language, uri)
    }
    // NOTE: we do NOT call model.setValue(content) here
    // Monaco owns the content after creation — overwriting destroys undo history

    // 4. Swap model only if different
    if (editor.getModel()?.uri.toString() !== uri.toString()) {
      editor.setModel(model)
    }

    // 5. Restore cursor state for the new tab
    const saved = getCursorState(tabId)
    if (saved?.position) {
      requestAnimationFrame(() => {
        editor.setPosition(saved.position!)
        editor.setScrollTop(saved.scrollTop ?? 0)
        editor.focus()
      })
    } else {
      editor.setPosition({ lineNumber: 1, column: 1 })
      editor.focus()
    }
  }, [path, tabId]) // ← ONLY path and tabId — NOT content (that would overwrite)

  // ── Sync editor options when settings change ──────────────────────────────
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) { return }
    const es = settings.editor
    editor.updateOptions({
      fontSize:            es.fontSize,
      fontFamily:          es.fontFamily,
      tabSize:             es.tabSize,
      wordWrap:            es.wordWrap,
      minimap:             { enabled: es.showMinimap, maxColumn: es.minimapMaxColumn },
      lineNumbers:         es.showLineNumbers ? 'on' : 'off',
      renderWhitespace:    es.renderWhitespace,
      cursorStyle:         es.cursorStyle,
      cursorBlinking:      es.cursorBlinking,
      smoothScrolling:     es.smoothScrolling,
      mouseWheelZoom:      es.mouseWheelZoom,
      autoClosingBrackets: es.autoClosingBrackets ? 'always' : 'never',
      autoClosingQuotes:   es.autoClosingQuotes   ? 'always' : 'never',
      lineHeight:          es.lineHeight,
      letterSpacing:       es.letterSpacing,
    })
  }, [settings.editor])

  return (
    <MonacoEditor
      key="varta-monaco-singleton"   // ← NEVER changes — prevents remount
      height="100%"
      theme="varta-dark"
      onMount={handleMount}
      onChange={(value) => onChangeRef.current(value ?? '')}
      options={{
        automaticLayout:      true,
        scrollBeyondLastLine: false,
        smoothScrolling:      true,
        cursorBlinking:       'smooth',
        renderWhitespace:     'selection',
        padding:              { top: 8, bottom: 8 },
        contextmenu:          true,
        folding:              true,
        glyphMargin:          true,
        overviewRulerBorder:  false,
        renderLineHighlight:  'line',
        fixedOverflowWidgets: true,
        bracketPairColorization: { enabled: true },
        fontSize:             settings.editor.fontSize,
        fontFamily:           settings.editor.fontFamily,
        tabSize:              settings.editor.tabSize,
        wordWrap:             settings.editor.wordWrap,
        minimap:              { enabled: settings.editor.showMinimap },
        lineNumbers:          settings.editor.showLineNumbers ? 'on' : 'off',
      }}
      loading={
        <div className="flex items-center justify-center h-full bg-[#1a1a1a] text-[#6e6e6e] text-sm gap-2">
          <div className="w-4 h-4 border-2 border-[#569cd6] border-t-transparent rounded-full animate-spin" />
          Loading editor…
        </div>
      }
    />
  )
}
