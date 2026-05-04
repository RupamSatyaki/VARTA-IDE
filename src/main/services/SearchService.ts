import fsp  from 'fs/promises'
import path from 'path'
import { BrowserWindow } from 'electron'
import { SearchChannel } from '../../shared/ipc'
import type {
  SearchQuery, ReplaceQuery,
  SearchResult, ReplaceResult,
  SearchResultFile, SearchMatch,
} from '../../shared/types/search.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { hasBinaryExtension }         from '../utils/pathUtils'
import { logger }                     from '../utils/logger'

const MAX_FILE_BYTES = 1 * 1024 * 1024   // 1 MB — skip larger files
const BATCH_SIZE     = 20                // files processed concurrently
const MAX_RESULTS    = 1000              // hard cap

// FIX 1: Directories always skipped by name — checked before readdir
const DEFAULT_EXCLUDE = new Set([
  'node_modules', '.git', 'dist', 'build', 'out',
  '.next', '.nuxt', 'coverage', '.cache', '.vite',
  '__pycache__', '.venv', 'venv', 'target', 'vendor',
  '.turbo', '.parcel-cache', '.svelte-kit', '.output',
  'tmp', 'temp', '.tmp', 'logs',
])

export class SearchService {
  private mainWindow:   BrowserWindow | null = null
  private isCancelled = false

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('SearchService', 'Initialized')
  }

  destroy(): void {
    this.isCancelled = true
    this.mainWindow  = null
    logger.info('SearchService', 'Destroyed')
  }

  // FIX 4: Cancel support
  cancel(): void {
    this.isCancelled = true
  }

  // ── Find in files ─────────────────────────────────────────────────────────

  async findInFiles(
    rootPath:    string,
    query:       SearchQuery,
    webContents: Electron.WebContents,
  ): Promise<SearchResult> {
    // FIX 4: Reset cancel flag before new search
    this.isCancelled = false
    const startMs = Date.now()

    // FIX 3: Build regex ONCE outside loop
    let regex: RegExp
    try {
      regex = this.buildRegex(query)
    } catch {
      throw new VartaError(VartaErrorCode.SEARCH_INVALID_REGEX, `Invalid regex: ${query.text}`)
    }

    // Build exclude set: defaults + user patterns
    const userExcludes = (query.excludePattern ?? '')
      .split(',').map((s) => s.trim()).filter(Boolean)
    const excludeSet = new Set([...DEFAULT_EXCLUDE, ...userExcludes])

    // Include pattern regex (optional)
    const includeRe = query.includePattern?.trim()
      ? this.globToRegex(query.includePattern)
      : null

    const allResults: SearchResultFile[] = []
    let totalMatches = 0
    let filesSearched = 0
    let truncated = false

    const fileBuffer: string[] = []

    // FIX 2: Process a batch of files concurrently
    const processBatch = async (files: string[]) => {
      await Promise.all(files.map(async (filePath) => {
        if (this.isCancelled || truncated) { return }
        try {
          const stat = await fsp.stat(filePath)
          if (stat.size > MAX_FILE_BYTES) { return }

          const content = await fsp.readFile(filePath, 'utf-8')
          const matches = this.findMatches(content, regex)

          if (matches.length > 0) {
            allResults.push({ filePath, matches, matchCount: matches.length })
            totalMatches += matches.length

            if (totalMatches >= MAX_RESULTS) { truncated = true }

            // FIX 6: Stream partial results to renderer immediately
            webContents.send(SearchChannel.PROGRESS, {
              scannedFiles: filesSearched,
              matchedFiles: allResults.length,
              totalMatches,
              currentFile:  path.relative(rootPath, filePath),
            })
          }
        } catch {
          // Skip unreadable / binary files silently
        }
        filesSearched++
      }))
    }

    // FIX 1: Async generator walk — skips excluded dirs before readdir
    for await (const filePath of this.walkDir(rootPath, excludeSet, includeRe)) {
      if (this.isCancelled || truncated) { break }

      fileBuffer.push(filePath)

      if (fileBuffer.length >= BATCH_SIZE) {
        await processBatch(fileBuffer.splice(0, BATCH_SIZE))

        // FIX 2: Yield to event loop between batches — prevents main thread block
        await new Promise<void>((resolve) => setImmediate(resolve))
      }
    }

    // Process remaining files
    if (fileBuffer.length > 0 && !this.isCancelled) {
      await processBatch(fileBuffer)
    }

    return {
      query,
      files:        allResults,
      totalMatches,
      totalFiles:   allResults.length,
      truncated,
      durationMs:   Date.now() - startMs,
    }
  }

  // ── Replace in files ──────────────────────────────────────────────────────

  async replaceInFiles(rootPath: string, query: ReplaceQuery): Promise<ReplaceResult> {
    this.isCancelled = false

    let regex: RegExp
    try {
      regex = this.buildRegex(query, true)
    } catch {
      throw new VartaError(VartaErrorCode.SEARCH_INVALID_REGEX, `Invalid regex: ${query.text}`)
    }

    const userExcludes = (query.excludePattern ?? '')
      .split(',').map((s) => s.trim()).filter(Boolean)
    const excludeSet = new Set([...DEFAULT_EXCLUDE, ...userExcludes])
    const includeRe  = query.includePattern?.trim()
      ? this.globToRegex(query.includePattern)
      : null

    let filesModified     = 0
    let totalReplacements = 0
    const errors: ReplaceResult['errors'] = []
    const fileBuffer: string[] = []

    const processBatch = async (files: string[]) => {
      await Promise.all(files.map(async (filePath) => {
        if (this.isCancelled) { return }
        try {
          const stat = await fsp.stat(filePath)
          if (stat.size > MAX_FILE_BYTES) { return }
          const content = await fsp.readFile(filePath, 'utf-8')
          let count = 0
          const newContent = content.replace(regex, () => { count++; return query.replaceText })
          if (count > 0) {
            await fsp.writeFile(filePath, newContent, 'utf-8')
            filesModified++
            totalReplacements += count
          }
        } catch (e) {
          errors.push({ filePath, message: e instanceof Error ? e.message : String(e) })
        }
      }))
    }

    for await (const filePath of this.walkDir(rootPath, excludeSet, includeRe)) {
      if (this.isCancelled) { break }
      fileBuffer.push(filePath)
      if (fileBuffer.length >= BATCH_SIZE) {
        await processBatch(fileBuffer.splice(0, BATCH_SIZE))
        await new Promise<void>((resolve) => setImmediate(resolve))
      }
    }
    if (fileBuffer.length > 0) { await processBatch(fileBuffer) }

    return { query, filesModified, totalReplacements, errors }
  }

  // ── FIX 1: Async generator directory walk ─────────────────────────────────
  // Yields file paths one by one — never blocks, skips excluded dirs by name

  private async *walkDir(
    dir:       string,
    exclude:   Set<string>,
    includeRe: RegExp | null,
    rootPath?: string,
  ): AsyncGenerator<string> {
    const root = rootPath ?? dir
    let entries
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (this.isCancelled) { return }

      // Skip hidden files/dirs and excluded dirs immediately
      if (entry.name.startsWith('.') && entry.name !== '.env') { continue }
      if (entry.isDirectory()) {
        if (exclude.has(entry.name)) { continue }
        yield* this.walkDir(path.join(dir, entry.name), exclude, includeRe, root)
      } else if (entry.isFile()) {
        const fullPath = path.join(dir, entry.name)
        if (hasBinaryExtension(fullPath)) { continue }
        if (includeRe) {
          const rel = path.relative(root, fullPath).replace(/\\/g, '/')
          if (!includeRe.test(rel)) { continue }
        }
        yield fullPath
      }
    }
  }

  // ── FIX 3: Match per line — regex reset per line, no offset math ──────────

  private findMatches(content: string, regex: RegExp): SearchMatch[] {
    const matches: SearchMatch[] = []
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // FIX 3: Reset lastIndex for each line
      regex.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          lineNumber: i + 1,
          column:     match.index + 1,
          matchText:  match[0],
          lineText:   line,
          matchStart: match.index,
          matchEnd:   match.index + match[0].length,
        })
        if (match[0].length === 0) { regex.lastIndex++ }
      }
    }

    return matches
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildRegex(query: SearchQuery, global = false): RegExp {
    let pattern = query.text
    if (!query.isRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (query.isWholeWord) {
      pattern = `\\b${pattern}\\b`
    }
    const flags = ['g', query.isCaseSensitive ? '' : 'i', 'm'].join('')
    return new RegExp(pattern, flags)
  }

  private globToRegex(glob: string): RegExp {
    const patterns = glob.split(',').map((g) => g.trim()).filter(Boolean)
    const parts = patterns.map((g) =>
      g.replace(/[.+^${}()|[\]\\]/g, '\\$&')
       .replace(/\*\*/g, '\x00').replace(/\*/g, '[^/]*').replace(/\x00/g, '.*')
    )
    return new RegExp(parts.join('|'))
  }
}

export const searchService = new SearchService()
