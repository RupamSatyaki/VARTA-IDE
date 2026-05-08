import React from 'react'
import { cn } from '../../utils/cn'
import { useSearchStore } from '../../store/searchStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons'

export interface ReplaceInputProps {
  onReplaceAll: () => void
  isReplacing:  boolean
}

export function ReplaceInput({ onReplaceAll, isReplacing }: ReplaceInputProps) {
  const { replaceText, setReplaceText, results } = useSearchStore()
  const count = results?.totalMatches ?? 0

  return (
    <div className="px-3 pb-2 border-b border-[#2a1f30]">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center rounded-lg border border-[#3a2f45] bg-[#1e1a24] focus-within:border-[#7c3aed] transition-all duration-150">
          <span className="pl-2.5 text-[#5a4a6a] shrink-0">
            <FontAwesomeIcon icon={faArrowRightArrowLeft} style={{ fontSize: 10 }} />
          </span>
          <input
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with…"
            spellCheck={false}
            className="flex-1 h-7 px-2 bg-transparent text-[12px] text-[#cccccc] placeholder:text-[#4a3a5a] outline-none"
          />
        </div>

        <button
          onClick={onReplaceAll}
          disabled={count === 0 || isReplacing}
          className={cn(
            'shrink-0 px-3 h-7 text-[11px] font-medium rounded-lg transition-all duration-150',
            count > 0 && !isReplacing
              ? 'bg-[#7c3aed]/30 border border-[#7c3aed]/40 text-[#c084fc] hover:bg-[#7c3aed]/50 hover:text-white'
              : 'bg-[#1e1a24] border border-[#3a2f45] text-[#4a3a5a] cursor-not-allowed',
          )}
        >
          {isReplacing ? 'Replacing…' : 'Replace All'}
        </button>
      </div>

      {count > 0 && (
        <p className="text-[10px] text-[#6e5a7a] mt-1.5 px-1">
          {count} replacement{count !== 1 ? 's' : ''} will be made
        </p>
      )}
    </div>
  )
}
