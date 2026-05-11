import React, { useRef, useEffect } from 'react'
import { useMonaco } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { ensureMonacoTheme } from '../../utils/monaco'

export interface DiffEditorProps {
  path:     string
  original: string
  modified: string
  language?: string
  readOnly?: boolean
}

export function DiffEditor({ path, original, modified, language = 'text', readOnly = false }: DiffEditorProps) {
  const monaco      = useMonaco()
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef   = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null)

  useEffect(() => {
    if (!monaco || !containerRef.current) { return }

    // Register Varta Dark theme
    ensureMonacoTheme()

    const origUri  = monaco.Uri.parse(`diff-original://${path}`)
    const modUri   = monaco.Uri.parse(`diff-modified://${path}`)

    const origModel = monaco.editor.getModel(origUri)
      ?? monaco.editor.createModel(original, language, origUri)
    const modModel  = monaco.editor.getModel(modUri)
      ?? monaco.editor.createModel(modified, language, modUri)

    const editor = monaco.editor.createDiffEditor(containerRef.current, {
      theme:           'varta-dark',
      readOnly,
      automaticLayout: true,
      renderSideBySide: true,
      scrollBeyondLastLine: false,
      fontSize:        14,
      minimap:         { enabled: false },
      padding:         { top: 8 },
    })

    editor.setModel({ original: origModel, modified: modModel })
    editorRef.current = editor

    return () => {
      editor.dispose()
      if (!origModel.isDisposed()) { origModel.dispose() }
      if (!modModel.isDisposed())  { modModel.dispose() }
    }
  }, [monaco, path, language])

  // Update content when props change
  useEffect(() => {
    if (!editorRef.current) { return }
    const model = editorRef.current.getModel()
    if (model?.original.getValue() !== original) { model?.original.setValue(original) }
    if (model?.modified.getValue() !== modified) { model?.modified.setValue(modified) }
  }, [original, modified])

  return (
    <div ref={containerRef} className="flex-1 min-h-0 w-full h-full" />
  )
}
