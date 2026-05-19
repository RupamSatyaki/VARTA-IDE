import React from 'react'
import { cn }                   from '../../utils/cn'
import { useGitStore }          from '../../store/gitStore'
import { useUIStore }           from '../../store/uiStore'
import { useAIStore }           from '../../store/aiStore'
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
  const isStreaming = useAIStore((s) => s.isStreaming)

  return (
    <div className="flex items-center justify-between h-[24px] shrink-0 bg-varta-statusbar border-t border-varta-border text-varta-text-muted text-[11px] px-1 select-none">

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

        {/* AI Status */}
        <StatusBtn
          onClick={() => setActiveSidebarPanel('ai')}
          title={isStreaming ? 'AI is thinking...' : 'AI Assistant'}
        >
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-500",
            isStreaming ? "bg-[#a855f7] shadow-[0_0_8px_#a855f7] animate-pulse" : "bg-[#4a4a6a]"
          )} />
          <span className={cn("transition-colors", isStreaming ? "text-[#c084fc]" : "text-[#6e6e8a]")}>
            {isStreaming ? 'AI Thinking' : 'Varta AI'}
          </span>
        </StatusBtn>

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
