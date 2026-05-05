import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'

type Channel = 'Varta' | 'Git' | 'Search' | 'AI'

interface LogEntry {
  timestamp: number
  level:     'info' | 'warn' | 'error' | 'success'
  message:   string
  channel:   Channel
}

// Module-level log store so other parts of the app can push logs
const logEntries: LogEntry[] = []
const listeners = new Set<() => void>()

export function outputLog(channel: Channel, level: LogEntry['level'], message: string) {
  logEntries.push({ timestamp: Date.now(), level, message, channel })
  if (logEntries.length > 500) { logEntries.shift() }
  listeners.forEach((fn) => fn())
}

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  info:    '#d4d4d4',
  warn:    '#ff8c00',
  error:   '#f44747',
  success: '#4ec9b0',
}

export function OutputPanel() {
  const [channel,    setChannel]    = useState<Channel>('Varta')
  const [showTimes,  setShowTimes]  = useState(false)
  const [entries,    setEntries]    = useState<LogEntry[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setEntries([...logEntries])
    listeners.add(update)
    update()
    return () => { listeners.delete(update) }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const filtered = entries.filter((e) => e.channel === channel)

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-[#333333] shrink-0">
        {/* Channel selector */}
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as Channel)}
          className="h-6 px-1 text-xs bg-[#3c3c3c] text-[#d4d4d4] border border-[#3c3c3c] rounded outline-none"
        >
          {(['Varta', 'Git', 'Search', 'AI'] as Channel[]).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex-1" />

        {/* Timestamps toggle */}
        <button
          onClick={() => setShowTimes((v) => !v)}
          className={cn('text-[10px] px-1.5 h-5 rounded border transition-colors',
            showTimes ? 'border-[#569cd6] text-[#569cd6]' : 'border-[#333333] text-[#6e6e6e] hover:text-[#d4d4d4]'
          )}
        >
          Timestamps
        </button>

        {/* Clear */}
        <button
          onClick={() => { logEntries.length = 0; setEntries([]) }}
          className="text-[10px] text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors px-1"
          title="Clear output"
        >
          Clear
        </button>
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-y-auto font-mono text-xs px-3 py-2">
        {filtered.length === 0 ? (
          <span className="text-[#4e4e4e] italic">No output for {channel}</span>
        ) : (
          filtered.map((entry, i) => (
            <div key={i} className="flex gap-2 leading-5">
              {showTimes && (
                <span className="text-[#4e4e4e] shrink-0">{formatTime(entry.timestamp)}</span>
              )}
              <span style={{ color: LEVEL_COLORS[entry.level] }}>{entry.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
