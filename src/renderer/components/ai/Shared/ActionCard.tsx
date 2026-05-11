import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle, faBug, faEye, faMagnifyingGlass,
  faTerminal, faFileCirclePlus, faPenNib, faTrash,
  faCodeBranch, faRotateLeft, faCodeCompare, faChevronDown, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../utils/cn'
import { FileIcon } from '../../filetree/FileIcon'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionCardType =
  | 'accepted_edit'
  | 'create_file'
  | 'modify_file'
  | 'delete_file'
  | 'read_file'
  | 'check_diagnostics'
  | 'search_workspace'
  | 'run_command'
  | 'git_operation'

export interface ActionCardProps {
  type:       ActionCardType
  // file-related
  path?:      string
  paths?:     string[]
  // search
  query?:     string
  // command
  command?:   string
  output?:    string
  cwd?:       string
  // git
  operation?: string
  // callbacks
  onUndo?:    () => void
  onDiff?:    () => void
  onOpen?:    () => void
}

// ── Config per type ───────────────────────────────────────────────────────────

const CONFIG: Record<ActionCardType, {
  icon:       any
  iconColor:  string
  iconBg:     string
  label:      string
}> = {
  accepted_edit:    { icon: faCheckCircle,    iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)',  label: 'Accepted edits to'     },
  create_file:      { icon: faFileCirclePlus, iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)',  label: 'Created file'          },
  modify_file:      { icon: faPenNib,         iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)',  label: 'Modified'              },
  delete_file:      { icon: faTrash,          iconColor: '#f87171', iconBg: 'rgba(248,113,113,0.12)', label: 'Deleted'               },
  read_file:        { icon: faEye,            iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)', label: 'Read file(s)'          },
  check_diagnostics:{ icon: faBug,            iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.12)',  label: 'Checked diagnostics'   },
  search_workspace: { icon: faMagnifyingGlass,iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)', label: 'Searched workspace'    },
  run_command:      { icon: faTerminal,       iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)',  label: 'Command'               },
  git_operation:    { icon: faCodeBranch,     iconColor: '#c084fc', iconBg: 'rgba(192,132,252,0.12)', label: 'Git'                   },
}

// ── File badge ────────────────────────────────────────────────────────────────

function FileBadge({ path }: { path: string }) {
  const name = path.split(/[/\\]/).pop() ?? path
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
      bg-[#2a2035] border border-[#3a2f45] text-[11px] font-mono text-[#c4b5d4]
      max-w-[180px] truncate">
      <FileIcon filename={name} size={11} className="shrink-0" />
      {name}
    </span>
  )
}

// ── Main ActionCard ───────────────────────────────────────────────────────────

export function ActionCard({
  type, path, paths, query, command, output, cwd,
  operation, onUndo, onDiff, onOpen,
}: ActionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cfg = CONFIG[type]

  const allPaths = paths ?? (path ? [path] : [])
  const hasExpand = (type === 'run_command' && !!output) ||
                    (type === 'search_workspace' && !!query)

  return (
    <div className={cn(
      'rounded-xl border border-[#2a2035] bg-[#1a1520]/60 backdrop-blur-sm',
      'transition-all duration-200 overflow-hidden my-1.5',
      hasExpand && 'cursor-pointer hover:border-[#3a2f45]',
    )}
      onClick={hasExpand ? () => setExpanded(v => !v) : undefined}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Icon */}
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: cfg.iconBg }}
        >
          <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: 13, color: cfg.iconColor }} />
        </span>

        {/* Label */}
        <span className="text-[13px] font-medium text-[#d4c8e8] shrink-0">
          {type === 'run_command' && cwd ? 'Command' : cfg.label}
          {type === 'git_operation' && operation ? ` ${operation}` : ''}
        </span>

        {/* File badges / cwd */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
          {type === 'run_command' && cwd && (
            <span className="text-[11px] font-mono text-[#6e5a7a] truncate max-w-[200px]">
              {cwd}
            </span>
          )}
          {allPaths.slice(0, 3).map((p, i) => (
            <FileBadge key={i} path={p} />
          ))}
          {allPaths.length > 3 && (
            <span className="text-[10px] text-[#6e5a7a]">+{allPaths.length - 3} more</span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {type === 'accepted_edit' && (
            <>
              <ActionBtn
                icon={faCodeCompare}
                tooltip="View diff"
                onClick={(e) => { e.stopPropagation(); onDiff?.() }}
              />
              <ActionBtn
                icon={faRotateLeft}
                tooltip="Undo"
                onClick={(e) => { e.stopPropagation(); onUndo?.() }}
              />
            </>
          )}
          {(type === 'read_file' || type === 'create_file' || type === 'modify_file') && onOpen && (
            <ActionBtn icon={faEye} tooltip="Open file" onClick={(e) => { e.stopPropagation(); onOpen() }} />
          )}
          {hasExpand && (
            <FontAwesomeIcon
              icon={expanded ? faChevronDown : faChevronRight}
              style={{ fontSize: 9, color: '#6e5a7a' }}
            />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#2a2035] bg-[#12101a]/80">
          {type === 'run_command' && command && (
            <div className="px-3 py-2">
              <pre className="text-[11px] font-mono text-[#a6e3a1] whitespace-pre-wrap break-all">
                {command}
              </pre>
              {output && (
                <pre className="text-[11px] font-mono text-[#9090b0] mt-1.5 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                  {output}
                </pre>
              )}
            </div>
          )}
          {type === 'search_workspace' && query && (
            <div className="px-3 py-2">
              <p className="text-[11px] font-mono text-[#9090b0] italic">{query}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionBtn({ icon, tooltip, onClick }: {
  icon: any; tooltip: string; onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="w-6 h-6 flex items-center justify-center rounded-md
        text-[#5a4a6a] hover:text-[#c084fc] hover:bg-[#7c3aed]/15
        transition-all duration-150"
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: 11 }} />
    </button>
  )
}
