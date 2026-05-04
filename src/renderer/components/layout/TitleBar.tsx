import React, { useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function TitleBar() {
  const { isMaximized, platform, setMaximized, setPlatform } = useUIStore()

  useEffect(() => {
    // Detect platform
    window.varta.app.getPlatform().then((res) => {
      if (res.success) { setPlatform(res.data as string) }
    }).catch(() => {})

    // Sync maximized state
    window.varta.window.isMaximized().then((v) => setMaximized(v)).catch(() => {})
    const offMax   = window.varta.window.onMaximized(()   => setMaximized(true))
    const offUnmax = window.varta.window.onUnmaximized(() => setMaximized(false))
    return () => { offMax(); offUnmax() }
  }, [setMaximized, setPlatform])

  const isMac = platform === 'darwin'

  return (
    <div
      className={cn(
        'flex items-center h-[30px] shrink-0 select-none',
        'bg-[#3c3c3c] border-b border-[#252525]',
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* macOS: traffic lights handled by OS — just show title */}
      {isMac && (
        <div className="flex-1 text-center text-xs text-[#6e6e6e]">Varta</div>
      )}

      {/* Windows/Linux: custom traffic lights */}
      {!isMac && (
        <>
          <div className="flex items-center gap-1.5 px-3">
            {/* App icon placeholder */}
            <div className="w-4 h-4 rounded-sm bg-[#569cd6] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">V</span>
            </div>
          </div>
          <div className="flex-1 text-center text-xs text-[#6e6e6e]">Varta</div>
          {/* Window controls */}
          <div
            className="flex items-center"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <TitleBarButton
              onClick={() => window.varta.window.minimize()}
              label="Minimize"
              icon={<MinimizeIcon />}
            />
            <TitleBarButton
              onClick={() => isMaximized ? window.varta.window.restore() : window.varta.window.maximize()}
              label={isMaximized ? 'Restore' : 'Maximize'}
              icon={isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
            />
            <TitleBarButton
              onClick={() => window.varta.window.close()}
              label="Close"
              icon={<CloseIcon />}
              danger
            />
          </div>
        </>
      )}
    </div>
  )
}

function TitleBarButton({ onClick, label, icon, danger = false }: {
  onClick: () => void; label: string; icon: React.ReactNode; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-[46px] h-[30px] flex items-center justify-center',
        'text-[#6e6e6e] transition-colors',
        danger ? 'hover:bg-[#e81123] hover:text-white' : 'hover:bg-[#ffffff1a] hover:text-[#d4d4d4]',
      )}
    >
      {icon}
    </button>
  )
}

const MinimizeIcon  = () => <svg width="10" height="1"  viewBox="0 0 10 1"  fill="currentColor"><rect width="10" height="1"/></svg>
const MaximizeIcon  = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x=".5" y=".5" width="9" height="9"/></svg>
const RestoreIcon   = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2.5" y=".5" width="7" height="7"/><path d="M.5 2.5v7h7"/></svg>
const CloseIcon     = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M.293.293l9.414 9.414-.707.707L-.414 1 .293.293zm9.414 0l.707.707L1 10.414l-.707-.707L9.707.293z"/></svg>
