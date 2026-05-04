/** Git types shared between main and renderer */

export type GitFileStatus =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'ignored'
  | 'conflicted'
  | 'unmodified'

export interface GitFileChange {
  path:       string
  oldPath?:   string        // for renames
  status:     GitFileStatus
  staged:     boolean
  additions?: number
  deletions?: number
}

export interface GitStatus {
  isRepo:         boolean
  branch:         string | null
  tracking?:      string        // remote tracking branch
  ahead:          number
  behind:         number
  staged:         GitFileChange[]
  unstaged:       GitFileChange[]
  untracked:      GitFileChange[]
  conflicted:     GitFileChange[]
  isClean:        boolean
  stashCount:     number
}

export interface GitBranch {
  name:       string
  isCurrent:  boolean
  isRemote:   boolean
  tracking?:  string
  lastCommit?: string
}

export interface GitCommit {
  hash:       string
  shortHash:  string
  message:    string
  author:     string
  email:      string
  date:       number        // unix ms
  refs?:      string[]
}

export interface GitDiff {
  filePath:   string
  oldContent: string | null
  newContent: string | null
  hunks:      GitDiffHunk[]
  isBinary:   boolean
}

export interface GitDiffHunk {
  oldStart:   number
  oldLines:   number
  newStart:   number
  newLines:   number
  lines:      GitDiffLine[]
  header:     string
}

export interface GitDiffLine {
  type:       'context' | 'add' | 'remove'
  content:    string
  oldLineNo?: number
  newLineNo?: number
}

export interface CommitOptions {
  message:    string
  amend?:     boolean
  signOff?:   boolean
}

export interface PushOptions {
  remote?:    string        // default: 'origin'
  branch?:    string        // default: current branch
  force?:     boolean
  setUpstream?: boolean
}

export interface PullOptions {
  remote?:    string
  branch?:    string
  rebase?:    boolean
}

export interface CloneOptions {
  url:        string
  destination: string
  depth?:     number
  branch?:    string
}

export interface StashEntry {
  index:      number
  message:    string
  date:       number
}
