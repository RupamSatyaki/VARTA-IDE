import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faChevronRight, faCompass, faZap, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'

const QUICK_ACTIONS = [
  { label: 'Explain this file',      prompt: 'Explain what this file does and its main purpose.', icon: faCompass },
  { label: 'Find bugs in selection', prompt: 'Find any bugs or issues in the selected code.', icon: faShieldHalved },
  { label: 'Write tests',            prompt: 'Write unit tests for the selected function.', icon: faZap },
  { label: 'Refactor code',          prompt: 'Refactor the selected code to improve readability.', icon: faWandMagicSparkles },
]

export interface AIWelcomeProps {
  onQuickAction?: (prompt: string) => void
}

export function AIWelcome({ onQuickAction }: AIWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8 text-center select-none bg-gradient-to-b from-transparent to-[#0d0b12]/30">
      
      {/* Animated Hero Section */}
      <div className="relative">
        <motion.div 
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-8 rounded-full bg-gradient-to-tr from-[#7c3aed]/10 via-[#06b6d4]/10 to-[#a855f7]/10 blur-3xl" 
        />
        
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] rounded-3xl opacity-20 blur-xl group-hover:opacity-40 transition duration-1000" />
          <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center
            bg-[#1a1620] border border-[#7c3aed]/30
            shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 32 }} className="text-[#a855f7]" />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-[18px] font-black text-[#f3e8ff] tracking-tight">Varta Intelligence</h2>
        <p className="text-[12px] text-[#5a4a6a] mt-2 leading-relaxed font-medium max-w-[240px]">
          Next-generation AI companion for modern developers. Secure, contextual, and efficient.
        </p>
      </motion.div>

      {/* Quick Action Pills */}
      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={() => onQuickAction?.(a.prompt)}
            className="flex items-center gap-3 text-left text-[11px] px-4 py-3 rounded-2xl
              bg-[#1a1620]/50 border border-[#2a1f30] text-[#9090b0]
              hover:bg-[#7c3aed]/10 hover:border-[#7c3aed]/40 hover:text-[#f3e8ff]
              transition-all duration-300 group overflow-hidden relative shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <FontAwesomeIcon icon={a.icon} style={{ fontSize: 12 }} className="text-[#4a3a5a] group-hover:text-[#c084fc] transition-colors" />
            <span className="font-bold tracking-wide flex-1">{a.label}</span>
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }}
              className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#c084fc]" />
          </motion.button>
        ))}
      </div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-2 text-[9px] font-black text-[#4a3a5a] uppercase tracking-widest"
      >
        <div className="h-[1px] w-4 bg-[#2a1f30]" />
        Neural Link Active
        <div className="h-[1px] w-4 bg-[#2a1f30]" />
      </motion.div>
    </div>
  )
}
