import React from 'react'
import { useUIStore }     from '../../store/uiStore'
import { useEditorStore } from '../../store/editorStore'
import { Tabs }           from '../ui/Tabs'
import { TerminalPanel }  from '../terminal/TerminalPanel'
import { ProblemsPanel }  from '../problems/ProblemsPanel'
import { OutputPanel }    from '../output/OutputPanel'
import { DebugConsole }   from '../debug/DebugConsole'

export function PanelArea() {
  const { panelVisible, panelHeight, activeBottomPanel, setActiveBottomPanel } = useUIStore()
  const { getErrorCount, getWarningCount } = useEditorStore()

  if (!panelVisible) { return null }

  const errorCount   = getErrorCount()
  const warningCount = getWarningCount()

  const PANEL_TABS = [
    { id: 'terminal', label: 'Terminal' },
    {
      id: 'problems',
      label: (
        <span className="flex items-center gap-1">
          Problems
          {(errorCount > 0 || warningCount > 0) && (
            <span className="flex items-center gap-1 text-[10px]">
              {errorCount   > 0 && <span className="text-[#f44747]">{errorCount}</span>}
              {warningCount > 0 && <span className="text-[#ff8c00]">{warningCount}</span>}
            </span>
          )}
        </span>
      ),
    },
    { id: 'output', label: 'Output' },
    { id: 'debug',  label: 'Debug Console' },
  ]

  return (
    <div
      style={{
        height:         panelHeight,
        minHeight:      panelHeight,
        display:        'flex',
        flexDirection:  'column',
        flexShrink:     0,
        overflow:       'hidden',
        border:         'none',
        backgroundColor:'#28242e',
        borderRadius:   '12px 12px 12px 12px',
        margin:         '8px 8px 0 0',
      }}
    >
      <Tabs
        tabs={PANEL_TABS}
        activeTab={activeBottomPanel}
        onChange={(id) => setActiveBottomPanel(id as 'terminal' | 'problems' | 'output' | 'debug')}
        className="bg-[#28242e] border-b border-[#2a1f30] px-2 shrink-0"
      />

      <div style={{ flex: '1 1 0', overflow: 'hidden', minHeight: 0 }}>
        {activeBottomPanel === 'terminal' && <TerminalPanel />}
        {activeBottomPanel === 'problems' && <ProblemsPanel />}
        {activeBottomPanel === 'output'   && <OutputPanel />}
        {activeBottomPanel === 'debug'    && <DebugConsole />}
      </div>
    </div>
  )
}
