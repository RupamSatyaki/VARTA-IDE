import React from 'react'
import { cn } from '../../utils/cn'
import { useGitStore }     from '../../store/gitStore'
import { useEditorStore }  from '../../store/editorStore'
import { useUIStore }      from '../../store/uiStore'

export function StatusBar() {
  const { status: gitStatus }  = useGitStore()
  const { getActiveTab }       = useEditorStore()
  const { setActiveBottomPanel, setPanelVisible } = useUIStore()
  const activeTab = getActiveTab()

  return (
    <div className="flex items-center justify-between h-[22px] shrink-0 bg-[#007acc] text-white text-xs px-2 select-none">
      {/* Left */}
      <div className="flex items-center gap-3">
        {gitStatus?.branch && (
          <StatusBarItem
            onClick={() => {}}
            title={`Branch: ${gitStatus.branch}`}
          >
            <span className="mr-1">⎇</span>
            {gitStatus.branch}
            {gitStatus.ahead > 0  && <span className="ml-1">↑{gitStatus.ahead}</span>}
            {gitStatus.behind > 0 && <span className="ml-1">↓{gitStatus.behind}</span>}
          </StatusBarItem>
        )}
        <StatusBarItem
          onClick={() => { setActiveBottomPanel('problems'); setPanelVisible(true) }}
          title="Errors and Warnings"
        >
          <span>⊗ 0</span>
          <span className="ml-2">⚠ 0</span>
        </StatusBarItem>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <StatusBarItem onClick={() => {}} title="Select Language Mode">
              {activeTab.language}
            </StatusBarItem>
            <StatusBarItem onClick={() => {}} title="Select Indentation">
              Spaces: 2
            </StatusBarItem>
            <StatusBarItem onClick={() => {}} title="Select Encoding">
              UTF-8
            </StatusBarItem>
            <StatusBarItem onClick={() => {}} title="Go to Line">
              Ln {activeTab.cursorLine ?? 1}, Col {activeTab.cursorCol ?? 1}
            </StatusBarItem>
          </>
        )}
      </div>
    </div>
  )
}

function StatusBarItem({ children, onClick, title }: {
  children: React.ReactNode; onClick: () => void; title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1 px-1 h-full hover:bg-white/20 transition-colors rounded-sm"
    >
      {children}
    </button>
  )
}
