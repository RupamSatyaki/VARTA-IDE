import React, { useState, useEffect } from 'react'
import { ExtensionSearch }  from './ExtensionSearch'
import { ExtensionToolbar, type ExtensionFilter } from './ExtensionToolbar'
import { ExtensionItem, type ExtensionData } from './ExtensionItem'
import { ExtensionDetails } from './ExtensionDetails'
import { ThemeSelector }    from '../settings/ThemeSelector'
import { useExtensionStore } from '../../store/extensionStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useSettings } from '../../hooks/useSettings'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'

export function ExtensionsPanel() {
  const { 
    extensions, 
    enabled, 
    enable, 
    disable, 
    uninstall, 
    fetchExtensions, 
    searchMarketplace,
    install,
    marketplace,
    isLoading 
  } = useExtensionStore()
  const { info, error: notifyError } = useNotificationStore()
  const { settings } = useSettingsStore()
  const { updateSetting } = useSettings()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ExtensionFilter>('all')
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null)

  useEffect(() => {
    fetchExtensions().catch(e => notifyError(`Failed to load extensions: ${e.message}`))
  }, [fetchExtensions, notifyError])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMarketplace(search).catch(e => console.error('Marketplace search failed', e))
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchMarketplace])

  const formatPublisher = (manifest: any) => {
    const pub = manifest.publisher || manifest.author
    if (!pub) return 'Unknown'
    if (typeof pub === 'string') return pub
    return pub.name || 'Unknown'
  }

  // Convert extensions to ExtensionData
  const allExtensions: ExtensionData[] = extensions.map((e) => ({
    id:          e.manifest.id || '',
    name:        e.manifest.name,
    publisher:   formatPublisher(e.manifest),
    description: e.manifest.description || '',
    version:     e.manifest.version,
    installed:   true,
    enabled:     enabled.has(e.manifest.id || ''),
    icon:        e.manifest.icon,
    coverImage:  e.manifest.coverImage,
    isBuiltin:   e.isBuiltin,
  }))

  const internal = allExtensions.filter(e => e.isBuiltin)
  const installed = allExtensions.filter(e => !e.isBuiltin)

  const applyFilters = (list: ExtensionData[]) => {
    return list.filter((e) => {
      if (filter === 'enabled'  && !e.enabled)  { return false }
      if (filter === 'disabled' &&  e.enabled)  { return false }
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
          !e.description.toLowerCase().includes(search.toLowerCase())) { return false }
      return true
    })
  }

  const filteredInternal = applyFilters(internal)
  const filteredInstalled = applyFilters(installed)

  const marketplaceResults: ExtensionData[] = marketplace
    .filter(m => !extensions.some(e => e.manifest.id === m.id))
    .map(m => ({
      id:          m.id,
      name:        m.name,
      publisher:   m.publisher,
      description: m.description,
      version:     m.version,
      icon:        m.icon,
      installed:   false,
    }))

  const selectedExt = allExtensions.find(e => e.id === selectedExtId) || 
                      marketplaceResults.find(e => e.id === selectedExtId)

  // ── Render Selection Detail ───────────────────────────────────────────────
  if (selectedExtId && selectedExt) {
    const isThemeExt = selectedExt.id === 'varta.varta-default-theme'

    return (
      <div className="flex flex-col h-full bg-varta-bg overflow-hidden">
        <div className="px-3 py-2 border-b border-varta-border flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setSelectedExtId(null)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-varta-hover text-varta-text-muted"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="text-xs font-bold truncate">{selectedExt.name}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isThemeExt ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-varta-text mb-1">Select Color Theme</h3>
                <p className="text-[11px] text-varta-text-faint mb-4">Choose your preferred IDE appearance.</p>
                <ThemeSelector 
                  activeThemeId={settings.workbench.theme}
                  onSelect={(id) => {
                    updateSetting('workbench', { ...settings.workbench, theme: id })
                    window.varta.settings.set({ workbench: { theme: id } })
                  }}
                />
              </div>
              <div className="pt-4 border-t border-varta-border">
                <p className="text-xs text-varta-text-faint italic leading-relaxed">
                  The Varta Default Theme provides a cohesive set of colors for your workspace. 
                  Live updates are supported — changes apply immediately across all panels and sidebars.
                </p>
              </div>
            </div>
          ) : (
            <ExtensionDetails ext={selectedExt} onClose={() => setSelectedExtId(null)} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-varta-bg">
      {/* Header */}
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-varta-text-muted border-b border-varta-border shrink-0">
        Extensions
      </div>

      <ExtensionSearch value={search} onChange={setSearch} />
      <ExtensionToolbar filter={filter} onFilter={setFilter} />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Internal Section */}
        {filteredInternal.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-varta-text-muted bg-varta-bg sticky top-0 z-10 border-b border-varta-border">
              Internal ({filteredInternal.length})
            </div>
            {filteredInternal.map((ext) => (
              <div key={ext.id} onClick={() => setSelectedExtId(ext.id)} className="cursor-pointer">
                <ExtensionItem
                  ext={ext}
                  onToggle={(id, v) => v ? enable(id) : disable(id)}
                />
              </div>
            ))}
          </>
        )}

        {/* Installed Section */}
        {filteredInstalled.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-varta-text-muted bg-varta-bg sticky top-0 z-10 border-t border-varta-border">
              Installed ({filteredInstalled.length})
            </div>
            {filteredInstalled.map((ext) => (
              <div key={ext.id} onClick={() => setSelectedExtId(ext.id)} className="cursor-pointer">
                <ExtensionItem
                  ext={ext}
                  onToggle={(id, v) => v ? enable(id) : disable(id)}
                  onUninstall={(id) => uninstall(id).then(() => info(`Uninstalled ${id}`))}
                />
              </div>
            ))}
          </>
        )}

        {/* Marketplace Section */}
        {filter === 'all' && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-varta-text-muted bg-varta-bg sticky top-0 z-10 border-t border-varta-border">
              {search ? `Marketplace Search Results` : 'Recommended'}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <div className="w-4 h-4 border-2 border-varta-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-varta-text-muted animate-pulse">Searching Open VSX...</span>
              </div>
            ) : marketplaceResults.length > 0 ? (
              marketplaceResults.map((ext) => (
                <div key={ext.id} onClick={() => setSelectedExtId(ext.id)} className="cursor-pointer">
                  <ExtensionItem
                    ext={ext}
                    onInstall={(id) => install(id).then(() => info(`Installed ${id}`))}
                  />
                </div>
              ))
            ) : !isLoading && search && filteredInstalled.length === 0 && (
              <div className="flex items-center justify-center h-32 text-xs text-varta-text-muted">
                No extensions found for "{search}"
              </div>
            )}
          </>
        )}

        {filteredInstalled.length === 0 && marketplaceResults.length === 0 && !isLoading && !search && (
          <div className="flex items-center justify-center h-32 text-xs text-varta-text-muted">
            No extensions available
          </div>
        )}
      </div>
    </div>
  )
}
