/** Extension / plugin types shared between main and renderer */

export type ExtensionStatus = 'enabled' | 'disabled' | 'error' | 'loading'

export interface ExtensionManifest {
  id:           string
  name:         string
  version:      string
  description:  string
  author:       string
  license?:     string
  homepage?:    string
  repository?:  string
  icon?:        string
  keywords?:    string[]
  engines:      { varta: string }   // semver range
  main?:        string              // entry point (relative to extension root)
  contributes?: ExtensionContributions
  activationEvents?: string[]
  dependencies?: Record<string, string>
}

export interface ExtensionContributions {
  commands?:      ContributedCommand[]
  keybindings?:   ContributedKeybinding[]
  menus?:         Record<string, ContributedMenuItem[]>
  languages?:     ContributedLanguage[]
  grammars?:      ContributedGrammar[]
  themes?:        ContributedTheme[]
  snippets?:      ContributedSnippets[]
  configuration?: ContributedConfiguration
}

export interface ContributedCommand {
  command:  string
  title:    string
  category?: string
  icon?:    string
}

export interface ContributedKeybinding {
  command:  string
  key:      string
  mac?:     string
  linux?:   string
  win?:     string
  when?:    string
}

export interface ContributedMenuItem {
  command:  string
  when?:    string
  group?:   string
  alt?:     string
}

export interface ContributedLanguage {
  id:           string
  aliases?:     string[]
  extensions?:  string[]
  filenames?:   string[]
  mimetypes?:   string[]
  configuration?: string
}

export interface ContributedGrammar {
  language:     string
  scopeName:    string
  path:         string
}

export interface ContributedTheme {
  id:     string
  label:  string
  path:   string
  uiTheme: 'vs' | 'vs-dark' | 'hc-black'
}

export interface ContributedSnippets {
  language: string
  path:     string
}

export interface ContributedConfiguration {
  title:       string
  properties:  Record<string, ContributedConfigProperty>
}

export interface ContributedConfigProperty {
  type:         string | string[]
  default?:     unknown
  description:  string
  enum?:        unknown[]
  enumDescriptions?: string[]
  minimum?:     number
  maximum?:     number
}

export interface ExtensionInfo {
  manifest:     ExtensionManifest
  status:       ExtensionStatus
  installPath:  string
  installedAt:  number    // unix ms
  errorMessage?: string
}

export interface MarketplaceExtension {
  id: string
  name: string
  publisher: string
  description: string
  version: string
  downloadUrl?: string
  icon?: string
}
