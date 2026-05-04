import React from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { useSearchStore } from '../../store/searchStore'

export interface ReplaceInputProps {
  onReplaceAll: () => void
  isReplacing:  boolean
}

export function ReplaceInput({ onReplaceAll, isReplacing }: ReplaceInputProps) {
  const { replaceText, setReplaceText, results } = useSearchStore()

  const count = results?.totalMatches ?? 0

  return (
    <div className="px-3 pb-2 border-b border-[#333333]">
      <div className="flex items-center gap-1.5">
        <input
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replace"
          spellCheck={false}
          className={cn(
            'flex-1 h-7 px-2 text-xs bg-[#3c3c3c] text-[#d4d4d4]',
            'border border-[#3c3c3c] focus:border-[#569cd6] rounded outline-none',
            'placeholder:text-[#6e6e6e]',
          )}
        />
        <Button
          variant="default"
          size="sm"
          onClick={onReplaceAll}
          disabled={count === 0 || isReplacing}
          loading={isReplacing}
          className="shrink-0 text-xs"
        >
          Replace All
        </Button>
      </div>
      {count > 0 && (
        <p className="text-[10px] text-[#6e6e6e] mt-1">
          {count} replacement{count !== 1 ? 's' : ''} will be made
        </p>
      )}
    </div>
  )
}
