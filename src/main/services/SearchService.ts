import fsp  from 'fs/promises'
import fs   from 'fs'
import path from 'path'
import { BrowserWindow } from 'electron'
import { SearchChannel } from '../../shared/ipc'
import {
  SearchQuery, ReplaceQuery,
  SearchResult, ReplaceResult,
  SearchResultFile, SearchMatch,
  SearchProgressEvent,
} from '../../shared/types/search.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { hasBinaryExtension }         from '../utils/pathUtils'
import { logger }                     from '../utils/logger'

const MAX_FILE_SIZE   = 5 * 1024 * 1024   // 5 MB — skip larger files
const DEFAULT_MAX     = 1000
const PROGRESS_EVERY  = 50                 // emit progress every N files

export class SearchService {
  private mainWindow:  BrowserWindow | null = null
  private cancelFlag = false

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('SearchService', 'Initialized')
  }

  destroy(): void {
    this.cancelFlag = true
    this.mainWindow = null
    logger.info('SearchService', 'Destroyed')
  }

  cancel(): void {
    this.cancelFlag = true
  }

  // ── Find in files ─────────────────────────────────────────────────────────

  async findInFiles(rootPath: string, query: SearchQuery): Promise<SearchResult> {
    this.cancelFlag = false
    const startMs   = Date.now()
    const maxResults = query.maxResults ?? DEFAULT_MAX

    let regex: RegExp
    try {
      regex = this.buildRegex(query)
    } catch {
      throw new VartaError(VartaErrorCode.SEARCH_INVALID_REGEX, `Invalid regex: ${query.text}`)
    }

    const files = await this.collectFiles(rootPath, query)
    const resultFiles: SearchResultFile[] = []
    let totalMatches = 0
    let truncated    = false
    let scanned      = 0

    for (const filePath of files) {
      if (this.cancelFlag) { break }

      scanned++
      if (scanned % PROGRESS_EVERY === 0) {
        this.pushProgress({
          scannedFiles: scanned,
          matchedFiles: resultFiles.length,
          totalMatches,
          currentFile:  filePath,
        })
      }

      try {
        const stat = await fsp.stat(filePath)
        if (stat.size > MAX_FILE_SIZE) { continue }

        const content = await fsp.readFile(filePath, 'utf-8')
        const matches = this.matchInContent(content, regex)

        if (matches.length > 0) {
          resultFiles.push({ filePath, matches, matchCount: matches.length })
          totalMatches += matches.length

          if (totalMatches >= maxResults) {
            truncated = true
            break
          }
        }
      } catch {
        // Skip unreadable files silently
      }
    }

    return {
      query,
      files:        resultFiles,
      totalMatches,
      totalFiles:   resultFiles.length,
      truncated,
      durationMs:   Date.now() - startMs,
    }
  }

  // ── Replace in files ──────────────────────────────────────────────────────

  async replaceInFiles(rootPath: string, query: ReplaceQuery): Promise<ReplaceResult> {
    this.cancelFlag = false

    let regex: RegExp
    try {
      regex = this.buildRegex(query, true)  // global flag for replace
    } catch {
      throw new VartaError(VartaErrorCode.SEARCH_INVALID_REGEX, `Invalid regex: ${query.text}`)
    }

    const files = await this.collectFiles(rootPath, query)
    let filesModified    = 0
    let totalReplacements = 0
    const errors: ReplaceResult['errors'] = []

    for (const filePath of files) {
      if (this.cancelFlag) { break }

      try {
        const stat = await fsp.stat(filePath)
        if (stat.size > MAX_FILE_SIZE) { continue }

        const content = await fsp.readFile(filePath, 'utf-8')
        let count = 0
        const newContent = content.replace(regex, () => {
          count++
          return query.replaceText
        })

        if (count > 0) {
          await fsp.writeFile(filePath, newContent, 'utf-8')
          filesModified++
          totalReplacements += count
        }
      } catch (e) {
        errors.push({ filePath, message: e instanceof Error ? e.message : String(e) })
      }
    }

    return { query, filesModified, totalReplacements, errors }
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
    const flags = [
      global ? 'g' : 'g',
      query.isCaseSensitive ? '' : 'i',
      'm',
    ].join('')
    return new RegExp(pattern, flags)
  }

  private matchInContent(content: string, regex: RegExp): SearchMatch[] {
    const matches: SearchMatch[] = []
    const lines   = content.split('\n')
    regex.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const offset = match.index
      // Find which line this offset falls on
      let lineStart = 0
      let lineNumber = 1
      for (let i = 0; i < lines.length; i++) {
        const lineEnd = lineStart + lines[i].length + 1  // +1 for \n
        if (offset < lineEnd) {
          lineNumber = i + 1
          matches.push({
            lineNumber,
            column:     offset - lineStart + 1,
            matchText:  match[0],
            lineText:   lines[i],
            matchStart: offset - lineStart,
            matchEnd:   offset - lineStart + match[0].length,
          })
          break
        }
        lineStart = lineEnd
      }

      // Prevent infinite loop on zero-length matches
      if (match[0].length === 0) { regex.lastIndex++ }
    }

    return matches
  }

  private async collectFiles(rootPath: string, query: SearchQuery): Promise<string[]> {
    const includeRe = query.includePattern
      ? this.globToRegex(query.includePattern)
      : null
    const excludeRe = query.excludePattern
      ? this.globToRegex(query.excludePattern)
      : null

    const results: string[] = []
    await this.walkDir(rootPath, rootPath, results, includeRe, excludeRe)
    return results
  }

  private async walkDir(
    rootPath: string,
    dirPath:  string,
    results:  string[],
    includeRe: RegExp | null,
    excludeRe: RegExp | null,
  ): Promise<void> {
    let entries: fs.Dirent[]
    try {
      entries = await fsp.readdir(dirPath, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (this.cancelFlag) { return }

      const fullPath = path.join(dirPath, entry.name)
      const rel      = path.relative(rootPath, fullPath).replace(/\\/g, '/')

      // Always skip these
      if (
        entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'out' ||
        entry.name === 'build'
      ) { continue }

      if (excludeRe && excludeRe.test(rel)) { continue }

      if (entry.isDirectory()) {
        await this.walkDir(rootPath, fullPath, results, includeRe, excludeRe)
      } else if (entry.isFile()) {
        if (hasBinaryExtension(fullPath)) { continue }
        if (includeRe && !includeRe.test(rel)) { continue }
        results.push(fullPath)
      }
    }
  }

  /** Very basic glob → regex (supports * and **) */
  private globToRegex(glob: string): RegExp {
    const escaped = glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '§§')
      .replace(/\*/g, '[^/]*')
      .replace(/§§/g, '.*')
    return new RegExp(escaped)
  }

  private pushProgress(event: SearchProgressEvent): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
    this.mainWindow.webContents.send(SearchChannel.PROGRESS, event)
  }
}

export const searchService = new SearchService()
