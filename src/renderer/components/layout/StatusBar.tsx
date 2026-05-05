import React from 'react'
import { useGitStore }          from '../../store/gitStore'
import { useUIStore }           from '../../store/uiStore'
import { StatusBarLanguage }    from '../statusbar/StatusBarLanguage'
import { StatusBarLineCol }     from '../statusbar/StatusBarLineCol'
import { StatusBarEncoding }    from '../statusbar/StatusBarEncoding'
import { StatusBarIndent }      from '../statusbar/StatusBarIndent'
import { StatusBarErrors }      from '../statusbar/StatusBarErrors'
import { StatusBarSync }        from '../statusbar/StatusBarSync'
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome'
import { faCodeBranch, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'

export function StatusBar() {
  const { status: gitStatus }  = useGitStore()
  const { setActiveSidebarPanel } = useUIStore()

  return (
    <div className="flex items-center justify-between h-[24px] shrink-0 bg-[#181825] border-t border-[#2a2a3d] text-[#9090b0] text-[11px] px-1 select-none">

      {/* ── Left ── */}
      <div className="flex items-center h-full">

        {/* Git branch */}
        {gitStatus?.branch && (
          <StatusBtn
            onClick={() => setActiveSidebarPanel('git')}
            title={`Branch: ${gitStatus.branch}`}
          >
            <FontAwesomeIcon icon={faCodeBranch} style={{ fontSize: 10 }} className="text-[#a855f7]" />
            <span className="text-[#cccccc]">{gitStatus.branch}</span>
            {gitStatus.ahead  > 0 && (
              <span className="flex items-center gap-0.5 text-[#73c991]">
                <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 9 }} />{gitStatus.ahead}
              </span>
            )}
            {gitStatus.behind > 0 && (
              <span className="flex items-center gap-0.5 text-[#f44747]">
                <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: 9 }} />{gitStatus.behind}
              </span>
            )}
          </StatusBtn>
        )}

        {/* Errors / warnings */}
        <StatusBarErrors />

        {/* Sync */}
        <StatusBarSync />
      </div>

      {/* ── Right ── */}
      <div className="flex items-center h-full">
        <StatusBarLineCol />
        <StatusBarIndent />
        <StatusBarEncoding />
        <StatusBarLanguage />
      </div>

    </div>
  )
}

function StatusBtn({ onClick, title, children }: {
  onClick?: () => void
  title?:   string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 px-2.5 h-full
        hover:bg-white/5 hover:text-white
        transition-colors duration-100 rounded-sm"
    >
      {children}
    </button>
  )
}
