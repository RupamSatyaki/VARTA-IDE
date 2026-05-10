import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines, faArrowUpRightFromSquare, faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../utils/cn'
import { useTabStore } from '../../../store/tabStore'
import { useNotificationStore } from '../../../store/notificationStore'

interface ActionCardProps {
  path: string
  type: 'create_file' | 'modify_file'
}

export function ActionCard({ path, type }: ActionCardProps) {
  const { openTab } = useTabStore()
  const { success: notify } = useNotificationStore()
  
  const fileName = path.split(/[/\\]/).pop() || path
  const directory = path.split(/[/\\]/).slice(0, -1).join('/') || './'

  const handleClick = async () => {
    // We assume the path is relative to workspace root or absolute
    // The renderer can call window.varta.fs.readFile or similar, 
    // but the standard way in Varta is to use the tabStore
    try {
      // In Varta, openTab usually takes a path and fetches content
      // We trigger a global event or use the store directly
      window.dispatchEvent(new CustomEvent('varta:open-file', { detail: { path } }))
      notify(`Opening ${fileName}`, 1000)
    } catch (e) {
      console.error('Failed to open file from ActionCard', e)
    }
  }

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "group relative flex items-center gap-3 p-3 mt-3 mb-2 rounded-2xl cursor-pointer transition-all duration-300",
        "bg-[#1e1a24] border border-[#2a1f30] hover:border-[#7c3aed]/50 hover:bg-[#251f2e] shadow-lg hover:shadow-[#7c3aed]/10"
      )}
    >
      {/* Icon Area */}
      <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center text-[#c084fc] group-hover:scale-110 transition-transform duration-300">
        <FontAwesomeIcon icon={faFileLines} style={{ fontSize: 16 }} />
      </div>

      {/* Info Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[#e0e0e0] truncate group-hover:text-[#c084fc] transition-colors">
            {fileName}
          </span>
          <FontAwesomeIcon icon={faCheckCircle} className="text-[#a6e3a1] text-[10px]" />
        </div>
        <div className="text-[10px] text-[#4a3a5a] font-medium uppercase tracking-wider mt-0.5">
          {type === 'create_file' ? 'File Created' : 'File Modified'}
        </div>
      </div>

      {/* Hover Location Tooltip (Visual) */}
      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1a1620] border border-[#2a1f30] rounded-lg text-[9px] text-[#8e7a9a] whitespace-nowrap pointer-events-none transition-all duration-200 shadow-xl">
        Location: {path}
      </div>

      {/* Action Hint */}
      <div className="text-[#4a3a5a] group-hover:text-[#7c3aed] transition-colors pr-1">
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: 12 }} />
      </div>
    </div>
  )
}
