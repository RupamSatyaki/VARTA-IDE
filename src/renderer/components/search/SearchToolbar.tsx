import React from 'react'
import { useSearchStore } from '../../store/searchStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faAnglesDown, faAnglesUp, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'

export interface SearchToolbarProps {
  onRefresh:     () => void
  onClear:       () => void
  onExpandAll:   () => void
  onCollapseAll: () => void
}

export function SearchToolbar({ onRefresh, onClear, onExpandAll, onCollapseAll }: SearchToolbarProps) {
  const { results } = useSearchStore()
  if (!results) { return null }

  return (
    <div className="flex items-center justify-between px-3 py-1 border-b border-[#2a1f30] shrink-0">
      <span className="text-[10px] text-[#6e5a7a]">
        <span className="text-[#c084fc] font-medium">{results.totalMatches}</span>
        {' '}result{results.totalMatches !== 1 ? 's' : ''} in{' '}
        <span className="text-[#c084fc] font-medium">{results.totalFiles}</span>
        {' '}file{results.totalFiles !== 1 ? 's' : ''}
        {results.truncated && <span className="text-[#f44747]"> (truncated)</span>}
      </span>

      <div className="flex items-center gap-0.5">
        <TBtn tooltip="Refresh"       onClick={onRefresh}     icon={faArrowsRotate} />
        <TBtn tooltip="Expand All"    onClick={onExpandAll}   icon={faAnglesDown}   />
        <TBtn tooltip="Collapse All"  onClick={onCollapseAll} icon={faAnglesUp}     />
        <TBtn tooltip="Clear Results" onClick={onClear}       icon={faXmark}        />
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
