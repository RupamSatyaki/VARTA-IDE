import React from 'react'
import { useGitStore }          from '../../store/gitStore'
import { useUIStore }           from '../../store/uiStore'
import { StatusBarLanguage }    from '../statusbar/StatusBarLanguage'
import { StatusBarLineCol }     from '../statusbar/StatusBarLineCol'
import { StatusBarEncoding }    from '../statusbar/StatusBarEncoding'
import { StatusBarIndent }      from '../statusbar/StatusBarIndent'
import { StatusBarErrors }      from '../statusbar/StatusBarErrors'
import { StatusBarSync }        from '../statusbar/StatusBarSync'

export function StatusBar() {
  const { status: gitStatus }  = useGitStore()
  const { setActiveSidebarPanel, setActiveBottomPanel, setPanelVisible } = useUIStore()

  return (
    <div className="flex items-center justify-between h-[22px] shrink-0 bg-[#007acc] text-white text-xs px-1 select-none">
      {/* Left */}
      <div className="flex items-center">
        {/* Git branch */}
        {gitStatus?.branch && (
          <button
            onClick={() => setActiveSidebarPanel('git')}
            title={`Branch: ${gitStatus.branch}`}
            className="flex items-center gap-1 px-2 h-full hover:bg-white/20 transition-colors"
          >
            <span>⎇</span>
            <span>{gitStatus.branch}</span>
            {gitStatus.ahead  > 0 && <span>↑{gitStatus.ahead}</span>}
            {gitStatus.behind > 0 && <span>↓{gitStatus.behind}</span>}
          </button>
        )}

        {/* Errors/warnings */}
        <StatusBarErrors />

        {/* Sync indicator */}
        <StatusBarSync />
      </div>

      {/* Right */}
      <div className="flex items-center">
        <StatusBarLineCol />
        <StatusBarIndent />
        <StatusBarEncoding />
        <StatusBarLanguage />
      </div>
    </div>
  )
}
