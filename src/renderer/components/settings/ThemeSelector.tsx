import React from 'react'
import { cn } from '../../utils/cn'

export interface ThemeOption {
  id:      string
  name:    string
  bg:      string
  surface: string
  accent:  string
  text:    string
}

export const BUILT_IN_THEMES: ThemeOption[] = [
  { id: 'varta-dark',     name: 'Varta Dark',     bg: '#1e1b24', surface: '#28242e', accent: '#a074c4', text: '#e0def4' },
  { id: 'varta-light',    name: 'Varta Light',    bg: '#ffffff', surface: '#f5f5f5', accent: '#0066cc', text: '#1a1a1a' },
  { id: 'monokai',        name: 'Monokai',        bg: '#272822', surface: '#3e3d32', accent: '#f92672', text: '#f8f8f2' },
  { id: 'github-dark',    name: 'GitHub Dark',    bg: '#0d1117', surface: '#161b22', accent: '#58a6ff', text: '#c9d1d9' },
  { id: 'solarized-dark', name: 'Solarized Dark', bg: '#002b36', surface: '#073642', accent: '#268bd2', text: '#839496' },
]

export interface ThemeSelectorProps {
  activeThemeId: string
  onSelect:      (id: string) => void
}

export function ThemeSelector({ activeThemeId, onSelect }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      {BUILT_IN_THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme.id)}
          className={cn(
            'rounded-lg border-2 overflow-hidden text-left transition-all',
            activeThemeId === theme.id
              ? 'border-[#569cd6] shadow-lg'
              : 'border-[#333333] hover:border-[#555555]',
          )}
        >
          {/* Preview swatch */}
          <div
            className="h-16 p-2 flex flex-col gap-1"
            style={{ backgroundColor: theme.bg }}
          >
            {/* Fake editor lines */}
            <div className="flex gap-1 items-center">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: theme.surface }} />
              <div className="h-1.5 rounded flex-1" style={{ backgroundColor: theme.surface }} />
            </div>
            <div className="h-1 rounded w-3/4" style={{ backgroundColor: theme.accent, opacity: 0.8 }} />
            <div className="h-1 rounded w-1/2" style={{ backgroundColor: theme.text, opacity: 0.4 }} />
            <div className="h-1 rounded w-2/3" style={{ backgroundColor: theme.text, opacity: 0.3 }} />
          </div>
          {/* Theme name */}
          <div
            className="px-2 py-1.5 text-xs font-medium"
            style={{ backgroundColor: theme.surface, color: theme.text }}
          >
            {theme.name}
          </div>
        </button>
      ))}
    </div>
  )
}
