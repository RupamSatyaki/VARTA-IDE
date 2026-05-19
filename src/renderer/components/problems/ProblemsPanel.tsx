import React, { useState, useMemo } from 'react'
import { ProblemFilter } from './ProblemFilter'
import { ProblemItem }   from './ProblemItem'
import { useEditorStore } from '../../store/editorStore'
import { useTabStore }    from '../../store/tabStore'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { navigateToMatch } from '../../hooks/useSearch'

export function ProblemsPanel() {
  const { diagnostics, getErrorCount, getWarningCount } = useEditorStore()
  const { tabs, activeTabId } = useTabStore()
  const { rootPath } = useFileTreeStore()

  const [showErrors,   setShowErrors]   = useState(true)
  const [showWarnings, setShowWarnings] = useState(true)
  const [showInfo,     setShowInfo]     = useState(true)
  const [searchText,   setSearchText]   = useState('')
  const [thisFileOnly, setThisFileOnly] = useState(false)

  const errorCount   = getErrorCount()
  const warningCount = getWarningCount()

  // Build flat list of { filePath, diagnostic }
  const allProblems = useMemo(() => {
    const result: Array<{ filePath: string; uri: string; diagnostic: import('../../../shared/types/editor.types').Diagnostic }> = []

    for (const [uri, diags] of Object.entries(diagnostics)) {
      // Find matching tab
      const tab = tabs.find((t) => {
        const tabUri = `file:///${t.filePath.replace(/\\/g, '/').replace(/^\//, '')}`
        return uri === tabUri || uri.includes(t.filePath.replace(/\\/g, '/'))
      })
      const filePath = tab?.filePath ?? uri

      for (const d of diags) {
        result.push({ filePath, uri, diagnostic: d })
      }
    }
    return result
  }, [diagnostics, tabs])

  const filtered = useMemo(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId)

    return allProblems.filter(({ filePath, diagnostic: d }) => {
      if (thisFileOnly && activeTab && filePath !== activeTab.filePath) { return false }
      if (!showErrors   && d.severity === 'error')   { return false }
      if (!showWarnings && d.severity === 'warning')  { return false }
      if (!showInfo     && (d.severity === 'info' || d.severity === 'hint')) { return false }
      if (searchText && !d.message.toLowerCase().includes(searchText.toLowerCase())) { return false }
      return true
    })
  }, [allProblems, showErrors, showWarnings, showInfo, searchText, thisFileOnly, tabs, activeTabId])

  const handleClick = (filePath: string, line: number, col: number) => {
    navigateToMatch(filePath, line, col, 0)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-varta-bg">
      {/* Filters */}
      <ProblemFilter
        showErrors={showErrors}
        showWarnings={showWarnings}
        showInfo={showInfo}
        searchText={searchText}
        thisFileOnly={thisFileOnly}
        onToggleErrors={() => setShowErrors((v) => !v)}
        onToggleWarnings={() => setShowWarnings((v) => !v)}
        onToggleInfo={() => setShowInfo((v) => !v)}
        onSearchChange={setSearchText}
        onToggleThisFile={() => setThisFileOnly((v) => !v)}
      />

      {/* Problem list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-varta-text-faint">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" className="opacity-30">
              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
            </svg>
            <p className="text-xs">
              {allProblems.length === 0 ? 'No problems detected' : 'No matching problems'}
            </p>
          </div>
        ) : (
          filtered.map(({ filePath, diagnostic }, i) => (
            <ProblemItem
              key={`${filePath}-${i}`}
              diagnostic={diagnostic}
              filePath={filePath}
              rootPath={rootPath ?? undefined}
              onClick={() => handleClick(filePath, (diagnostic.range.startLine ?? 0) + 1, (diagnostic.range.startColumn ?? 0) + 1)}
            />
          ))
        )}
      </div>
    </div>
  )
}
