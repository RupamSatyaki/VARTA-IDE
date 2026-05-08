import React, { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'
import { isIPCSuccess } from '../../../shared/ipc'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCodeBranch, faChevronDown, faCheck, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
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
      if (isIPCSuccess(res)) { setBranches(res.data.filter(b => !b.isRemote)) }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [open])

  const handleCreate = () => {
    if (!newName.trim()) { return }
    onCreate(newName.trim()); setNewName(''); setCreating(false); setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 h-6 rounded-md text-[11px] transition-all
          text-[#cccccc] hover:bg-white/5 max-w-[150px]"
        title={`Branch: ${currentBranch ?? 'unknown'}`}
      >
        <FontAwesomeIcon icon={faCodeBranch} style={{ fontSize: 10 }} className="text-[#c084fc] shrink-0" />
        <span className="truncate">{currentBranch ?? 'HEAD'}</span>
        <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 8 }} className="shrink-0 text-[#5a4a6a]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[8999]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-60 z-[9000] rounded-xl border border-[#3a2f45] bg-[#1e1a24] shadow-2xl overflow-hidden">

            <div className="px-3 py-2 border-b border-[#2a1f30]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5a4a6a]">Switch Branch</p>
            </div>

            {loading ? (
              <div className="px-3 py-3 flex items-center gap-2 text-[11px] text-[#5a4a6a]">
                <div className="w-3 h-3 border border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto">
                {branches.map((b) => (
                  <div
                    key={b.name}
                    className={cn(
                      'flex items-center justify-between px-3 py-1.5 cursor-pointer group',
                      'hover:bg-white/5 text-[11px]',
                      b.isCurrent ? 'text-[#c084fc]' : 'text-[#cccccc]',
                    )}
                    onClick={() => { if (!b.isCurrent) { onCheckout(b.name); setOpen(false) } }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {b.isCurrent
                        ? <FontAwesomeIcon icon={faCheck} style={{ fontSize: 9 }} className="text-[#c084fc] shrink-0" />
                        : <FontAwesomeIcon icon={faCodeBranch} style={{ fontSize: 9 }} className="text-[#4a3a5a] shrink-0" />
                      }
                      <span className="truncate">{b.name}</span>
                    </div>
                    {!b.isCurrent && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(b.name) }}
                        className="opacity-0 group-hover:opacity-100 text-[#4a3a5a] hover:text-[#f87171] transition-all"
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 9 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[#2a1f30] p-2">
              {creating ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  { handleCreate() }
                      if (e.key === 'Escape') { setCreating(false); setNewName('') }
                    }}
                    placeholder="branch-name"
                    className="flex-1 h-6 px-2 text-[11px] rounded-md bg-[#28242e] border border-[#7c3aed]/50
                      text-[#cccccc] placeholder:text-[#4a3a5a] outline-none"
                  />
                  <button
                    onClick={handleCreate}
                    className="px-2 h-6 text-[10px] rounded-md bg-[#7c3aed]/30 border border-[#7c3aed]/50
                      text-[#c084fc] hover:bg-[#7c3aed]/50 transition-all"
                  >
                    Create
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-1.5 text-left text-[11px] text-[#5a4a6a]
                    hover:text-[#cccccc] py-0.5 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} style={{ fontSize: 9 }} />
                  New branch…
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
