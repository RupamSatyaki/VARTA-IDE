/** File system types shared between main and renderer */

export type FileType = 'file' | 'directory' | 'symlink' | 'unknown'

export interface FileStat {
  path:         string
  name:         string
  type:         FileType
  size:         number       // bytes
  createdAt:    number       // unix ms
  modifiedAt:   number       // unix ms
  isReadOnly:   boolean
  extension:    string       // e.g. '.ts', '' for no extension
}

export interface FileTreeNode {
  path:         string
  name:         string
  type:         FileType
  depth:        number
  children?:    FileTreeNode[]  // only present when type === 'directory'
  isExpanded?:  boolean
  isLoading?:   boolean
}

export interface ReadFileResult {
  path:     string
  content:  string
  encoding: BufferEncoding
  stat:     FileStat
}

export interface WriteFileOptions {
  path:       string
  content:    string
  encoding?:  BufferEncoding  // default: 'utf-8'
  createDirs?: boolean        // create parent dirs if missing
}

export interface RenameOptions {
  oldPath: string
  newPath: string
}

export interface CopyOptions {
  sourcePath:      string
  destinationPath: string
  overwrite?:      boolean
}

export interface MoveOptions {
  sourcePath:      string
  destinationPath: string
  overwrite?:      boolean
}

export interface ReadDirOptions {
  path:        string
  recursive?:  boolean
  showHidden?: boolean
}

export type WatchEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'

export interface WatchEvent {
  type:      WatchEventType
  path:      string
  timestamp: number
}

export interface OpenDialogResult {
  cancelled: boolean
  paths:     string[]
}

export interface SaveDialogResult {
  cancelled: boolean
  path:      string | null
}
