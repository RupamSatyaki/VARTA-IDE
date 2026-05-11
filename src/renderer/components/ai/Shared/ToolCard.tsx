import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faCheckCircle, faCircleXmark, faChevronDown, faChevronUp, faTerminal, faBoxOpen } from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../utils/cn'

interface ToolCardProps {
  name: string
  input: string
  status: 'running' | 'success' | 'error'
  result?: string
}

export function ToolCard({ name, input, status, result }: ToolCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  const parsedInput = React.useMemo(() => {
    try { return JSON.parse(input.replace(/&apos;/g, "'")) }
    catch { return input }
  }, [input])

  const parsedResult = React.useMemo(() => {
    if (!result) return null
    try { return JSON.parse(result.replace(/&apos;/g, "'")) }
    catch { return result }
  }, [result])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "my-5 rounded-2xl border transition-all duration-500 overflow-hidden shadow-2xl backdrop-blur-md",
        status === 'running' && "bg-[#1e1a24]/40 border-[#7c3aed]/30 ring-1 ring-[#7c3aed]/10",
        status === 'success' && "bg-[#161b22]/40 border-emerald-500/20",
        status === 'error' && "bg-[#1b1111]/40 border-red-500/20"
      )}
    >
      {/* Header */}
      <div 
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner",
          status === 'running' && "bg-[#7c3aed]/10 text-[#c084fc]",
          status === 'success' && "bg-emerald-500/10 text-emerald-400",
          status === 'error' && "bg-red-500/10 text-red-400"
        )}>
          {status === 'running' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <FontAwesomeIcon icon={faGear} style={{ fontSize: 15 }} />
            </motion.div>
          ) : (
            <FontAwesomeIcon 
              icon={status === 'success' ? faCheckCircle : faCircleXmark} 
              style={{ fontSize: 15 }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#f3e8ff] tracking-tight truncate">
              {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {status === 'running' && (
              <div className="flex gap-1 items-center ml-1">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-1 h-1 rounded-full bg-[#c084fc]" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-1 h-1 rounded-full bg-[#c084fc]" 
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-md",
              status === 'running' ? "bg-[#7c3aed]/10 text-[#c084fc]" : (status === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")
            )}>
              {status === 'running' ? 'EXECUTING' : (status === 'success' ? 'COMPLETED' : 'FAILED')}
            </span>
            <span className="text-[10px] text-[#4a3a5a] font-bold uppercase tracking-widest opacity-60">Tool Call</span>
          </div>
        </div>

        <div className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#c084fc]/10 transition-colors">
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
            className="text-[#4a3a5a] text-[10px] group-hover:text-[#c084fc] transition-colors" 
          />
        </div>
      </div>

      {/* Details Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#2a1f30]/50 bg-[#0d0b12]/40"
          >
            <div className="p-5 space-y-5">
              {/* Parameters Area */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] text-[#4a3a5a] font-black uppercase tracking-[0.2em]">
                  <FontAwesomeIcon icon={faBoxOpen} />
                  <span>Parameters</span>
                </div>
                <div className="relative group/code">
                  <pre className="text-[11px] text-[#a8a8a8] bg-[#0d0b12] p-4 rounded-xl border border-[#2a1f30] overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(parsedInput, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Output Result Area */}
              {parsedResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[9px] text-[#4a3a5a] font-black uppercase tracking-[0.2em]">
                    <FontAwesomeIcon icon={faTerminal} />
                    <span>Result Output</span>
                  </div>
                  <div className="text-[12px] text-[#cbd5e1] leading-relaxed bg-[#1a1620]/30 p-4 rounded-xl border border-[#7c3aed]/5 font-medium">
                    {Array.isArray(parsedResult) 
                      ? parsedResult.map((r, i) => <div key={i} className="mb-1">{r.text}</div>)
                      : String(parsedResult)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
