import React from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from '../ui/IconButton'
import { Spinner } from '../ui/Spinner'
import { GitBranchPicker } from './GitBranchPicker'
import { useGitStore } from '../../store/gitStore'

export interface GitToolbarProps {
  onRefresh:  () => void
  onPull:     () => void
  onPush:     () => void
  onFetch:    () => void
  onCheckout: (branch: string) => void
  onCreate:   (name: string) => void
  onDelete:   (name: string) => void
}

export function GitToolbar({
  onRefresh, onPull, onPush, onFetch,
  onCheckout, onCreate, onDelete,
}: GitToolbarProps) {
  const { status, isLoading } = useGitStore()

  return (
    <div className="flex items-center justify-between px-2 h-9 border-b border-[#333333] shrink-0">
      {/* Branch picker */}
      <GitBranchPicker
        currentBranch={status?.branch ?? null}
        onCheckout={onCheckout}
        onCreate={onCreate}
        onDelete={onDelete}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        {isLoading ? (
          <Spinner size="sm" className="mx-1" />
        ) : (
          <>
            <IconButton tooltip="Refresh" size="sm" onClick={onRefresh} aria-label="Refresh">
              <RefreshIcon />
            </IconButton>
            <IconButton tooltip="Pull" size="sm" onClick={onPull} aria-label="Pull">
              <PullIcon />
            </IconButton>
            <IconButton tooltip="Push" size="sm" onClick={onPush} aria-label="Push">
              <PushIcon />
            </IconButton>
            <IconButton tooltip="Fetch" size="sm" onClick={onFetch} aria-label="Fetch">
              <FetchIcon />
            </IconButton>
          </>
        )}

        {/* Ahead/behind indicators */}
        {status && (status.ahead > 0 || status.behind > 0) && (
          <span className="text-[10px] text-[#6e6e6e] ml-1 flex items-center gap-0.5">
            {status.ahead  > 0 && <span className="text-[#73c991]">↑{status.ahead}</span>}
            {status.behind > 0 && <span className="text-[#f44747]">↓{status.behind}</span>}
          </span>
        )}
      </div>
    </div>
  )
}

const RefreshIcon = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c.045.218.068.438.068.66 0 2.606-2.116 4.722-4.722 4.722S1.31 12.192 1.31 9.586 3.426 4.864 6.032 4.864c.314 0 .62.031.917.09"/></svg>
const PullIcon    = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12l-4-4h2.5V2h3v6H12L8 12zm-6 2h12v1H2v-1z"/></svg>
const PushIcon    = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l4 4h-2.5v6h-3V6H4L8 2zm-6 11h12v1H2v-1z"/></svg>
const FetchIcon   = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v4.5l3.5 2-.5.866L7 10V6h1z"/></svg>
