import React, { useState, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'
import { SettingsSidebar }  from './SettingsSidebar'
import { SettingsSearch }   from './SettingsSearch'
import { SettingsSection }  from './SettingsSection'
import { SettingsItem }     from './SettingsItem'
import { SettingsToggle }   from './SettingsToggle'
import { SettingsSelect }   from './SettingsSelect'
import { SettingsInput }    from './SettingsInput'
import { SettingsSlider }   from './SettingsSlider'
import { ThemeSelector }    from './ThemeSelector'
import { Button }           from '../ui/Button'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore }       from '../../store/uiStore'
import { useSettings }      from '../../hooks/useSettings'
import { CLAUDE_MODELS }    from '../../../shared/types/ai.types'
import { isIPCSuccess }     from '../../../shared/ipc'

export function SettingsPanel() {
  const { settingsOpen, closeSettings } = useUIStore()
  const { settings } = useSettingsStore()
  const { updateSetting, resetSettings, exportSettings, importSettings } = useSettings()

  const [search,        setSearch]        = useState('')
  const [activeSection, setActiveSection] = useState('editor')
  const [apiKeyInput,   setApiKeyInput]   = useState('')
  const [apiKeyStatus,  setApiKeyStatus]  = useState<'idle' | 'saved' | 'none'>('idle')
  const [appVersion,    setAppVersion]    = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!settingsOpen) { return }
    setSearch('')
    window.varta.app.getVersion().then((r) => {
      if (isIPCSuccess(r)) { setAppVersion(r.data) }
    }).catch(() => {})
    window.varta.ai.hasApiKey().then((r) => {
      if (isIPCSuccess(r)) { setApiKeyStatus(r.data ? 'saved' : 'none') }
    }).catch(() => {})
  }, [settingsOpen])

  // Close on Escape
  useEffect(() => {
    if (!settingsOpen) { return }
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeSettings() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settingsOpen, closeSettings])

  if (!settingsOpen) { return null }

  const u = (path: string, value: unknown) => updateSetting(path, value)

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) { return }
    const res = await window.varta.ai.setApiKey(apiKeyInput.trim())
    if (isIPCSuccess(res)) {
      setApiKeyStatus('saved')
      setApiKeyInput('')
    }
  }

  const modelOptions = CLAUDE_MODELS.map((m) => ({ value: m.id, label: m.name }))

  return (
    <div
      className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) { closeSettings() } }}
    >
      <div className="flex flex-col w-[800px] max-w-[95vw] h-[85vh] max-h-[700px] rounded-lg border border-[#333333] bg-[#1e1e1e] shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333] shrink-0">
          <h1 className="text-sm font-semibold text-[#d4d4d4]">Settings</h1>
          <button
            onClick={closeSettings}
            className="text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors"
            aria-label="Close settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 7.293L12.646 2.646l.708.708L8.707 8l4.647 4.646-.708.708L8 8.707l-4.646 4.647-.708-.708L7.293 8 2.646 3.354l.708-.708L8 7.293z"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-[#333333] shrink-0">
          <SettingsSearch value={search} onChange={setSearch} />
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <SettingsSidebar activeSection={activeSection} onSelect={setActiveSection} />

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-4">

            {/* ── Editor ─────────────────────────────────────────────────── */}
            <SettingsSection id="editor" title="Editor">
              <SettingsItem label="Font Family" description="Editor font family"
                control={<SettingsInput value={settings.editor.fontFamily} onChange={(v) => u('editor', { ...settings.editor, fontFamily: v })} />} />
              <SettingsItem label="Font Size" description="Editor font size (10–24)"
                control={<SettingsSlider value={settings.editor.fontSize} min={10} max={24} onChange={(v) => u('editor', { ...settings.editor, fontSize: v })} unit="px" />} />
              <SettingsItem label="Tab Size" description="Number of spaces per tab"
                control={<SettingsSlider value={settings.editor.tabSize} min={1} max={8} onChange={(v) => u('editor', { ...settings.editor, tabSize: v })} />} />
              <SettingsItem label="Word Wrap" description="Wrap long lines"
                control={<SettingsToggle value={settings.editor.wordWrap !== 'off'} onChange={(v) => u('editor', { ...settings.editor, wordWrap: v ? 'on' : 'off' })} />} />
              <SettingsItem label="Minimap" description="Show code minimap"
                control={<SettingsToggle value={settings.editor.showMinimap} onChange={(v) => u('editor', { ...settings.editor, showMinimap: v })} />} />
              <SettingsItem label="Line Numbers" description="Show line numbers"
                control={<SettingsToggle value={settings.editor.showLineNumbers} onChange={(v) => u('editor', { ...settings.editor, showLineNumbers: v })} />} />
              <SettingsItem label="Format on Save" description="Auto-format file when saving"
                control={<SettingsToggle value={settings.editor.formatOnSave} onChange={(v) => u('editor', { ...settings.editor, formatOnSave: v })} />} />
              <SettingsItem label="Render Whitespace" description="Show whitespace characters"
                control={<SettingsSelect value={settings.editor.renderWhitespace} options={[
                  { value: 'none',      label: 'None' },
                  { value: 'selection', label: 'Selection' },
                  { value: 'all',       label: 'All' },
                ]} onChange={(v) => u('editor', { ...settings.editor, renderWhitespace: v as any })} />} />
              <SettingsItem label="Cursor Style"
                control={<SettingsSelect value={settings.editor.cursorStyle} options={[
                  { value: 'line',       label: 'Line' },
                  { value: 'block',      label: 'Block' },
                  { value: 'underline',  label: 'Underline' },
                ]} onChange={(v) => u('editor', { ...settings.editor, cursorStyle: v as any })} />} />
              <SettingsItem label="Cursor Blinking"
                control={<SettingsSelect value={settings.editor.cursorBlinking} options={[
                  { value: 'blink',   label: 'Blink' },
                  { value: 'smooth',  label: 'Smooth' },
                  { value: 'solid',   label: 'Solid' },
                  { value: 'phase',   label: 'Phase' },
                  { value: 'expand',  label: 'Expand' },
                ]} onChange={(v) => u('editor', { ...settings.editor, cursorBlinking: v as any })} />} />
            </SettingsSection>

            {/* ── Auto Save ──────────────────────────────────────────────── */}
            <SettingsSection id="autosave" title="Auto Save">
              <SettingsItem label="Auto Save" description="Automatically save files"
                control={<SettingsSelect value={settings.workbench.autoSave} options={[
                  { value: 'off',            label: 'Off' },
                  { value: 'afterDelay',     label: 'After Delay' },
                  { value: 'onFocusChange',  label: 'On Focus Change' },
                  { value: 'onWindowChange', label: 'On Window Change' },
                ]} onChange={(v) => u('workbench', { ...settings.workbench, autoSave: v as any })} />} />
              <SettingsItem
                label="Auto Save Delay"
                description="Delay in milliseconds before auto-save"
                hidden={settings.workbench.autoSave !== 'afterDelay'}
                control={<SettingsSlider value={settings.workbench.autoSaveDelay} min={500} max={5000} step={100} onChange={(v) => u('workbench', { ...settings.workbench, autoSaveDelay: v })} unit="ms" />}
              />
            </SettingsSection>

            {/* ── Terminal ───────────────────────────────────────────────── */}
            <SettingsSection id="terminal" title="Terminal">
              <SettingsItem label="Font Family"
                control={<SettingsInput value={settings.terminal.fontFamily} onChange={(v) => u('terminal', { ...settings.terminal, fontFamily: v })} />} />
              <SettingsItem label="Font Size"
                control={<SettingsSlider value={settings.terminal.fontSize} min={10} max={20} onChange={(v) => u('terminal', { ...settings.terminal, fontSize: v })} unit="px" />} />
              <SettingsItem label="Scrollback Lines" description="Number of lines to keep in scrollback"
                control={<SettingsSlider value={settings.terminal.scrollback} min={100} max={10000} step={100} onChange={(v) => u('terminal', { ...settings.terminal, scrollback: v })} />} />
              <SettingsItem label="Cursor Style"
                control={<SettingsSelect value={settings.terminal.cursorStyle} options={[
                  { value: 'block',     label: 'Block' },
                  { value: 'underline', label: 'Underline' },
                  { value: 'bar',       label: 'Bar' },
                ]} onChange={(v) => u('terminal', { ...settings.terminal, cursorStyle: v as any })} />} />
              <SettingsItem label="Cursor Blink"
                control={<SettingsToggle value={settings.terminal.cursorBlinking === 'blink'} onChange={(v) => u('terminal', { ...settings.terminal, cursorBlinking: v ? 'blink' : 'solid' })} />} />
            </SettingsSection>

            {/* ── Appearance ─────────────────────────────────────────────── */}
            <SettingsSection id="appearance" title="Appearance">
              <SettingsItem label="Theme" description="Color theme for the editor"
                control={<span className="text-xs text-[#6e6e6e]">Select below</span>} />
              <ThemeSelector
                activeThemeId={settings.workbench.theme}
                onSelect={(id) => u('workbench', { ...settings.workbench, theme: id })}
              />
            </SettingsSection>

            {/* ── Git ────────────────────────────────────────────────────── */}
            <SettingsSection id="git" title="Git">
              <SettingsItem label="Auto Fetch" description="Automatically fetch from remote"
                control={<SettingsToggle value={settings.git.autofetch} onChange={(v) => u('git', { ...settings.git, autofetch: v })} />} />
              <SettingsItem label="Auto Fetch Interval" description="Seconds between auto-fetches"
                hidden={!settings.git.autofetch}
                control={<SettingsSlider value={settings.git.autofetchPeriod} min={30} max={300} step={30} onChange={(v) => u('git', { ...settings.git, autofetchPeriod: v })} unit="s" />} />
              <SettingsItem label="Confirm Discard" description="Ask before discarding changes"
                control={<SettingsToggle value={settings.git.confirmSync} onChange={(v) => u('git', { ...settings.git, confirmSync: v })} />} />
              <SettingsItem label="Show Decorations" description="Show git status in file tree"
                control={<SettingsToggle value={settings.git.decorations} onChange={(v) => u('git', { ...settings.git, decorations: v })} />} />
            </SettingsSection>

            {/* ── AI ─────────────────────────────────────────────────────── */}
            <SettingsSection id="ai" title="AI / Varta Intelligence">
              {/* API Key */}
              <SettingsItem label="Claude API Key" description="Your Anthropic API key (stored securely, never exposed)"
                control={
                  <div className="flex flex-col gap-1.5 w-64">
                    <div className="flex gap-1.5">
                      <SettingsInput
                        value={apiKeyInput}
                        onChange={setApiKeyInput}
                        type="password"
                        placeholder="sk-ant-..."
                        className="flex-1 w-auto"
                      />
                      <Button variant="primary" size="sm" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>
                        Save
                      </Button>
                    </div>
                    <p className={cn('text-[10px]', apiKeyStatus === 'saved' ? 'text-[#4ec9b0]' : 'text-[#6e6e6e]')}>
                      {apiKeyStatus === 'saved' ? '✓ API key saved' : apiKeyStatus === 'none' ? '✗ No key set' : ''}
                    </p>
                  </div>
                }
              />
              <SettingsItem label="Model" description="Claude model to use"
                control={<SettingsSelect value={settings.ai.model} options={modelOptions} onChange={(v) => u('ai', { ...settings.ai, model: v })} />} />
              <SettingsItem label="Inline Hints" description="Show AI code hints while typing"
                control={<SettingsToggle value={settings.ai.inlineHints} onChange={(v) => u('ai', { ...settings.ai, inlineHints: v })} />} />
              <SettingsItem label="Hint Delay" description="Delay before showing inline hints"
                hidden={!settings.ai.inlineHints}
                control={<SettingsSlider value={settings.ai.inlineHintsDelay} min={300} max={2000} step={100} onChange={(v) => u('ai', { ...settings.ai, inlineHintsDelay: v })} unit="ms" />} />
              <SettingsItem label="Max Tokens" description="Maximum tokens per AI response"
                control={<SettingsSlider value={settings.ai.maxTokens} min={256} max={4096} step={256} onChange={(v) => u('ai', { ...settings.ai, maxTokens: v })} />} />
            </SettingsSection>

            {/* ── About ──────────────────────────────────────────────────── */}
            <SettingsSection id="about" title="About">
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6e6e6e]">Version</span>
                  <span className="text-[#d4d4d4] font-mono">{appVersion || '0.1.0'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6e6e6e]">Electron</span>
                  <span className="text-[#d4d4d4] font-mono">{(window as any).vartaVersions?.electron ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6e6e6e]">Node.js</span>
                  <span className="text-[#d4d4d4] font-mono">{(window as any).vartaVersions?.node ?? '—'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#333333]">
                <Button variant="default" size="sm" onClick={exportSettings}>Export Settings</Button>
                <Button variant="default" size="sm" onClick={importSettings}>Import Settings</Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={resetSettings}
                >
                  Reset All Settings
                </Button>
              </div>
            </SettingsSection>

          </div>
        </div>
      </div>
    </div>
  )
}
