import React from 'react'
import { DebugToolbar }    from './DebugToolbar'
import { DebugVariables }  from './DebugVariables'
import { DebugCallStack }  from './DebugCallStack'
import { DebugBreakpoints } from './DebugBreakpoints'
import { Button }          from '../ui/Button'
import { useNotificationStore } from '../../store/notificationStore'

export function DebugPanel() {
  const { info } = useNotificationStore()

  return (
    <div className="flex flex-col h-full overflow-hidden bg-varta-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-varta-border shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-varta-text-muted">
          Run & Debug
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => info('Debugger coming in v2 — stay tuned!', 3000)}
          className="text-xs"
        >
          ▶ Start Debugging
        </Button>
      </div>

      {/* Toolbar */}
      <DebugToolbar />

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        <DebugVariables />
        <DebugCallStack />
        <DebugBreakpoints />

        {/* Coming soon notice */}
        <div className="px-4 py-6 text-center">
          <div className="text-3xl mb-3 opacity-20">🐛</div>
          <p className="text-xs text-varta-text-muted">Full debugger support coming in v2</p>
          <p className="text-[10px] text-varta-text-faint mt-1">DAP (Debug Adapter Protocol) integration</p>
        </div>
      </div>
    </div>
  )
}
