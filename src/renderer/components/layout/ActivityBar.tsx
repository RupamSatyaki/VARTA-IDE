import React from 'react'
import { cn } from '../../utils/cn'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'
import { useUIStore, type SidebarPanel } from '../../store/uiStore'

interface ActivityItem {
  id:      SidebarPanel
  icon:    string
  label:   string
}

const TOP_ITEMS: ActivityItem[] = [
  { id: 'explorer',   icon: 'file',       label: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search',     icon: 'search',     label: 'Search (Ctrl+Shift+F)' },
  { id: 'git',        icon: 'git-branch', label: 'Source Control (Ctrl+Shift+G)' },
  { id: 'extensions', icon: 'extensions', label: 'Extensions (Ctrl+Shift+X)' },
  { id: 'debug',      icon: 'debug',      label: 'Run & Debug' },
  { id: 'outline',    icon: 'info',       label: 'Outline' },
  { id: 'ai',         icon: 'sparkle',    label: 'AI Assistant (Ctrl+Shift+A)' },
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
    <div className="flex flex-col items-center w-12 shrink-0 bg-[#333333] border-r border-[#252525]">
      {/* Top items */}
      <div className="flex flex-col items-center gap-0 flex-1 pt-1">
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
      <div className="flex flex-col items-center gap-0 pb-1">
        <Tooltip content="Settings (Ctrl+,)" placement="right">
          <button
            onClick={openSettings}
            aria-label="Settings"
            className="w-12 h-12 flex items-center justify-center text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors"
          >
            <Icon name="settings" size={22} />
          </button>
        </Tooltip>
        <Tooltip content="Account" placement="right">
          <button
            aria-label="Account"
            className="w-12 h-12 flex items-center justify-center text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors"
          >
            <Icon name="account" size={22} />
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
          'relative w-12 h-12 flex items-center justify-center transition-colors',
          active
            ? 'text-[#d4d4d4]'
            : 'text-[#6e6e6e] hover:text-[#d4d4d4]',
        )}
      >
        {/* Active indicator bar */}
        {active && (
          <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#d4d4d4] rounded-r" />
        )}
        <Icon name={item.icon} size={22} />
      </button>
    </Tooltip>
  )
}
