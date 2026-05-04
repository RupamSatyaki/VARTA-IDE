import React from 'react'
import { CommandItem } from './CommandItem'
import { CommandGroup } from './CommandGroup'
import type { Command } from '../../lib/commandRegistry'

export interface FileResult {
  path:     string
  filename: string
}

export interface CommandListProps {
  mode:         'files' | 'commands'
  commands:     Command[]
  files:        FileResult[]
  recentCmds:   Command[]
  selectedIdx:  number
  rootPath?:    string
  onSelect:     (idx: number) => void
  onExecute:    (idx: number) => void
}

export function CommandList({
  mode, commands, files, recentCmds,
  selectedIdx, rootPath, onSelect, onExecute,
}: CommandListProps) {

  // ── File mode ─────────────────────────────────────────────────────────────
  if (mode === 'files') {
    if (files.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-[#6e6e6e]">
          No files found
        </div>
      )
    }
    return (
      <div className="overflow-y-auto max-h-[400px]">
        {files.map((f, i) => (
          <CommandItem
            key={f.path}
            command={{ id: f.path, label: f.filename, category: 'File', execute: () => {} }}
            isSelected={i === selectedIdx}
            isFile={true}
            filePath={f.path}
            rootPath={rootPath}
            onClick={() => { onSelect(i); onExecute(i) }}
          />
        ))}
      </div>
    )
  }

  // ── Command mode ──────────────────────────────────────────────────────────
  if (commands.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#6e6e6e]">
        No commands found
      </div>
    )
  }

  // Group by category
  const grouped = new Map<string, { cmd: Command; globalIdx: number }[]>()
  let globalIdx = 0

  // Recently used first
  if (recentCmds.length > 0 && commands.length === recentCmds.length) {
    grouped.set('Recently Used', recentCmds.map((cmd) => ({ cmd, globalIdx: globalIdx++ })))
  }

  for (const cmd of commands) {
    if (recentCmds.some((r) => r.id === cmd.id) && commands.length === recentCmds.length) { continue }
    const list = grouped.get(cmd.category) ?? []
    list.push({ cmd, globalIdx: globalIdx++ })
    grouped.set(cmd.category, list)
  }

  return (
    <div className="overflow-y-auto max-h-[400px]">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <CommandGroup key={category} label={category}>
          {items.map(({ cmd, globalIdx: gi }) => (
            <CommandItem
              key={cmd.id}
              command={cmd}
              isSelected={gi === selectedIdx}
              onClick={() => { onSelect(gi); onExecute(gi) }}
            />
          ))}
        </CommandGroup>
      ))}
    </div>
  )
}
