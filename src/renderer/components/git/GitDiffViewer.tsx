import React from 'react'
import { DiffEditor } from '../editor/DiffEditor'
import { detectLanguage } from '../../../shared/constants/languages'

export interface GitDiffViewerProps {
  path:     string
  original: string
  modified: string
}

export function GitDiffViewer({ path, original, modified }: GitDiffViewerProps) {
  const language = detectLanguage(path)
  const filename = path.replace(/\\/g, '/').split('/').pop() ?? path

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-8 bg-[#252526] border-b border-[#333333] shrink-0">
        <span className="text-xs text-[#6e6e6e]">
          {filename} — Working Tree Diff
        </span>
      </div>

      {/* Diff editor */}
      <div className="flex-1 min-h-0">
        <DiffEditor
          path={path}
          original={original}
          modified={modified}
          language={language}
          readOnly={false}
        />
      </div>
    </div>
  )
}
