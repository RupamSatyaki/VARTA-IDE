import path from 'path'
import os   from 'os'
import fs   from 'fs'

/** Normalize a path to forward slashes (consistent across platforms) */
export function normalizePath(p: string): string {
  return p.split(path.sep).join('/')
}

/** Resolve ~ to the user's home directory */
export function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(1))
  }
  return p
}

/** Return the file extension including the dot, lowercased. e.g. '.ts' */
export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase()
}

/** Return just the filename without directory */
export function getFilename(filePath: string): string {
  return path.basename(filePath)
}

/** Return the directory portion of a path */
export function getDirectory(filePath: string): string {
  return path.dirname(filePath)
}

/** Check if a path is absolute */
export function isAbsolute(p: string): boolean {
  return path.isAbsolute(p)
}

/** Safely join path segments */
export function joinPath(...segments: string[]): string {
  return path.join(...segments)
}

/** Get relative path from base to target */
export function relativePath(base: string, target: string): string {
  return path.relative(base, target)
}

/**
 * Check if a file is likely binary by reading the first 8KB
 * and looking for null bytes (reliable heuristic).
 */
export async function isBinaryFile(filePath: string): Promise<boolean> {
  const SAMPLE_SIZE = 8192
  const buffer = Buffer.alloc(SAMPLE_SIZE)

  let fd: number | null = null
  try {
    fd = fs.openSync(filePath, 'r')
    const bytesRead = fs.readSync(fd, buffer, 0, SAMPLE_SIZE, 0)
    const sample = buffer.slice(0, bytesRead)

    // Null byte is a strong indicator of binary content
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0) { return true }
    }
    return false
  } catch {
    return false
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd) } catch { /* ignore */ }
    }
  }
}

/** Common binary file extensions — fast path before reading bytes */
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
  '.mp3', '.mp4', '.wav', '.ogg', '.flac', '.avi', '.mov',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.db', '.sqlite', '.sqlite3',
  '.class', '.jar', '.pyc', '.pyo',
])

export function hasBinaryExtension(filePath: string): boolean {
  return BINARY_EXTENSIONS.has(getExtension(filePath))
}

/** Get the default clone directory (~/projects or ~/Documents/projects) */
export function getDefaultCloneDir(): string {
  const home = os.homedir()
  const candidates = [
    path.join(home, 'projects'),
    path.join(home, 'Documents', 'projects'),
    path.join(home, 'code'),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(dir)) { return dir }
  }
  return path.join(home, 'projects')
}
