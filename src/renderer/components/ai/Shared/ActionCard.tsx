import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines, faArrowUpRightFromSquare, faCheckCircle, faPenNib, faPlus } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../utils/cn'
import { useTabStore } from '../../../store/tabStore'
import { useNotificationStore } from '../../../store/notificationStore'
import { motion } from 'framer-motion'

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
    window.dispatchEvent(new CustomEvent('varta:open-file', { detail: { path } }))
    notify(`Opening ${fileName}`, 1000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={cn(
        "group relative flex items-center gap-4 p-4 my-4 rounded-2xl cursor-pointer transition-all duration-500",
        "bg-[#1a1620]/40 border border-[#7c3aed]/10 hover:border-[#7c3aed]/40 hover:bg-[#1a1620]/80 shadow-2xl backdrop-blur-md"
      )}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

      {/* Icon Area */}
      <div className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-inner",
        type === 'create_file' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
      )}>
        <FontAwesomeIcon icon={type === 'create_file' ? faPlus : faPenNib} style={{ fontSize: 16 }} />
      </div>

      {/* Info Area */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-[#f3e8ff] truncate group-hover:text-[#c084fc] transition-colors duration-300">
            {fileName}
          </span>
          <FontAwesomeIcon icon={faCheckCircle} className="text-[#a855f7] text-[10px] opacity-60" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md",
            type === 'create_file' ? "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400/80 border border-blue-500/20"
          )}>
            {type === 'create_file' ? 'CREATED' : 'MODIFIED'}
          </span>
          <span className="text-[10px] text-[#4a3a5a] font-medium truncate opacity-60">
            {directory}
          </span>
        </div>
      </div>

      {/* Action Hint */}
      <div className="text-[#4a3a5a] group-hover:text-[#c084fc] transition-all duration-300 pr-1 group-hover:translate-x-1">
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: 13 }} />
      </div>

      {/* Border Highlight Overlay */}
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#7c3aed]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}
