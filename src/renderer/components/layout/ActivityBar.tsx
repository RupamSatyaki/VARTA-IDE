import React from 'react'
import { cn } from '../../utils/cn'
import { Tooltip } from '../ui/Tooltip'
import { useUIStore, type SidebarPanel } from '../../store/uiStore'
import { useGitStore } from '../../store/gitStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faCodeBranch,
  faBug,
  faPuzzlePiece,
  faGear,
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
  const { status: gitStatus } = useGitStore()

  // Total changed files count
  const gitChangesCount = gitStatus
    ? gitStatus.staged.length + gitStatus.unstaged.length + gitStatus.untracked.length
    : 0

  const handleClick = (id: SidebarPanel) => {
    if (activeSidebarPanel === id && sidebarVisible) {
      toggleSidebar()
    } else {
      setActiveSidebarPanel(id)
    }
  }

  return (
    <div
      className="flex flex-col items-center w-14 shrink-0 border-r"
      style={{
        backgroundColor: 'var(--varta-activitybar)',
        borderColor:     'var(--varta-activitybar-border)',
      }}
    >
      {/* Top items */}
      <div className="flex flex-col items-center gap-1 flex-1 pt-2">
        {TOP_ITEMS.map((item) => (
          <ActivityBarItem
            key={item.id}
            item={item}
            active={activeSidebarPanel === item.id && sidebarVisible}
            onClick={() => handleClick(item.id)}
            badge={item.id === 'git' && gitChangesCount > 0 ? gitChangesCount : undefined}
          />
        ))}
      </div>

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-1 pb-2">
        <Tooltip content="Settings (Ctrl+,)" placement="right">
          <button
            onClick={openSettings}
            aria-label="Settings"
            className="group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300"
            style={{ color: 'var(--varta-activitybar-icon)' }}
          >
            <GlassHover />
            <FontAwesomeIcon icon={faGear} className="relative z-10 group-hover:text-white transition-colors duration-300" style={{ fontSize: 17 }} />
          </button>
        </Tooltip>

        <Tooltip content="Profile" placement="right">
          <button
            aria-label="Profile"
            className="group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300"
            style={{ color: 'var(--varta-activitybar-icon)' }}
          >
            <GlassHover />
            <FontAwesomeIcon icon={faUserRegular} className="relative z-10 group-hover:text-white transition-colors duration-300" style={{ fontSize: 17 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

/** Glassmorphism hover layer using CSS variables */
function GlassHover() {
  return (
    <span
      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
      style={{
        background:   'linear-gradient(135deg, var(--varta-activitybar-hover-from), var(--varta-activitybar-hover-to))',
        border:       '1px solid var(--varta-activitybar-hover-border)',
        boxShadow:    '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    />
  )
}

/** Glassmorphism active layer using CSS variables */
function GlassActive() {
  return (
    <span
      className="absolute inset-0 rounded-lg backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, var(--varta-activitybar-active-from), var(--varta-activitybar-active-to))',
        border:     '1px solid var(--varta-activitybar-active-border)',
        boxShadow:  '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    />
  )
}

function ActivityBarItem({ item, active, onClick, badge }: {
  item: ActivityItem; active: boolean; onClick: () => void; badge?: number
}) {
  return (
    <Tooltip content={item.label} placement="right">
      <button
        onClick={onClick}
        aria-label={item.label}
        aria-pressed={active}
        className="group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300"
        style={{ color: active ? 'var(--varta-accent)' : 'var(--varta-activitybar-icon)' }}
      >
        {/* Hover glass */}
        {!active && <GlassHover />}

        {/* Active glass */}
        {active && <GlassActive />}

        {/* Active left indicator */}
        {active && (
          <span
            className="absolute -left-1 top-2.5 bottom-2.5 w-0.5 rounded-r"
            style={{
              backgroundColor: 'var(--varta-activitybar-indicator)',
              boxShadow:       '0 0 8px var(--varta-activitybar-indicator)',
            }}
          />
        )}

        <FontAwesomeIcon
          icon={item.icon}
          className={cn('relative z-10 transition-colors duration-300', !active && 'group-hover:text-white')}
          style={{ fontSize: 17 }}
        />

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-0.5 right-0.5 z-20 min-w-[16px] h-[16px] px-1
            flex items-center justify-center rounded-full
            bg-varta-accent text-white text-[9px] font-bold leading-none
            shadow-[0_0_6px_rgba(160,116,196,0.6)]">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    </Tooltip>
  )
}
