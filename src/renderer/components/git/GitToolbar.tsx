import React from 'react'
import { GitBranchPicker } from './GitBranchPicker'
import { useGitStore }     from '../../store/gitStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faArrowDown, faArrowUp, faCloudArrowDown } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'

export interface GitToolbarProps {
  onRefresh:  () => void
  onPull:     () => void
  onPush:     () => void
  onFetch:    () => void
  onCheckout: (branch: string) => void
  onCreate:   (name: string) => void
  onDelete:   (name: string) => void
}

export function GitToolbar({ onRefresh, onPull, onPush, onFetch, onCheckout, onCreate, onDelete }: GitToolbarProps) {
  const { status, isLoading } = useGitStore()

  return (
    <div className="flex items-center justify-between px-2 h-9 border-b border-[#2a1f30] shrink-0">
      {/* Branch picker */}
      <GitBranchPicker
        currentBranch={status?.branch ?? null}
        onCheckout={onCheckout}
        onCreate={onCreate}
        onDelete={onDelete}
      />

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-2" />
        ) : (
          <>
            <TBtn tooltip="Refresh"  onClick={onRefresh} icon={faArrowsRotate}   />
            <TBtn tooltip="Pull"     onClick={onPull}    icon={faArrowDown}       />
            <TBtn tooltip="Push"     onClick={onPush}    icon={faArrowUp}         />
            <TBtn tooltip="Fetch"    onClick={onFetch}   icon={faCloudArrowDown}  />
          </>
        )}

        {/* Ahead/behind */}
        {status && (status.ahead > 0 || status.behind > 0) && (
          <span className="text-[10px] ml-1 flex items-center gap-1">
            {status.ahead  > 0 && <span className="text-[#34d399]">↑{status.ahead}</span>}
            {status.behind > 0 && <span className="text-[#f87171]">↓{status.behind}</span>}
          </span>
        )}
      </div>
    </div>
  )
}

function TBtn({ tooltip, onClick, icon }: { tooltip: string; onClick: () => void; icon: any }) {
  return (
    <Tooltip content={tooltip} placement="bottom">
      <button
        onClick={onClick}
        aria-label={tooltip}
        className="w-6 h-6 flex items-center justify-center rounded
          text-[#5a4a6a] hover:text-[#cccccc] hover:bg-white/5 transition-all duration-150"
      >
        <FontAwesomeIcon icon={icon} style={{ fontSize: 11 }} />
      </button>
    </Tooltip>
  )
}
