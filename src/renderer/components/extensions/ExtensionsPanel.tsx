import React, { useState, useEffect } from 'react'
import { ExtensionSearch }  from './ExtensionSearch'
import { ExtensionToolbar, type ExtensionFilter } from './ExtensionToolbar'
import { ExtensionItem, type ExtensionData } from './ExtensionItem'
import { useExtensionStore } from '../../store/extensionStore'
import { useNotificationStore } from '../../store/notificationStore'

const RECOMMENDED: ExtensionData[] = [
  { id: 'prettier',          name: 'Prettier',           publisher: 'Prettier',          description: 'Opinionated code formatter',                  version: '3.1.0', installed: false },
  { id: 'eslint',            name: 'ESLint',             publisher: 'ESLint',            description: 'Integrates ESLint into the editor',            version: '2.4.4', installed: false },
  { id: 'gitlens',           name: 'GitLens',            publisher: 'GitKraken',         description: 'Git supercharged — blame, history, insights',  version: '14.9.0',installed: false },
  { id: 'auto-rename-tag',   name: 'Auto Rename Tag',    publisher: 'Jun Han',           description: 'Auto rename paired HTML/XML tags',             version: '0.1.10',installed: false },
  { id: 'path-intellisense', name: 'Path IntelliSense',  publisher: 'Christian Kohler',  description: 'Autocompletes filenames in import statements', version: '2.8.5', installed: false },
]

export function ExtensionsPanel() {
  const { extensions, enabled, enable, disable, uninstall, fetchExtensions, isLoading } = useExtensionStore()
  const { info, error: notifyError } = useNotificationStore()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ExtensionFilter>('all')

  useEffect(() => {
    fetchExtensions().catch(e => notifyError(`Failed to load extensions: ${e.message}`))
  }, [fetchExtensions, notifyError])

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

  const filteredRecommended = RECOMMENDED.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#252526]">
      {/* Header */}
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] border-b border-[#333333] shrink-0">
        Extensions
      </div>

      <ExtensionSearch value={search} onChange={setSearch} />
      <ExtensionToolbar filter={filter} onFilter={setFilter} />

      <div className="flex-1 overflow-y-auto">
        {/* Installed */}
        {filteredInstalled.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] bg-[#252526] sticky top-0">
              Installed ({filteredInstalled.length})
            </div>
            {filteredInstalled.map((ext) => (
              <ExtensionItem
                key={ext.id}
                ext={ext}
                onToggle={(id, v) => v ? (v ? enable(id) : disable(id)) : disable(id)}
                onUninstall={(id) => uninstall(id).then(() => info(`Uninstalled ${id}`))}
              />
            ))}
          </>
        )}

        {isLoading && filteredInstalled.length === 0 && (
          <div className="flex items-center justify-center h-32 text-xs text-[#6e6e6e] animate-pulse">
            Loading extensions...
          </div>
        )}

        {/* Recommended */}
        {filter === 'all' && filteredRecommended.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] bg-[#252526] sticky top-0">
              Recommended
            </div>
            {filteredRecommended.map((ext) => (
              <ExtensionItem
                key={ext.id}
                ext={ext}
                onInstall={(id) => info(`Extension marketplace coming in v2`, 3000)}
              />
            ))}
          </>
        )}

        {filteredInstalled.length === 0 && filteredRecommended.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-32 text-xs text-[#6e6e6e]">
            No extensions found
          </div>
        )}
      </div>
    </div>
  )
}
