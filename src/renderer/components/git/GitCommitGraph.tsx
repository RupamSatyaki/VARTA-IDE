import React, { useEffect, useState } from 'react'
import { isIPCSuccess } from '../../../shared/ipc'
import { useGitStore }  from '../../store/gitStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faCodeBranch, faTag, faCircleDot } from '@fortawesome/free-solid-svg-icons'
import type { GitCommit } from '../../../shared/types/git.types'

interface GitCommitGraphProps {
  commits: GitCommit[]
  branch:  string
}

// Colors for graph lanes
const LANE_COLORS = ['#c084fc', '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8']

export function GitCommitGraph({ commits: initialCommits, branch }: GitCommitGraphProps) {
  const { setCommits } = useGitStore()
  const [commits, setLocal] = useState<GitCommit[]>(initialCommits)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await window.varta.git.log(100)
      if (isIPCSuccess(res)) {
        setLocal(res.data)
        setCommits(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [branch])

  if (loading && commits.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <FontAwesomeIcon icon={faCircleDot} style={{ fontSize: 24 }} className="text-[#3a2f45]" />
        <p className="text-[11px] text-[#5a4a6a]">No commits yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a1f30] shrink-0">
        <span className="text-[10px] text-[#5a4a6a]">
          <span className="text-[#c084fc] font-medium">{commits.length}</span> commits
        </span>
        <button
          onClick={load}
          className="w-6 h-6 flex items-center justify-center rounded text-[#5a4a6a] hover:text-[#cccccc] hover:bg-white/5 transition-all"
        >
          <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 11 }} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Commit list */}
      <div className="flex-1 overflow-y-auto">
        {commits.map((commit, idx) => (
          <CommitRow
            key={commit.hash}
            commit={commit}
            idx={idx}
            total={commits.length}
            isSelected={selected === commit.hash}
            onClick={() => setSelected(s => s === commit.hash ? null : commit.hash)}
            color={LANE_COLORS[0]}
          />
        ))}
      </div>
    </div>
  )
}

function CommitRow({ commit, idx, total, isSelected, onClick, color }: {
  commit:     GitCommit
  idx:        number
  total:      number
  isSelected: boolean
  onClick:    () => void
  color:      string
}) {
  const isFirst = idx === 0
  const isLast  = idx === total - 1
  const date    = new Date(commit.date)
  const dateStr = formatDate(date)

  const hasRefs = commit.refs && commit.refs.length > 0

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-0 cursor-pointer select-none transition-colors duration-100
        ${isSelected ? 'bg-[#7c3aed]/15' : 'hover:bg-white/5'}`}
    >
      {/* Graph column */}
      <div className="relative flex flex-col items-center shrink-0" style={{ width: 32, minHeight: 40 }}>
        {/* Vertical line top */}
        {!isFirst && (
          <div className="absolute top-0 w-0.5 rounded" style={{ height: 14, left: 15, backgroundColor: color, opacity: 0.4 }} />
        )}
        {/* Dot */}
        <div
          className="absolute rounded-full border-2 z-10"
          style={{
            width: 10, height: 10,
            top: 14, left: 11,
            borderColor: color,
            backgroundColor: isSelected ? color : '#28242e',
            boxShadow: isSelected ? `0 0 8px ${color}` : undefined,
          }}
        />
        {/* Vertical line bottom */}
        {!isLast && (
          <div className="absolute w-0.5 rounded" style={{ top: 24, bottom: 0, left: 15, backgroundColor: color, opacity: 0.4 }} />
        )}
      </div>

      {/* Commit info */}
      <div className="flex-1 min-w-0 py-2 pr-3">
        {/* Refs (branch/tag labels) */}
        {hasRefs && (
          <div className="flex flex-wrap gap-1 mb-1">
            {commit.refs!.map((ref) => (
              <RefBadge key={ref} ref_={ref} />
            ))}
          </div>
        )}

        {/* Message */}
        <p className={`text-[12px] truncate leading-tight ${isSelected ? 'text-white' : 'text-[#cccccc]'}`}>
          {commit.message}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#5a4a6a] font-mono">{commit.shortHash}</span>
          <span className="text-[10px] text-[#4a3a5a] truncate">{commit.author}</span>
          <span className="text-[10px] text-[#3a2f45] ml-auto shrink-0">{dateStr}</span>
        </div>

        {/* Expanded detail */}
        {isSelected && (
          <div className="mt-2 pt-2 border-t border-[#2a1f30]">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px]">
              <span className="text-[#5a4a6a]">Hash</span>
              <span className="text-[#c084fc] font-mono">{commit.hash}</span>
              <span className="text-[#5a4a6a]">Author</span>
              <span className="text-[#cccccc]">{commit.author} &lt;{commit.email}&gt;</span>
              <span className="text-[#5a4a6a]">Date</span>
              <span className="text-[#cccccc]">{date.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RefBadge({ ref_ }: { ref_: string }) {
  const isHead   = ref_.includes('HEAD')
  const isRemote = ref_.includes('origin/')
  const isTag    = ref_.startsWith('tag:')

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border
      ${isHead    ? 'bg-[#7c3aed]/30 border-[#7c3aed]/50 text-[#c084fc]' :
        isTag     ? 'bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#f59e0b]' :
        isRemote  ? 'bg-[#60a5fa]/15 border-[#60a5fa]/30 text-[#60a5fa]' :
                    'bg-[#34d399]/15 border-[#34d399]/30 text-[#34d399]'}`}
    >
      <FontAwesomeIcon icon={isTag ? faTag : faCodeBranch} style={{ fontSize: 8 }} />
      {ref_.replace('tag: ', '')}
    </span>
  )
}

function formatDate(date: Date): string {
  const now  = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hrs  < 24)  return `${hrs}h ago`
  if (days < 7)   return `${days}d ago`
  return date.toLocaleDateString()
}
