import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faCheckCircle, faCircleXmark, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
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
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "my-3 rounded-xl border overflow-hidden transition-colors duration-300",
        status === 'running' && "bg-[#1e1a24]/50 border-[#7c3aed]/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]",
        status === 'success' && "bg-[#161b22]/50 border-[#238636]/30",
        status === 'error' && "bg-[#1b1111]/50 border-[#f85149]/30"
      )}
    >
      {/* Header */}
      <div 
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          status === 'running' && "bg-[#7c3aed]/20 text-[#c084fc] animate-spin-slow",
          status === 'success' && "bg-[#238636]/20 text-[#3fb950]",
          status === 'error' && "bg-[#f85149]/20 text-[#f85149]"
        )}>
          <FontAwesomeIcon 
            icon={status === 'running' ? faGear : (status === 'success' ? faCheckCircle : faCircleXmark)} 
            style={{ fontSize: 14 }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#e0e0e0] truncate">
              {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {status === 'running' && (
              <span className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-[#c084fc] animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-1 rounded-full bg-[#c084fc] animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-1 rounded-full bg-[#c084fc] animate-bounce" style={{ animationDelay: '0.4s' }} />
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#8e7a9a] font-medium uppercase tracking-wider">
            {status === 'running' ? 'Executing Tool...' : (status === 'success' ? 'Task Completed' : 'Execution Failed')}
          </div>
        </div>

        <FontAwesomeIcon 
          icon={isExpanded ? faChevronUp : faChevronDown} 
          className="text-[#4a3a5a] text-[10px] transition-transform" 
        />
      </div>

      {/* Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#2a1f30] bg-[#0d0d0d]/30"
          >
            <div className="p-4 space-y-3">
              {/* Input */}
              <div>
                <div className="text-[10px] text-[#4a3a5a] font-bold uppercase tracking-widest mb-1.5">Parameters</div>
                <pre className="text-[11px] text-[#a8a8a8] bg-[#1a1620] p-2.5 rounded-lg border border-[#2a1f30] overflow-x-auto">
                  {JSON.stringify(parsedInput, null, 2)}
                </pre>
              </div>

              {/* Result */}
              {parsedResult && (
                <div>
                  <div className="text-[10px] text-[#4a3a5a] font-bold uppercase tracking-widest mb-1.5">Result</div>
                  <div className="text-[11px] text-[#cccccc] leading-relaxed">
                    {Array.isArray(parsedResult) 
                      ? parsedResult.map((r, i) => <div key={i}>{r.text}</div>)
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
