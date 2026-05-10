export type SettingType = 'toggle' | 'slider' | 'select' | 'input' | 'number' | 'password'

export interface SettingSchemaItem {
  id:          string          // e.g. 'editor.fontSize'
  label:       string
  description: string
  type:        SettingType
  section:     'editor' | 'terminal' | 'workbench' | 'git' | 'ai' | 'about'
  min?:        number
  max?:        number
  step?:       number
  unit?:       string
  options?:    Array<{ value: string; label: string }>
  hidden?:     (settings: any) => boolean
}

export const SETTINGS_SCHEMA: SettingSchemaItem[] = [
  // ── Editor ────────────────────────────────────────────────────────────────
  {
    id: 'editor.fontFamily',
    label: 'Font Family',
    description: 'Controls the font family.',
    type: 'input',
    section: 'editor',
  },
  {
    id: 'editor.fontSize',
    label: 'Font Size',
    description: 'Controls the font size in pixels.',
    type: 'slider',
    section: 'editor',
    min: 8,
    max: 32,
    unit: 'px',
  },
  {
    id: 'editor.tabSize',
    label: 'Tab Size',
    description: 'Number of spaces per tab.',
    type: 'slider',
    section: 'editor',
    min: 1,
    max: 8,
  },
  {
    id: 'editor.wordWrap',
    label: 'Word Wrap',
    description: 'Controls how lines should wrap.',
    type: 'select',
    section: 'editor',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'on', label: 'On' },
      { value: 'wordWrapColumn', label: 'Wrap at Column' },
      { value: 'bounded', label: 'Bounded' },
    ],
  },
  {
    id: 'editor.showMinimap',
    label: 'Minimap',
    description: 'Controls whether the minimap is shown.',
    type: 'toggle',
    section: 'editor',
  },
  {
    id: 'editor.showLineNumbers',
    label: 'Line Numbers',
    description: 'Controls the display of line numbers.',
    type: 'toggle',
    section: 'editor',
  },
  {
    id: 'editor.formatOnSave',
    label: 'Format on Save',
    description: 'Format a file on save. A formatter must be available.',
    type: 'toggle',
    section: 'editor',
  },
  {
    id: 'editor.cursorStyle',
    label: 'Cursor Style',
    description: 'Controls the cursor style.',
    type: 'select',
    section: 'editor',
    options: [
      { value: 'line', label: 'Line' },
      { value: 'block', label: 'Block' },
      { value: 'underline', label: 'Underline' },
    ],
  },

  // ── Workbench ──────────────────────────────────────────────────────────────
  {
    id: 'workbench.autoSave',
    label: 'Auto Save',
    description: 'Controls auto save of dirty files.',
    type: 'select',
    section: 'workbench',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'afterDelay', label: 'After Delay' },
      { value: 'onFocusChange', label: 'On Focus Change' },
      { value: 'onWindowChange', label: 'On Window Change' },
    ],
  },
  {
    id: 'workbench.autoSaveDelay',
    label: 'Auto Save Delay',
    description: 'Controls the delay in ms after which a dirty file is saved automatically.',
    type: 'slider',
    section: 'workbench',
    min: 500,
    max: 10000,
    step: 100,
    unit: 'ms',
    hidden: (s) => s.workbench.autoSave !== 'afterDelay',
  },
  {
    id: 'workbench.sidebarPosition',
    label: 'Sidebar Position',
    description: 'Controls the side on which the sidebar is shown.',
    type: 'select',
    section: 'workbench',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ],
  },

  // ── Terminal ───────────────────────────────────────────────────────────────
  {
    id: 'terminal.fontSize',
    label: 'Terminal Font Size',
    description: 'Controls the font size in pixels of the terminal.',
    type: 'slider',
    section: 'terminal',
    min: 8,
    max: 24,
    unit: 'px',
  },
  {
    id: 'terminal.cursorStyle',
    label: 'Terminal Cursor Style',
    description: 'Controls the style of the terminal cursor.',
    type: 'select',
    section: 'terminal',
    options: [
      { value: 'block', label: 'Block' },
      { value: 'underline', label: 'Underline' },
      { value: 'bar', label: 'Bar' },
    ],
  },
  {
    id: 'terminal.scrollback',
    label: 'Scrollback',
    description: 'Controls the maximum amount of lines the terminal keeps in its buffer.',
    type: 'number',
    section: 'terminal',
    min: 0,
    max: 100000,
  },

  // ── Git ───────────────────────────────────────────────────────────────────
  {
    id: 'git.autofetch',
    label: 'Auto Fetch',
    description: 'Whether auto fetching is enabled.',
    type: 'toggle',
    section: 'git',
  },
  {
    id: 'git.decorations',
    label: 'Decorations',
    description: 'Whether to show git decorations in the file tree.',
    type: 'toggle',
    section: 'git',
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    id: 'ai.model',
    label: 'AI Model',
    description: 'Select the AI model for Varta Intelligence.',
    type: 'select',
    section: 'ai',
    options: [
      { value: 'openrouter/owl-alpha', label: 'Owl Alpha (Free)' },
      { value: 'google/gemini-2.0-flash-lite-preview-02-05:free', label: 'Gemini 2.0 Flash Lite (Free)' },
      { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
      { value: 'moonshotai/kimi-k2.6', label: 'Kimi K2.6 (NVIDIA NIM)' },
      { value: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    ],
  },
  {
    id: 'ai.inlineHints',
    label: 'Inline Hints',
    description: 'Show ghost text suggestions as you type.',
    type: 'toggle',
    section: 'ai',
  },
]
