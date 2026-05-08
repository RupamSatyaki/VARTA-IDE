import React, { useEffect, useState } from 'react'
import { GitToolbar }       from './GitToolbar'
import { GitCommitBox }     from './GitCommitBox'
import { GitStagedChanges } from './GitStagedChanges'
import { GitChanges }       from './GitChanges'
import { GitCommitGraph }   from './GitCommitGraph'
import { useGitStore }      from '../../store/gitStore'
import { useAIStore }       from '../../store/aiStore'
import { useGit }           from '../../hooks/useGit'
import { FontAwesomeIcon }  from '@fortawesome/react-fontawesome'
import { faCodeBranch, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'

type Tab = 'changes' | 'history'

export function GitPanel() {
  const { status, isLoading, lastError, commits } = useGitStore()
  const { hasApiKey } = useAIStore()
  const [tab, setTab] = useState<Tab>('changes')

  const {
    refresh, stageFile, unstageFile, stageAll, unstageAll,
    discardFile, discardAll, commit, push, pull, fetch,
    checkout, createBranch, deleteBranch,
    generateCommitMessage, openDiff, openFile,
  } = useGit()

  useEffect(() => { refresh() }, [])

  // Not a git repo
  if (!isLoading && status && !status.isRepo) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-5 text-center bg-[#28242e]">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center
          bg-[#1e1a24] border border-[#3a2f45]">
          <FontAwesomeIcon icon={faCodeBranch} style={{ fontSize: 24 }} className="text-[#4a3a5a]" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-[#cccccc]">Not a git repository</p>
          <p className="text-[11px] text-[#5a4a6a] mt-1">Open a folder with a git repo</p>
        </div>
      </div>
    )
  }

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center h-full bg-[#28242e]">
        <div className="w-5 h-5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const staged    = status?.staged    ?? []
  const unstaged  = status?.unstaged  ?? []
  const untracked = status?.untracked ?? []
  const hasChanges = staged.length > 0 || unstaged.length > 0 || untracked.length > 0

  const commitAndPush = async (message: string) => {
    await commit(message)
    await push()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#28242e]">

      {/* Toolbar */}
      <GitToolbar
        onRefresh={refresh}
        onPull={pull}
        onPush={push}
        onFetch={fetch}
        onCheckout={checkout}
        onCreate={createBranch}
        onDelete={deleteBranch}
      />

      {/* Tab bar */}
      <div className="flex items-center border-b border-[#2a1f30] shrink-0 px-2 gap-1">
        <TabBtn active={tab === 'changes'} onClick={() => setTab('changes')} icon={faCodeBranch} label="Changes"
          badge={staged.length + unstaged.length + untracked.length || undefined} />
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')} icon={faClockRotateLeft} label="History" />
      </div>

      {/* Content */}
      {tab === 'changes' ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <GitCommitBox
            stagedCount={staged.length}
            onCommit={commit}
            onCommitPush={commitAndPush}
            onGenerateAI={generateCommitMessage}
            hasApiKey={hasApiKey}
          />

          {!hasChanges && !isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1e1a24] border border-[#3a2f45]">
                <FontAwesomeIcon icon={faCodeBranch} style={{ fontSize: 14 }} className="text-[#4a3a5a]" />
              </div>
              <p className="text-[11px] text-[#5a4a6a]">No changes</p>
            </div>
          )}

          <GitStagedChanges
            changes={staged}
            onUnstage={unstageFile}
            onUnstageAll={unstageAll}
            onOpenFile={openFile}
            onOpenDiff={(p) => openDiff(p, true)}
          />

          <GitChanges
            changes={unstaged}
            untracked={untracked}
            onStage={stageFile}
            onStageAll={stageAll}
            onDiscard={discardFile}
            onDiscardAll={discardAll}
            onOpenFile={openFile}
            onOpenDiff={(p) => openDiff(p, false)}
          />

          {lastError && (
            <div className="px-3 py-2 text-[11px] text-[#f44747] border-t border-[#2a1f30]">
              {lastError}
            </div>
          )}
        </div>
      ) : (
        <GitCommitGraph commits={commits} branch={status?.branch ?? ''} />
      )}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label, badge }: {
  active: boolean; onClick: () => void; icon: any; label: string; badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-all duration-150
        ${active ? 'text-[#c084fc]' : 'text-[#5a4a6a] hover:text-[#cccccc]'}`}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: 11 }} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#7c3aed]/30 text-[#c084fc] border border-[#7c3aed]/30">
          {badge}
        </span>
      )}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c084fc] rounded-t" />}
    </button>
  )
}
