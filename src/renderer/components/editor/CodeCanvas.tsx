import React, { useRef, useEffect } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useEditorStore } from '../../store/editorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore } from '../../store/uiStore'
import { useTabStore } from '../../store/tabStore'
import { useAIStore } from '../../store/aiStore'
import { useGitStore } from '../../store/gitStore'
import { ensureMonacoTheme } from '../../utils/monaco'

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
    ensureMonacoTheme()

    // ── Set model for the current tab (may have been created before mount) ──
    const uri = monaco.Uri.file(path)
    let model = monaco.editor.getModel(uri)
    if (!model) {
      model = monaco.editor.createModel(content, language, uri)
    }
    editor.setModel(model)
    previousTabId.current = tabId

    // Restore cursor for the initial tab
    const saved = getCursorState(tabId)
    if (saved?.position) {
      editor.setPosition(saved.position)
      editor.setScrollTop(saved.scrollTop ?? 0)
    }
    editor.focus()

    // Fire editorReady callback (used by search result navigation)
    useEditorStore.getState().fireEditorReady(tabId, editor)

    // Wire Monaco diagnostics → editorStore
    monaco.editor.onDidChangeMarkers((uris) => {
      uris.forEach((uri) => {
        const markers = monaco.editor.getModelMarkers({ resource: uri })
        useEditorStore.getState().setDiagnostics(uri.toString(), markers.map((m) => ({
          severity:        m.severity === 8 ? 'error' : m.severity === 4 ? 'warning' : m.severity === 2 ? 'info' : 'hint',
          message:         m.message,
          range: {
            startLine:   m.startLineNumber - 1,
            startColumn: m.startColumn - 1,
            endLine:     m.endLineNumber - 1,
            endColumn:   m.endColumn - 1,
          },
          source:          m.source,
          code:            m.code?.toString(),
        })))
      })
    })

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
      updateGitGutter()
    })

    // ── Reveal-in-editor event (from search result click) ─────────────────
    const handleReveal = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.tabId !== tabId) { return }
      const { lineNumber, column, matchLength } = detail
      editor.revealLineInCenter(lineNumber)
      editor.setSelection({
        startLineNumber: lineNumber,
        startColumn:     column,
        endLineNumber:   lineNumber,
        endColumn:       column + matchLength,
      })
      editor.focus()
      useEditorStore.getState().clearCallback(tabId)
    }
    window.addEventListener('varta:reveal-in-editor', handleReveal)

    // ── Git gutter decorations ──────────────────────────────────────────────
    let gitDecorations: string[] = []
    const updateGitGutter = async () => {
      const model = editor.getModel()
      if (!model) return

      try {
        const res = await window.varta.git.diffFile(path, false)
        if (!res.success || !res.data) {
          gitDecorations = editor.deltaDecorations(gitDecorations, [])
          return
        }

        const newDecorations: monaco.editor.IModelDeltaDecoration[] = []
        res.data.hunks.forEach((hunk) => {
          // 'added' hunk
          if (hunk.oldLines === 0 && hunk.newLines > 0) {
            newDecorations.push({
              range: new monaco.Range(hunk.newStart, 1, hunk.newStart + hunk.newLines - 1, 1),
              options: { isWholeLine: true, linesDecorationsClassName: 'git-gutter-added' },
            })
          }
          // 'deleted' hunk
          else if (hunk.newLines === 0 && hunk.oldLines > 0) {
            newDecorations.push({
              range: new monaco.Range(Math.max(1, hunk.newStart), 1, Math.max(1, hunk.newStart), 1),
              options: { isWholeLine: true, linesDecorationsClassName: 'git-gutter-deleted' },
            })
          }
          // 'modified' hunk
          else {
            newDecorations.push({
              range: new monaco.Range(hunk.newStart, 1, hunk.newStart + hunk.newLines - 1, 1),
              options: { isWholeLine: true, linesDecorationsClassName: 'git-gutter-modified' },
            })
          }
        })

        gitDecorations = editor.deltaDecorations(gitDecorations, newDecorations)
      } catch {
        gitDecorations = editor.deltaDecorations(gitDecorations, [])
      }
    }

    // Initial gutter load
    updateGitGutter()

    // Update gutter when git status changes
    const offGit = useGitStore.subscribe((state, prev) => {
      if (state.status !== prev.status) { updateGitGutter() }
    })

    // ── AI context menu actions ───────────────────────────────────────────
    const aiActions = [
      { id: 'varta.explainCode',   label: '✨ Explain this code',       action: 'explain' },
      { id: 'varta.fixErrors',     label: '🔧 Fix errors',              action: 'fix' },
      { id: 'varta.refactor',      label: '♻ Refactor',                 action: 'refactor' },
      { id: 'varta.writeTests',    label: '🧪 Write tests',             action: 'tests' },
      { id: 'varta.generateDocs',  label: '📝 Generate docs',           action: 'docs' },
    ]
    aiActions.forEach(({ id, label, action }, i) => {
      editor.addAction({
        id,
        label,
        contextMenuGroupId: 'varta',
        contextMenuOrder:   i + 1,
        run: (ed) => {
          const sel  = ed.getSelection()
          const text = sel ? (ed.getModel()?.getValueInRange(sel) ?? '') : ''
          useUIStore.getState().setActiveSidebarPanel('ai')
          window.dispatchEvent(new CustomEvent('varta:ai-action', {
            detail: { action, selectedText: text },
          }))
        },
      })
    })

    // ── Inline hints ──────────────────────────────────────────────────────
    let inlineHintTimeout: ReturnType<typeof setTimeout> | null = null
    let inlineDecorations: string[] = []
    let tabDisposable: { dispose: () => void } | null = null

    const contentChangeDisposable = editor.onDidChangeModelContent(() => {
      // Clear previous hint
      inlineDecorations = editor.deltaDecorations(inlineDecorations, [])
      tabDisposable?.dispose()
      tabDisposable = null
      if (inlineHintTimeout) { clearTimeout(inlineHintTimeout) }

      const settings = useSettingsStore.getState().settings
      if (!settings.ai.inlineHints) { return }

      if (!useAIStore.getState().hasApiKey) { return }

      inlineHintTimeout = setTimeout(async () => {
        const model    = editor.getModel()
        const position = editor.getPosition()
        if (!model || !position) { return }

        const lineContent = model.getLineContent(position.lineNumber)
        const isEndOfLine = position.column > lineContent.trimEnd().length
        if (!isEndOfLine || !lineContent.trim()) { return }

        const content = model.getValue()
        const offset  = model.getOffsetAt(position)
        const prefix  = content.substring(Math.max(0, offset - 500), offset)

        try {
          const res = await window.varta.ai.inlineHint({
            context: {
              activeFilePath:    model.uri.fsPath || '',
              activeFileContent: prefix,
              selectedText:      null,
              cursorLine:        position.lineNumber,
              language:          model.getLanguageId(),
              diagnostics:       [],
              projectRoot:       '',
              openTabs:          [],
            },
          })

          if (!res.success || !res.data?.hint) { return }
          const hint = res.data.hint

          inlineDecorations = editor.deltaDecorations([], [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            options: {
              after: { content: hint, inlineClassName: 'ai-inline-hint' },
            },
          }])

          // Tab → accept hint
          tabDisposable = editor.addCommand(monaco.KeyCode.Tab, () => {
            editor.executeEdits('ai-hint', [{
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
              text:  hint,
            }])
            inlineDecorations = editor.deltaDecorations(inlineDecorations, [])
            tabDisposable?.dispose()
            tabDisposable = null
          }) as unknown as { dispose: () => void }
        } catch { /* ignore hint errors */ }
      }, settings.ai.inlineHintsDelay ?? 600)
    })
  }

  // ── Tab switch: save old cursor, swap model, restore new cursor ───────────
  useEffect(() => {
    const editor = editorRef.current

    // Build URI and model regardless of editor mount state
    const normalizedPath = normalizePath(path)
    const uri = monaco.Uri.parse(`file://${normalizedPath}`)

    // Always ensure model exists with correct content
    let model = monaco.editor.getModel(uri)
    if (!model) {
      model = monaco.editor.createModel(content, language, uri)
    }

    if (!editor) { return }  // editor not mounted yet — model created, will be set on mount

    // 1. Save cursor state of the tab we're leaving
    if (previousTabId.current && previousTabId.current !== tabId) {
      saveCursorState(previousTabId.current, {
        position:  editor.getPosition(),
        scrollTop: editor.getScrollTop(),
      })
    }
    previousTabId.current = tabId

    // 2. Swap model only if different
    if (editor.getModel()?.uri.toString() !== uri.toString()) {
      editor.setModel(model)
    } else if (content && editor.getModel()?.getValue() === '') {
      // If same model but it's empty and we have content (e.g. restoration finished)
      editor.getModel()?.setValue(content)
    }

    // 3. Restore cursor state for the new tab
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
  }, [path, tabId])

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
      minimap:             { enabled: es.showMinimap, maxColumn: 60 },
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
        glyphMargin:          false,
        lineNumbersMinChars:  2,
        overviewRulerBorder:  false,
        renderLineHighlight:  'line',
        fixedOverflowWidgets: true,
        bracketPairColorization: { enabled: true },
        fontLigatures:        true,
        pixelRatio:           window.devicePixelRatio,
        fontSize:             settings.editor.fontSize,
        fontFamily:           settings.editor.fontFamily,
        tabSize:              settings.editor.tabSize,
        wordWrap:             settings.editor.wordWrap,
        minimap:              { enabled: settings.editor.showMinimap, maxColumn: 60 },
        lineNumbers:          settings.editor.showLineNumbers ? 'on' : 'off',
      }}
      loading={
        <div className="flex items-center justify-center h-full bg-[#28242e] text-[#5a5a7a] text-[12px] gap-2.5">
          <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
          Loading editor…
        </div>
      }
    />
  )
}
