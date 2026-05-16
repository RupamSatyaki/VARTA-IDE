import React, { useState, useEffect } from 'react'
import { ExtensionSearch }  from './ExtensionSearch'
import { ExtensionToolbar, type ExtensionFilter } from './ExtensionToolbar'
import { ExtensionItem, type ExtensionData } from './ExtensionItem'
import { useExtensionStore } from '../../store/extensionStore'
import { useNotificationStore } from '../../store/notificationStore'

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

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ExtensionFilter>('all')

  useEffect(() => {
    fetchExtensions().catch(e => notifyError(`Failed to load extensions: ${e.message}`))
  }, [fetchExtensions, notifyError])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMarketplace(search).catch(e => console.error('Marketplace search failed', e))
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchMarketplace])

  // Convert installed extensions to ExtensionData
  const installed: ExtensionData[] = extensions.map((e) => ({
    id:          e.manifest.id,
    name:        e.manifest.name,
    publisher:   e.manifest.author,
    description: e.manifest.description,
    version:     e.manifest.version,
    installed:   true,
    enabled:     enabled.has(e.manifest.id),
  }))

  const filteredInstalled = installed.filter((e) => {
    if (filter === 'enabled'  && !e.enabled)  { return false }
    if (filter === 'disabled' &&  e.enabled)  { return false }
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
        !e.description.toLowerCase().includes(search.toLowerCase())) { return false }
    return true
  })

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#252526]">
      {/* Header */}
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] border-b border-[#333333] shrink-0">
        Extensions
      </div>

      <ExtensionSearch value={search} onChange={setSearch} />
      <ExtensionToolbar filter={filter} onFilter={setFilter} />

      <div className="flex-1 overflow-y-auto">
        {/* Installed Section */}
        {filteredInstalled.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] bg-[#252526] sticky top-0 z-10">
              Installed ({filteredInstalled.length})
            </div>
            {filteredInstalled.map((ext) => (
              <ExtensionItem
                key={ext.id}
                ext={ext}
                onToggle={(id, v) => v ? enable(id) : disable(id)}
                onUninstall={(id) => uninstall(id).then(() => info(`Uninstalled ${id}`))}
              />
            ))}
          </>
        )}

        {/* Marketplace Section */}
        {filter === 'all' && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] bg-[#252526] sticky top-0 z-10 border-t border-[#333333]">
              {search ? `Marketplace Search Results` : 'Recommended'}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <div className="w-4 h-4 border-2 border-[#569cd6] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-[#6e6e6e] animate-pulse">Searching Open VSX...</span>
              </div>
            ) : marketplaceResults.length > 0 ? (
              marketplaceResults.map((ext) => (
                <ExtensionItem
                  key={ext.id}
                  ext={ext}
                  onInstall={(id) => install(id).then(() => info(`Installed ${id}`))}
                />
              ))
            ) : !isLoading && search && filteredInstalled.length === 0 && (
              <div className="flex items-center justify-center h-32 text-xs text-[#6e6e6e]">
                No extensions found for "{search}"
              </div>
            )}
          </>
        )}

        {filteredInstalled.length === 0 && marketplaceResults.length === 0 && !isLoading && !search && (
          <div className="flex items-center justify-center h-32 text-xs text-[#6e6e6e]">
            No extensions available
          </div>
        )}
      </div>
    </div>
  )
}
