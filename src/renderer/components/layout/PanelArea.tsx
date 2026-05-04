import React from 'react'
import { useUIStore }    from '../../store/uiStore'
import { Tabs }          from '../ui/Tabs'
import { TerminalPanel } from '../terminal/TerminalPanel'

const PANEL_TABS = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'problems', label: 'Problems' },
  { id: 'output',   label: 'Output' },
]

export function PanelArea() {
  const { panelVisible, panelHeight, activeBottomPanel, setActiveBottomPanel } = useUIStore()

  if (!panelVisible) { return null }

  return (
    /*
     * RC2 FIX: Explicit pixel height from store — no flex-shrink collapse.
     * Use inline style for height so it's always applied regardless of Tailwind.
     */
    <div
      style={{
        height:         panelHeight,
        minHeight:      panelHeight,
        display:        'flex',
        flexDirection:  'column',
        flexShrink:     0,
        overflow:       'hidden',
        borderTop:      '1px solid #333333',
        backgroundColor:'#1e1e1e',
      }}
    >
      {/* Panel tab switcher */}
      <Tabs
        tabs={PANEL_TABS}
        activeTab={activeBottomPanel}
        onChange={(id) => setActiveBottomPanel(id as 'terminal' | 'problems' | 'output' | 'debug')}
        className="bg-[#252526] border-b border-[#333333] px-2 shrink-0"
      />

      {/*
       * Content area — flex:1 so it fills remaining height after tab bar.
       * TerminalPanel must receive 100% height here.
       */}
      <div style={{ flex: '1 1 0', overflow: 'hidden', minHeight: 0 }}>
        {activeBottomPanel === 'terminal' && <TerminalPanel />}
        {activeBottomPanel !== 'terminal' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#6e6e6e', fontSize: 13, opacity: 0.4,
          }}>
            {activeBottomPanel}
          </div>
        )}
      </div>
    </div>
  )
}
