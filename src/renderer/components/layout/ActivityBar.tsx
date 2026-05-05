import React from 'react'
import { cn } from '../../utils/cn'
import { Tooltip } from '../ui/Tooltip'
import { useUIStore, type SidebarPanel } from '../../store/uiStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFile,
  faMagnifyingGlass,
  faCodeBranch,
  faBug,
  faPuzzlePiece,
  faGear,
  faUser,
  faListUl,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import {
  faFile as faFileRegular,
  faUser as faUserRegular,
} from '@fortawesome/free-regular-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface ActivityItem {
  id:    SidebarPanel
  icon:  IconDefinition
  label: string
}

const TOP_ITEMS: ActivityItem[] = [
  { id: 'explorer',   icon: faFileRegular,       label: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search',     icon: faMagnifyingGlass,   label: 'Search (Ctrl+Shift+F)' },
  { id: 'git',        icon: faCodeBranch,        label: 'Source Control (Ctrl+Shift+G)' },
  { id: 'debug',      icon: faBug,               label: 'Run & Debug' },
  { id: 'extensions', icon: faPuzzlePiece,       label: 'Extensions (Ctrl+Shift+X)' },
  { id: 'outline',    icon: faListUl,            label: 'Outline' },
  { id: 'ai',         icon: faWandMagicSparkles, label: 'AI Assistant (Ctrl+Shift+A)' },
]

export function ActivityBar() {
  const { activeSidebarPanel, sidebarVisible, setActiveSidebarPanel, toggleSidebar, openSettings } = useUIStore()

  const handleClick = (id: SidebarPanel) => {
    if (activeSidebarPanel === id && sidebarVisible) {
      toggleSidebar()
    } else {
      setActiveSidebarPanel(id)
    }
  }

  return (
    <div className="flex flex-col items-center w-14 shrink-0 bg-[#1e1e2e] border-r border-[#2a2a3d]">
      {/* Top items */}
      <div className="flex flex-col items-center gap-1 flex-1 pt-2">
        {TOP_ITEMS.map((item) => (
          <ActivityBarItem
            key={item.id}
            item={item}
            active={activeSidebarPanel === item.id && sidebarVisible}
            onClick={() => handleClick(item.id)}
          />
        ))}
      </div>

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-1 pb-2">
        <Tooltip content="Settings (Ctrl+,)" placement="right">
          <button
            onClick={openSettings}
            aria-label="Settings"
            className="group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 text-[#6e6e9a] hover:text-white"
          >
            {/* Glassmorphism hover layer */}
            <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300
              bg-gradient-to-br from-[#7c3aed]/15 to-[#a855f7]/10
              backdrop-blur-sm border border-[#a855f7]/15
              shadow-[0_4px_16px_rgba(168,85,247,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]" />
            <FontAwesomeIcon icon={faGear} className="relative z-10" style={{ fontSize: 17 }} />
          </button>
        </Tooltip>

        <Tooltip content="Profile" placement="right">
          <button
            aria-label="Profile"
            className="group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 text-[#6e6e9a] hover:text-white"
          >
            {/* Glassmorphism hover layer */}
            <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300
              bg-gradient-to-br from-[#7c3aed]/15 to-[#a855f7]/10
              backdrop-blur-sm border border-[#a855f7]/15
              shadow-[0_4px_16px_rgba(168,85,247,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]" />
            <FontAwesomeIcon icon={faUserRegular} className="relative z-10" style={{ fontSize: 17 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

function ActivityBarItem({ item, active, onClick }: {
  item: ActivityItem; active: boolean; onClick: () => void
}) {
  return (
    <Tooltip content={item.label} placement="right">
      <button
        onClick={onClick}
        aria-label={item.label}
        aria-pressed={active}
        className={cn(
          'group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300',
          active ? 'text-white' : 'text-[#6e6e9a] hover:text-white',
        )}
      >
        {/* Glassmorphism layer — hover state */}
        {!active && (
          <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300
            bg-gradient-to-br from-[#7c3aed]/15 to-[#a855f7]/10
            backdrop-blur-sm border border-[#a855f7]/15
            shadow-[0_4px_16px_rgba(168,85,247,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]" />
        )}

        {/* Active state — slightly more visible glass */}
        {active && (
          <span className="absolute inset-0 rounded-lg
            bg-gradient-to-br from-[#7c3aed]/25 to-[#a855f7]/18
            backdrop-blur-sm border border-[#a855f7]/25
            shadow-[0_4px_20px_rgba(168,85,247,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]" />
        )}

        {/* Active left indicator bar */}
        {active && (
          <span className="absolute -left-1 top-2.5 bottom-2.5 w-0.5 bg-[#c084fc] rounded-r shadow-[0_0_8px_#c084fc]" />
        )}

        <FontAwesomeIcon icon={item.icon} className="relative z-10" style={{ fontSize: 17 }} />
      </button>
    </Tooltip>
  )
}
