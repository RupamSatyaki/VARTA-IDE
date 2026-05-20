import React from 'react'
import { ExtensionData } from './ExtensionItem'
import { ThemeSelector } from '../settings/ThemeSelector'
import { useSettingsStore } from '../../store/settingsStore'
import { useSettings } from '../../hooks/useSettings'
import { useExtensionStore } from '../../store/extensionStore'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCube, faGear, faEarthAmericas, faShieldHalved, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons'

export interface ExtensionDetailsTabProps {
  extensionId: string
}

export function ExtensionDetailsTab({ extensionId }: ExtensionDetailsTabProps) {
  const { extensions, marketplace, enabled, enable, disable, uninstall, install } = useExtensionStore()
  const { settings } = useSettingsStore()
  const { updateSetting } = useSettings()

  const ext = [...extensions.map(e => ({
    id:          e.manifest.id || '',
    name:        e.manifest.name,
    publisher:   e.manifest.publisher || 'Unknown',
    description: e.manifest.description || '',
    version:     e.manifest.version,
    installed:   true,
    enabled:     enabled.has(e.manifest.id || ''),
    icon:        e.manifest.icon,
    coverImage:  e.manifest.coverImage,
    isBuiltin:   e.isBuiltin,
  })), ...marketplace.map(m => ({
    id:          m.id,
    name:        m.name,
    publisher:   m.publisher,
    description: m.description,
    version:     m.version,
    icon:        m.icon,
    installed:   false,
    isBuiltin:   false,
  }))].find(e => e.id === extensionId)

  if (!ext) {
    return (
      <div className="flex items-center justify-center h-full text-varta-text-faint">
        Extension not found: {extensionId}
      </div>
    )
  }

  const isThemeExt = ext.id === 'varta.varta-default-theme'

  return (
    <div className="flex flex-col h-full bg-varta-bg overflow-y-auto custom-scrollbar">
      {/* Hero Section */}
      <div className="relative h-48 shrink-0 bg-varta-bg-secondary border-b border-varta-border overflow-hidden">
        {ext.coverImage ? (
          <img src={ext.coverImage} className="w-full h-full object-cover opacity-40 blur-sm" alt="" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-varta-accent/20 to-transparent" />
        )}
        
        <div className="absolute inset-0 flex items-end p-8 gap-6 bg-gradient-to-t from-varta-bg to-transparent">
          <div className="w-24 h-24 rounded-2xl bg-varta-bg-tertiary border border-varta-border shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
            {ext.icon ? (
              <img src={ext.icon} className="w-full h-full object-contain" alt={ext.name} />
            ) : (
              <FontAwesomeIcon icon={faPuzzlePiece} className="text-4xl text-varta-accent/40" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-varta-text tracking-tight truncate">{ext.name}</h1>
              {ext.isBuiltin && (
                <span className="px-2 py-0.5 rounded-full bg-varta-accent/20 text-varta-accent text-[10px] font-bold uppercase tracking-wider border border-varta-accent/20">
                  Built-in
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-varta-text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faEarthAmericas} className="text-[10px] opacity-60" />
                {ext.publisher}
              </span>
              <span>v{ext.version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl w-full mx-auto px-8 py-10 flex gap-12">
        {/* Left: Main info */}
        <div className="flex-1 space-y-10">
          <div>
            <h2 className="text-xs font-bold text-varta-text-faint uppercase tracking-[0.2em] mb-4">Description</h2>
            <p className="text-varta-text leading-relaxed text-lg opacity-90">
              {ext.description}
            </p>
          </div>

          {isThemeExt && (
            <div className="p-8 rounded-3xl bg-varta-bg-secondary border border-varta-border shadow-xl">
              <h2 className="text-lg font-bold text-varta-text mb-2">Theme Selection</h2>
              <p className="text-sm text-varta-text-faint mb-6">This extension provides the core Varta visual experience. Choose your flavor below.</p>
              <ThemeSelector 
                activeThemeId={settings.workbench.theme}
                onSelect={(id) => {
                  updateSetting('workbench', { ...settings.workbench, theme: id })
                  window.varta.settings.set({ workbench: { theme: id } })
                }}
              />
            </div>
          )}

          <div>
            <h2 className="text-xs font-bold text-varta-text-faint uppercase tracking-[0.2em] mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <DetailBox label="Identifier" value={ext.id} />
              <DetailBox label="Status" value={ext.installed ? (ext.enabled ? 'Enabled' : 'Disabled') : 'Not Installed'} />
            </div>
          </div>
        </div>

        {/* Right: Actions sidebar */}
        <div className="w-64 shrink-0 space-y-8">
          <div className="p-6 rounded-2xl bg-varta-bg-secondary/50 border border-varta-border space-y-4">
            {ext.installed ? (
              <>
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-bold text-varta-text">Enabled</span>
                  <Toggle 
                    checked={ext.enabled ?? false} 
                    onChange={(v) => v ? enable(ext.id) : disable(ext.id)} 
                  />
                </div>
                {!ext.isBuiltin && (
                  <Button 
                    variant="danger" 
                    className="w-full justify-center py-2.5"
                    onClick={() => uninstall(ext.id)}
                  >
                    Uninstall
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant="primary" 
                className="w-full justify-center py-2.5"
                onClick={() => install(ext.id)}
              >
                Install
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <SidebarLink icon={faCube} label="Feature Contributions" />
            <SidebarLink icon={faGear} label="Extension Settings" />
            <SidebarLink icon={faShieldHalved} label="Security & Privacy" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-varta-text-faint uppercase tracking-widest">{label}</div>
      <div className="text-sm font-mono text-varta-text-muted truncate bg-varta-bg-secondary px-2 py-1 rounded border border-varta-border/50">{value}</div>
    </div>
  )
}

function SidebarLink({ icon, label }: { icon: any, label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-varta-text-muted hover:text-varta-text hover:bg-varta-hover transition-all text-left group">
      <FontAwesomeIcon icon={icon} className="text-varta-text-faint group-hover:text-varta-accent transition-colors" />
      {label}
    </button>
  )
}
