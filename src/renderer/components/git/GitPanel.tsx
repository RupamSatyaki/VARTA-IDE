import React, { useEffect } from 'react'
import { GitToolbar }       from './GitToolbar'
import { GitCommitBox }     from './GitCommitBox'
import { GitStagedChanges } from './GitStagedChanges'
import { GitChanges }       from './GitChanges'
import { Spinner }          from '../ui/Spinner'
import { Button }           from '../ui/Button'
import { useGitStore }      from '../../store/gitStore'
import { useAIStore }       from '../../store/aiStore'
import { useGit }           from '../../hooks/useGit'

export function GitPanel() {
  const { status, isLoading, lastError } = useGitStore()
  const { hasApiKey } = useAIStore()
  const {
    refresh, stageFile, unstageFile, stageAll, unstageAll,
    discardFile, discardAll, commit, push, pull, fetch,
    checkout, createBranch, deleteBranch,
    generateCommitMessage, openDiff, openFile,
  } = useGit()

  // Refresh on mount
  useEffect(() => {
    refresh()
  }, [])

  // Not a git repo
  if (!isLoading && status && !status.isRepo) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
        <svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor" className="text-[#3c3c3c]">
          <path d="M15.698 7.287L8.712.302a1.03 1.03 0 00-1.457 0L5.93 1.628 7.79 3.49a1.224 1.224 0 011.55 1.56l1.805 1.806a1.224 1.224 0 011.414 1.959 1.226 1.226 0 01-1.964-1.407L8.842 5.654v4.173a1.226 1.226 0 11-1.008-.02V5.61a1.226 1.226 0 01-.666-1.608L5.322 2.157 .302 7.178a1.03 1.03 0 000 1.457l6.986 6.986a1.03 1.03 0 001.457 0l6.953-6.877a1.03 1.03 0 000-1.457z"/>
        </svg>
        <p className="text-sm text-[#6e6e6e]">Not a git repository</p>
        <Button variant="primary" size="sm" onClick={() => {}}>
          Initialize Repository
        </Button>
      </div>
    )
  }

  // Loading initial state
  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="md" />
      </div>
    )
  }

  const staged    = status?.staged    ?? []
  const unstaged  = status?.unstaged  ?? []
  const untracked = status?.untracked ?? []

  const hasChanges = staged.length > 0 || unstaged.length > 0 || untracked.length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#252526]">
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

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Commit box */}
        <GitCommitBox
          stagedCount={staged.length}
          onCommit={commit}
          onGenerateAI={generateCommitMessage}
          hasApiKey={hasApiKey}
        />

        {/* No changes */}
        {!hasChanges && !isLoading && (
          <div className="flex items-center justify-center py-8 text-xs text-[#6e6e6e]">
            No changes
          </div>
        )}

        {/* Staged changes */}
        <GitStagedChanges
          changes={staged}
          onUnstage={unstageFile}
          onUnstageAll={unstageAll}
          onOpenFile={openFile}
          onOpenDiff={(p) => openDiff(p, true)}
        />

        {/* Unstaged changes */}
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

        {/* Error */}
        {lastError && (
          <div className="px-3 py-2 text-xs text-[#f44747] border-t border-[#333333]">
            {lastError}
          </div>
        )}
      </div>
    </div>
  )
}
