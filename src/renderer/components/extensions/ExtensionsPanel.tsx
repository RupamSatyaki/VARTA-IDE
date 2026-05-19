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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-varta-bg">
      {/* Header */}
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-varta-text-muted border-b border-varta-border shrink-0">
        Extensions
      </div>

      <ExtensionSearch value={search} onChange={setSearch} />
      <ExtensionToolbar filter={filter} onFilter={setFilter} />

      <div className="flex-1 overflow-y-auto">
        {/* Internal Section */}
        {filteredInternal.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-varta-text-muted bg-varta-bg sticky top-0 z-10 border-b border-varta-border">
              Internal ({filteredInternal.length})
            </div>
            {filteredInternal.map((ext) => (
              <ExtensionItem
                key={ext.id}
                ext={ext}
                onToggle={(id, v) => v ? enable(id) : disable(id)}
              />
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
                <ExtensionItem
                  key={ext.id}
                  ext={ext}
                  onInstall={(id) => install(id).then(() => info(`Installed ${id}`))}
                />
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
