import React, { useEffect, useRef } from 'react'
import { TerminalTabs }     from './TerminalTabs'
import { TerminalInstance } from './TerminalInstance'
import { useTerminalStore } from '../../store/terminalStore'
import { useTerminal }      from '../../hooks/useTerminal'
import { useFileTreeStore } from '../../store/fileTreeStore'

export function TerminalPanel() {
  const { instances, activeTerminalId } = useTerminalStore()
  const { createTerminal, destroyTerminal } = useTerminal()
  const { rootPath } = useFileTreeStore()
  const initializedRef = useRef(false)

  // Auto-create one terminal on first mount
  useEffect(() => {
    if (initializedRef.current) { return }
    initializedRef.current = true
    if (instances.size === 0) {
      createTerminal(rootPath ?? undefined)
    }
  }, [])

  const instanceList = Array.from(instances.values())

  const handleClearTerminal = () => {
    window.dispatchEvent(new CustomEvent('varta:terminal:clear', {
      detail: { id: activeTerminalId },
    }))
  }

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        width:          '100%',
        height:         '100%',
        overflow:       'hidden',
        backgroundColor:'#1a1a1a',
      }}
    >
      {/* Tab bar — fixed height */}
      <TerminalTabs
        onNewTerminal={() => createTerminal(rootPath ?? undefined)}
        onDestroyTerminal={(id) => destroyTerminal(id)}
        onClearTerminal={handleClearTerminal}
      />

      {/* Terminal area — fills remaining height */}
      <div
        style={{
          flex:     '1 1 0',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {instanceList.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#6e6e6e', fontSize: 13,
          }}>
            No terminal — click + to create one
          </div>
        ) : (
          instanceList.map((inst) => (
            /*
             * RC3 FIX: Use visibility + pointerEvents instead of display:none.
             * display:none gives xterm 0×0 dimensions on mount.
             * visibility:hidden still allows layout so xterm gets real dimensions.
             */
            <div
              key={inst.id}
              style={{
                position:      'absolute',
                inset:         0,
                visibility:    inst.id === activeTerminalId ? 'visible' : 'hidden',
                pointerEvents: inst.id === activeTerminalId ? 'auto'    : 'none',
              }}
            >
              <TerminalInstance
                terminalId={inst.id}
                isActive={inst.id === activeTerminalId}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
