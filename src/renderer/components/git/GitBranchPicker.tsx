import React, { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'
import { isIPCSuccess } from '../../../shared/ipc'
import type { GitBranch } from '../../../shared/types/git.types'

export interface GitBranchPickerProps {
  currentBranch: string | null
  onCheckout:    (branch: string) => void
  onCreate:      (name: string) => void
  onDelete:      (name: string) => void
}

export function GitBranchPicker({ currentBranch, onCheckout, onCreate, onDelete }: GitBranchPickerProps) {
  const [open, setOpen]         = useState(false)
  const [branches, setBranches] = useState<GitBranch[]>([])
  const [newName, setNewName]   = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!open) { return }
    setLoading(true)
    window.varta.git.branches().then((res) => {
      if (isIPCSuccess(res)) {
        setBranches(res.data.filter((b) => !b.isRemote))
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [open])

  const handleCreate = () => {
    if (!newName.trim()) { return }
    onCreate(newName.trim())
    setNewName('')
    setCreating(false)
    setOpen(false)
  }

  const localBranches = branches.filter((b) => !b.isRemote)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 px-2 h-6 rounded text-xs transition-colors',
          'text-[#d4d4d4] hover:bg-[#2a2d2e] max-w-[140px]',
        )}
        title={`Branch: ${currentBranch ?? 'unknown'}`}
      >
        <BranchIcon />
        <span className="truncate">{currentBranch ?? 'HEAD'}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="shrink-0 text-[#6e6e6e]">
          <path d="M0 2l4 4 4-4z"/>
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[8999]" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 w-56 z-[9000] rounded border border-[#333333] bg-[#252526] shadow-xl">
            <div className="px-2 py-1.5 border-b border-[#333333]">
              <p className="text-[10px] text-[#6e6e6e] uppercase tracking-widest">Switch Branch</p>
            </div>

            {loading ? (
              <div className="px-3 py-2 text-xs text-[#6e6e6e]">Loading…</div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {localBranches.map((b) => (
                  <div
                    key={b.name}
                    className={cn(
                      'flex items-center justify-between px-3 py-1 cursor-pointer group',
                      'hover:bg-[#2a2d2e] text-xs',
                      b.isCurrent ? 'text-[#569cd6]' : 'text-[#d4d4d4]',
                    )}
                    onClick={() => { if (!b.isCurrent) { onCheckout(b.name); setOpen(false) } }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {b.isCurrent && <span className="text-[#569cd6]">✓</span>}
                      <span className="truncate">{b.name}</span>
                    </div>
                    {!b.isCurrent && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(b.name) }}
                        title="Delete branch"
                        className="opacity-0 group-hover:opacity-100 text-[#6e6e6e] hover:text-[#f44747] transition-colors"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <path d="M5 4.293L8.146 1.146l.708.708L5.707 5l3.147 3.146-.708.708L5 5.707 1.854 8.854l-.708-.708L4.293 5 1.146 1.854l.708-.708L5 4.293z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Create new branch */}
            <div className="border-t border-[#333333] p-2">
              {creating ? (
                <div className="flex gap-1">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { handleCreate() }
                      if (e.key === 'Escape') { setCreating(false); setNewName('') }
                    }}
                    placeholder="branch-name"
                    className="flex-1 h-6 px-1.5 text-xs bg-[#3c3c3c] text-[#d4d4d4] border border-[#569cd6] rounded outline-none"
                  />
                  <button
                    onClick={handleCreate}
                    className="px-2 h-6 text-xs bg-[#0e639c] text-white rounded hover:bg-[#1177bb]"
                  >
                    Create
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full text-left text-xs text-[#6e6e6e] hover:text-[#d4d4d4] py-0.5 transition-colors"
                >
                  + Create new branch…
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const BranchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
    <path d="M5 2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-.5 0a2 2 0 10-4 0 2 2 0 004 0zM5 13.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-.5 0a2 2 0 10-4 0 2 2 0 004 0zM2.5 5v6M11 2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-.5 0a2 2 0 10-4 0 2 2 0 004 0zM8.5 5c0 3.5-3 5-6 5"/>
  </svg>
)
