/** Language detection constants — maps file extensions to Monaco language IDs */

export interface LanguageDefinition {
  id:           string
  name:         string
  extensions:   string[]
  filenames?:   string[]
  mimetypes?:   string[]
  icon?:        string    // icon name from file icon theme
}

export const LANGUAGE_DEFINITIONS: LanguageDefinition[] = [
  { id: 'typescript',      name: 'TypeScript',       extensions: ['.ts'],          icon: 'typescript' },
  { id: 'typescriptreact', name: 'TypeScript React',  extensions: ['.tsx'],         icon: 'react_ts' },
  { id: 'javascript',      name: 'JavaScript',       extensions: ['.js', '.mjs', '.cjs'], icon: 'javascript' },
  { id: 'javascriptreact', name: 'JavaScript React', extensions: ['.jsx'],         icon: 'react' },
  { id: 'html',            name: 'HTML',             extensions: ['.html', '.htm', '.xhtml'], icon: 'html' },
  { id: 'css',             name: 'CSS',              extensions: ['.css'],         icon: 'css' },
  { id: 'scss',            name: 'SCSS',             extensions: ['.scss'],        icon: 'scss' },
  { id: 'less',            name: 'Less',             extensions: ['.less'],        icon: 'less' },
  { id: 'json',            name: 'JSON',             extensions: ['.json'],        icon: 'json' },
  { id: 'jsonc',           name: 'JSON with Comments', extensions: ['.jsonc'],     icon: 'json' },
  { id: 'yaml',            name: 'YAML',             extensions: ['.yml', '.yaml'], icon: 'yaml' },
  { id: 'toml',            name: 'TOML',             extensions: ['.toml'],        icon: 'toml' },
  { id: 'markdown',        name: 'Markdown',         extensions: ['.md', '.markdown'], icon: 'markdown' },
  { id: 'mdx',             name: 'MDX',              extensions: ['.mdx'],         icon: 'mdx' },
  { id: 'python',          name: 'Python',           extensions: ['.py', '.pyw', '.pyi'], icon: 'python' },
  { id: 'rust',            name: 'Rust',             extensions: ['.rs'],          icon: 'rust' },
  { id: 'go',              name: 'Go',               extensions: ['.go'],          icon: 'go' },
  { id: 'java',            name: 'Java',             extensions: ['.java'],        icon: 'java' },
  { id: 'c',               name: 'C',                extensions: ['.c', '.h'],     icon: 'c' },
  { id: 'cpp',             name: 'C++',              extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'], icon: 'cpp' },
  { id: 'csharp',          name: 'C#',               extensions: ['.cs'],          icon: 'csharp' },
  { id: 'ruby',            name: 'Ruby',             extensions: ['.rb', '.rake'], icon: 'ruby' },
  { id: 'php',             name: 'PHP',              extensions: ['.php'],         icon: 'php' },
  { id: 'swift',           name: 'Swift',            extensions: ['.swift'],       icon: 'swift' },
  { id: 'kotlin',          name: 'Kotlin',           extensions: ['.kt', '.kts'],  icon: 'kotlin' },
  { id: 'dart',            name: 'Dart',             extensions: ['.dart'],        icon: 'dart' },
  { id: 'shell',           name: 'Shell Script',     extensions: ['.sh', '.bash', '.zsh'], filenames: ['.bashrc', '.zshrc', '.profile'], icon: 'shell' },
  { id: 'powershell',      name: 'PowerShell',       extensions: ['.ps1', '.psm1', '.psd1'], icon: 'powershell' },
  { id: 'dockerfile',      name: 'Dockerfile',       extensions: [],               filenames: ['Dockerfile', 'dockerfile'], icon: 'docker' },
  { id: 'sql',             name: 'SQL',              extensions: ['.sql'],         icon: 'sql' },
  { id: 'graphql',         name: 'GraphQL',          extensions: ['.graphql', '.gql'], icon: 'graphql' },
  { id: 'xml',             name: 'XML',              extensions: ['.xml', '.svg', '.xsl', '.xslt'], icon: 'xml' },
  { id: 'ini',             name: 'INI',              extensions: ['.ini', '.cfg', '.conf'], icon: 'settings' },
  { id: 'plaintext',       name: 'Plain Text',       extensions: ['.txt', '.text'], icon: 'text' },
]

/** Build a fast lookup map: extension → language id */
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {}
export const FILENAME_TO_LANGUAGE: Record<string, string> = {}

for (const lang of LANGUAGE_DEFINITIONS) {
  for (const ext of lang.extensions) {
    EXTENSION_TO_LANGUAGE[ext] = lang.id
  }
  for (const filename of lang.filenames ?? []) {
    FILENAME_TO_LANGUAGE[filename] = lang.id
  }
}

/**
 * Detect Monaco language ID from a file path.
 * Falls back to 'plaintext' if unknown.
 */
export function detectLanguage(filePath: string): string {
  const lower = filePath.toLowerCase()
  const filename = lower.split('/').pop() ?? lower
  const dotIndex = filename.lastIndexOf('.')
  const ext = dotIndex >= 0 ? filename.slice(dotIndex) : ''

  return (
    FILENAME_TO_LANGUAGE[filename] ??
    EXTENSION_TO_LANGUAGE[ext] ??
    'plaintext'
  )
}
