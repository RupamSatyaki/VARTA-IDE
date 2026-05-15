import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { SettingsSidebar }  from './SettingsSidebar'
import { SettingsSearch }   from './SettingsSearch'
import { AutomatedSettings } from './AutomatedSettings'
import { ThemeSelector }    from './ThemeSelector'
import { Button }           from '../ui/Button'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore }       from '../../store/uiStore'
import { useSettings }      from '../../hooks/useSettings'
import { isIPCSuccess }     from '../../../shared/ipc'
import { FontAwesomeIcon }  from '@fortawesome/react-fontawesome'
import { faXmark, faCircleInfo, faKeyboard, faShieldHalved, faCode, faTerminal, faDisplay, faCodeBranch, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'

export function SettingsPanel() {
  const { settingsOpen, closeSettings } = useUIStore()
  const { settings } = useSettingsStore()
  const { resetSettings, exportSettings, importSettings } = useSettings()

  const [search,        setSearch]        = useState('')
  const [activeSection, setActiveSection] = useState('editor')
  const [apiKeyInput,   setApiKeyInput]   = useState('')
  const [apiKeyStatus,  setApiKeyStatus]  = useState<'idle' | 'saved' | 'none'>('idle')
  const [baseUrlInput,  setBaseUrlInput]  = useState('')
  const [baseUrlStatus, setBaseUrlStatus] = useState<'idle' | 'saved' | 'none'>('idle')
  const [appVersion,    setAppVersion]    = useState('')

  useEffect(() => {
    if (!settingsOpen) { return }
    setSearch('')
    window.varta.app.getVersion().then((r) => {
      if (isIPCSuccess(r)) { setAppVersion(r.data) }
    }).catch(() => {})
    window.varta.ai.hasApiKey().then((r) => {
      if (isIPCSuccess(r)) { setApiKeyStatus(r.data ? 'saved' : 'none') }
    }).catch(() => {})
    window.varta.ai.hasBaseUrl().then((r) => {
      if (isIPCSuccess(r)) { setBaseUrlStatus(r.data ? 'saved' : 'none') }
    }).catch(() => {})
  }, [settingsOpen])

  useEffect(() => {
    if (!settingsOpen) { return }
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeSettings() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settingsOpen, closeSettings])

  if (!settingsOpen) { return null }

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) { return }
    const res = await window.varta.ai.setApiKey(apiKeyInput.trim())
    if (isIPCSuccess(res)) { setApiKeyStatus('saved'); setApiKeyInput('') }
  }

  const handleSaveBaseUrl = async () => {
    if (!baseUrlInput.trim()) { return }
    const res = await window.varta.ai.setBaseUrl(baseUrlInput.trim())
    if (isIPCSuccess(res)) { setBaseUrlStatus('saved'); setBaseUrlInput('') }
  }

  return (
    <div
      className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) { closeSettings() } }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="flex flex-col w-full max-w-5xl h-full max-h-[800px] rounded-3xl border border-[#2a1f30] bg-[#1a1620]/95 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 shrink-0">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-[#e0e0e0] tracking-tight">Settings</h1>
            <p className="text-[11px] text-[#4a3a5a] font-bold uppercase tracking-[0.2em]">Configure your development experience</p>
          </div>
          <button
            onClick={closeSettings}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#1e1a24] text-[#4a3a5a] hover:bg-[#f87171]/10 hover:text-[#f87171] transition-all duration-300"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <SettingsSidebar activeSection={activeSection} onSelect={setActiveSection} />

          <div className="flex-1 flex flex-col min-w-0 bg-[#1e1a24]/30">
            {/* Search Top Bar */}
            <div className="px-10 py-4 border-b border-[#2a1f30] bg-[#1e1a24]/50">
              <SettingsSearch value={search} onChange={setSearch} />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-10 py-8 scrollbar-thin scrollbar-thumb-[#2a1f30] scroll-smooth">
              <div className="max-w-2xl mx-auto pb-20">
                <AnimatePresence mode="wait">
                  {!search && (
                    <div className="space-y-16">
                      <div id="settings-editor">
                        <SectionTitle icon={faCode} title="Text Editor" />
                        <AutomatedSettings activeSection="editor" search="" />
                      </div>

                      <div id="settings-terminal">
                        <SectionTitle icon={faTerminal} title="Integrated Terminal" />
                        <AutomatedSettings activeSection="terminal" search="" />
                      </div>

                      <div id="settings-workbench">
                        <SectionTitle icon={faDisplay} title="Workbench Appearance" />
                        <ThemeSelector
                          activeThemeId={settings.workbench.theme}
                          onSelect={(id) => window.varta.settings.set({ workbench: { theme: id } })}
                        />
                        <div className="mt-8">
                          <AutomatedSettings activeSection="workbench" search="" />
                        </div>
                      </div>

                      <div id="settings-git">
                        <SectionTitle icon={faCodeBranch} title="Source Control" />
                        <AutomatedSettings activeSection="git" search="" />
                      </div>

                      <div id="settings-ai">
                        <SectionTitle icon={faShieldHalved} title="AI & Intelligence" />
                        <div className="mb-8 p-6 rounded-2xl bg-[#7c3aed]/5 border border-[#7c3aed]/10 space-y-6">
                          <div>
                            <label className="block text-xs font-bold text-[#7c5a9a] uppercase tracking-wider mb-2">Claude API Key</label>
                            <div className="flex gap-2">
                              <input 
                                type="password" 
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder={apiKeyStatus === 'saved' ? '••••••••••••••••' : 'Enter API Key...'}
                                className="flex-1 bg-[#12101a] border border-[#2a1f30] rounded-xl px-4 py-2.5 text-sm text-[#e0e0e0] outline-none focus:border-[#7c3aed]/50 transition-all"
                              />
                              <Button variant="primary" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>Save</Button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#7c5a9a] uppercase tracking-wider mb-2">Custom Base URL (Optional)</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={baseUrlInput}
                                onChange={(e) => setBaseUrlInput(e.target.value)}
                                placeholder="https://api.anthropic.com"
                                className="flex-1 bg-[#12101a] border border-[#2a1f30] rounded-xl px-4 py-2.5 text-sm text-[#e0e0e0] outline-none focus:border-[#7c3aed]/50 transition-all"
                              />
                              <Button variant="primary" onClick={handleSaveBaseUrl} disabled={!baseUrlInput.trim()}>Save</Button>
                            </div>
                          </div>
                        </div>
                        <AutomatedSettings activeSection="ai" search="" />
                      </div>

                      <div id="settings-about">
                        <SectionTitle icon={faCircleInfo} title="About Varta" />
                        <div className="grid grid-cols-2 gap-4">
                          <AboutCard label="Version" value={appVersion || '0.1.0'} />
                          <AboutCard label="Electron" value={(window as any).vartaVersions?.electron ?? '—'} />
                          <AboutCard label="Node.js" value={(window as any).vartaVersions?.node ?? '—'} />
                          <AboutCard label="Engine" value="Ripgrep Powered" />
                        </div>

                        <div className="flex flex-wrap gap-3 pt-6">
                          <Button variant="default" onClick={exportSettings}>Export Config</Button>
                          <Button variant="default" onClick={importSettings}>Import Config</Button>
                          <Button variant="danger" onClick={resetSettings}>Factory Reset</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {search && (
                    <motion.div
                      key="search-results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <SectionTitle icon={faMagnifyingGlass} title={`Search results for "${search}"`} />
                      <AutomatedSettings activeSection="all" search={search} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>          </div>
        </div>
      </motion.div>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-2xl bg-[#7c3aed]/10 text-[#c084fc] flex items-center justify-center">
        <FontAwesomeIcon icon={icon} style={{ fontSize: 14 }} />
      </div>
      <h3 className="text-sm font-bold text-[#e0e0e0] tracking-wide uppercase">{title}</h3>
    </div>
  )
}

function AboutCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-[#1e1a24] border border-[#2a1f30]">
      <div className="text-[10px] font-bold text-[#4a3a5a] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm font-mono text-[#c084fc]">{value}</div>
    </div>
  )
}
