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

  useEffect(() => {
    if (initializedRef.current) { return }
    initializedRef.current = true
    if (instances.size === 0) { createTerminal(rootPath ?? undefined) }
  }, [])

  const instanceList = Array.from(instances.values())

  const handleClearTerminal = () => {
    window.dispatchEvent(new CustomEvent('varta:terminal:clear', {
      detail: { id: activeTerminalId },
    }))
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#28242e]">
      <TerminalTabs
        onNewTerminal={() => createTerminal(rootPath ?? undefined)}
        onDestroyTerminal={(id) => destroyTerminal(id)}
        onClearTerminal={handleClearTerminal}
      />

      <div className="flex-1 relative overflow-hidden min-h-0">
        {instanceList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#4a4a6a] text-[12px] gap-2">
            <span>No terminal —</span>
            <button
              onClick={() => createTerminal(rootPath ?? undefined)}
              className="text-[#7c3aed] hover:text-[#a855f7] transition-colors underline underline-offset-2"
            >
              create one
            </button>
          </div>
        ) : (
          instanceList.map((inst) => (
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
