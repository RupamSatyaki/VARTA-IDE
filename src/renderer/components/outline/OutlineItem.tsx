import React from 'react'
import { cn } from '../../utils/cn'

export interface OutlineSymbol {
  name:     string
  kind:     string
  line:     number
  col:      number
  children?: OutlineSymbol[]
  depth:    number
}

export interface OutlineItemProps {
  symbol:     OutlineSymbol
  isActive:   boolean
  onClick:    (line: number) => void
}

const KIND_COLORS: Record<string, string> = {
  function:  '#dcdcaa',
  method:    '#dcdcaa',
  class:     '#4ec9b0',
  interface: '#569cd6',
  variable:  '#9cdcfe',
  constant:  '#4fc1ff',
  property:  '#9cdcfe',
  enum:      '#ce9178',
  module:    '#d4d4d4',
  namespace: '#d4d4d4',
  field:     '#9cdcfe',
  constructor: '#dcdcaa',
}

const KIND_LABELS: Record<string, string> = {
  function:    'ƒ',
  method:      'M',
  class:       '◆',
  interface:   '□',
  variable:    'V',
  constant:    'C',
  property:    'P',
  enum:        'E',
  module:      '⬡',
  namespace:   'N',
  field:       'F',
  constructor: '⊕',
}

export function OutlineItem({ symbol, isActive, onClick }: OutlineItemProps) {
  const color = KIND_COLORS[symbol.kind.toLowerCase()] ?? '#d4d4d4'
  const label = KIND_LABELS[symbol.kind.toLowerCase()] ?? '·'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(symbol.line)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(symbol.line)}
      className={cn(
        'flex items-center gap-1.5 h-[22px] pr-2 cursor-pointer select-none',
        'hover:bg-varta-hover focus:outline-none focus:bg-varta-hover text-xs',
        isActive && 'bg-varta-active',
      )}
      style={{ paddingLeft: symbol.depth * 12 + 8 }}
    >
      {/* Kind badge */}
      <span className="w-4 text-center font-mono text-[10px] shrink-0" style={{ color }}>
        {label}
      </span>

      {/* Name */}
      <span className="flex-1 min-w-0 truncate text-varta-text">{symbol.name}</span>

      {/* Line number */}
      <span className="text-[10px] text-varta-text-faint shrink-0">{symbol.line}</span>
    </div>
  )
}
