import React from 'react'
import { createRoot } from 'react-dom/client'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { App } from './App'
import './assets/styles/global.css'

// ── Monaco worker setup ───────────────────────────────────────────────────────
// Must be set BEFORE any editor is created.
// ?worker imports are processed by Vite into blob-URL workers.
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker   from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker    from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker   from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker     from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

;(self as any).MonacoEnvironment = {
  getWorker(_: string, label: string): Worker {
    if (label === 'json')                                         { return new JsonWorker() }
    if (label === 'css' || label === 'scss' || label === 'less')  { return new CssWorker() }
    if (label === 'html' || label === 'handlebars' || label === 'razor') { return new HtmlWorker() }
    if (label === 'typescript' || label === 'javascript')         { return new TsWorker() }
    return new EditorWorker()
  },
}

// ── Tell @monaco-editor/react to use our bundled monaco instance ──────────────
// This prevents it from fetching from CDN and ensures workers are shared.
loader.config({ monaco })

// Pre-initialize so the editor is ready immediately when first opened
loader.init().catch(console.error)

// ── React root ────────────────────────────────────────────────────────────────
const root = document.getElementById('root')
if (!root) { throw new Error('Root element not found') }

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
