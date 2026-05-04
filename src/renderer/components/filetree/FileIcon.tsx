import React from 'react'
import { cn } from '../../utils/cn'

export interface FileIconProps {
  filename: string
  isFolder?: boolean
  isOpen?: boolean
  size?: number
  className?: string
}

interface IconDef {
  color: string
  label: string
  char?: string
}

const EXT_MAP: Record<string, IconDef> = {
  // TypeScript
  '.ts':    { color: '#3178c6', label: 'TypeScript',       char: 'TS' },
  '.tsx':   { color: '#3178c6', label: 'TypeScript React', char: 'TX' },
  '.d.ts':  { color: '#3178c6', label: 'TypeScript Def',   char: 'DT' },
  // JavaScript
  '.js':    { color: '#f7df1e', label: 'JavaScript',       char: 'JS' },
  '.jsx':   { color: '#f7df1e', label: 'JavaScript React', char: 'JX' },
  '.mjs':   { color: '#f7df1e', label: 'ES Module',        char: 'MJ' },
  '.cjs':   { color: '#f7df1e', label: 'CommonJS',         char: 'CJ' },
  // Python
  '.py':    { color: '#4ec9b0', label: 'Python',           char: 'PY' },
  '.pyi':   { color: '#4ec9b0', label: 'Python Stub',      char: 'PI' },
  // Rust
  '.rs':    { color: '#ce6f2d', label: 'Rust',             char: 'RS' },
  // Go
  '.go':    { color: '#00acd7', label: 'Go',               char: 'GO' },
  // Web
  '.html':  { color: '#e34c26', label: 'HTML',             char: 'HT' },
  '.htm':   { color: '#e34c26', label: 'HTML',             char: 'HT' },
  '.css':   { color: '#563d7c', label: 'CSS',              char: 'CS' },
  '.scss':  { color: '#c6538c', label: 'SCSS',             char: 'SC' },
  '.less':  { color: '#1d365d', label: 'Less',             char: 'LE' },
  '.svg':   { color: '#ff9900', label: 'SVG',              char: 'SV' },
  // Data
  '.json':  { color: '#f7df1e', label: 'JSON',             char: '{}' },
  '.jsonc': { color: '#f7df1e', label: 'JSONC',            char: '{}' },
  '.yaml':  { color: '#cb171e', label: 'YAML',             char: 'YM' },
  '.yml':   { color: '#cb171e', label: 'YAML',             char: 'YM' },
  '.toml':  { color: '#9c4221', label: 'TOML',             char: 'TM' },
  '.xml':   { color: '#e37933', label: 'XML',              char: 'XM' },
  // Docs
  '.md':    { color: '#d4d4d4', label: 'Markdown',         char: 'MD' },
  '.mdx':   { color: '#d4d4d4', label: 'MDX',              char: 'MX' },
  '.txt':   { color: '#d4d4d4', label: 'Text',             char: 'TX' },
  '.pdf':   { color: '#f44747', label: 'PDF',              char: 'PD' },
  // Config
  '.env':   { color: '#4ec9b0', label: 'Env',              char: 'EV' },
  '.sh':    { color: '#4ec9b0', label: 'Shell',            char: 'SH' },
  '.bash':  { color: '#4ec9b0', label: 'Bash',             char: 'BA' },
  '.zsh':   { color: '#4ec9b0', label: 'Zsh',              char: 'ZS' },
  '.ps1':   { color: '#012456', label: 'PowerShell',       char: 'PS' },
  // Systems
  '.c':     { color: '#a8b9cc', label: 'C',                char: 'C ' },
  '.cpp':   { color: '#00599c', label: 'C++',              char: 'C+' },
  '.h':     { color: '#a8b9cc', label: 'C Header',         char: 'CH' },
  '.hpp':   { color: '#00599c', label: 'C++ Header',       char: 'HP' },
  '.cs':    { color: '#9b4f96', label: 'C#',               char: 'C#' },
  '.java':  { color: '#b07219', label: 'Java',             char: 'JV' },
  '.kt':    { color: '#7f52ff', label: 'Kotlin',           char: 'KT' },
  '.swift': { color: '#f05138', label: 'Swift',            char: 'SW' },
  '.rb':    { color: '#cc342d', label: 'Ruby',             char: 'RB' },
  '.php':   { color: '#4f5d95', label: 'PHP',              char: 'PH' },
  '.dart':  { color: '#00b4ab', label: 'Dart',             char: 'DA' },
  // Git
  '.gitignore':    { color: '#f44747', label: 'Git Ignore', char: 'GI' },
  '.gitattributes':{ color: '#f44747', label: 'Git Attrs',  char: 'GA' },
  // Docker
  'dockerfile':    { color: '#2496ed', label: 'Dockerfile', char: 'DK' },
  '.dockerignore': { color: '#2496ed', label: 'Docker Ignore', char: 'DI' },
  // SQL
  '.sql':   { color: '#e38c00', label: 'SQL',              char: 'SQ' },
  '.graphql':{ color: '#e10098', label: 'GraphQL',         char: 'GQ' },
}

const FILENAME_MAP: Record<string, IconDef> = {
  'package.json':    { color: '#cb3837', label: 'npm',         char: 'NP' },
  'package-lock.json': { color: '#cb3837', label: 'npm lock', char: 'NL' },
  'tsconfig.json':   { color: '#3178c6', label: 'TSConfig',    char: 'TC' },
  'vite.config.ts':  { color: '#646cff', label: 'Vite',        char: 'VI' },
  'vite.config.js':  { color: '#646cff', label: 'Vite',        char: 'VI' },
  '.eslintrc':       { color: '#4b32c3', label: 'ESLint',      char: 'ES' },
  '.eslintrc.cjs':   { color: '#4b32c3', label: 'ESLint',      char: 'ES' },
  '.prettierrc':     { color: '#f7b93e', label: 'Prettier',    char: 'PR' },
  'tailwind.config.ts': { color: '#38bdf8', label: 'Tailwind', char: 'TW' },
  'tailwind.config.js': { color: '#38bdf8', label: 'Tailwind', char: 'TW' },
  'dockerfile':      { color: '#2496ed', label: 'Dockerfile',  char: 'DK' },
  'Dockerfile':      { color: '#2496ed', label: 'Dockerfile',  char: 'DK' },
  '.gitignore':      { color: '#f44747', label: 'Git Ignore',  char: 'GI' },
  'readme.md':       { color: '#4ec9b0', label: 'Readme',      char: 'RM' },
  'README.md':       { color: '#4ec9b0', label: 'Readme',      char: 'RM' },
}

function getIconDef(filename: string): IconDef {
  const lower = filename.toLowerCase()

  // Exact filename match first
  if (FILENAME_MAP[filename]) { return FILENAME_MAP[filename] }
  if (FILENAME_MAP[lower])    { return FILENAME_MAP[lower] }

  // Extension match
  const dotIdx = filename.lastIndexOf('.')
  if (dotIdx >= 0) {
    const ext = filename.slice(dotIdx).toLowerCase()
    if (EXT_MAP[ext]) { return EXT_MAP[ext] }
  }

  return { color: '#6e6e6e', label: 'File', char: '  ' }
}

export function FileIcon({ filename, isFolder = false, isOpen = false, size = 16, className }: FileIconProps) {
  if (isFolder) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="currentColor"
        className={cn('shrink-0', isOpen ? 'text-[#dcb67a]' : 'text-[#c09553]', className)}
        aria-hidden="true"
      >
        {isOpen
          ? <path d="M1.5 3A1.5 1.5 0 000 4.5v8A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H7.621a1.5 1.5 0 01-1.06-.44L5.5 3H1.5z"/>
          : <path d="M.5 3l1-1h4l1 1 1-1h7l1 1v9l-1 1h-13l-1-1V3zm1 9h12V4H9L8 3H2L1 4v8z"/>
        }
      </svg>
    )
  }

  const def = getIconDef(filename)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {/* File shape */}
      <path
        d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"
        fill={def.color}
        opacity="0.9"
      />
      {/* 2-char label inside file */}
      {def.char && (
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fontSize="4"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#1a1a1a"
          opacity="0.85"
        >
          {def.char.trim().slice(0, 2)}
        </text>
      )}
    </svg>
  )
}
