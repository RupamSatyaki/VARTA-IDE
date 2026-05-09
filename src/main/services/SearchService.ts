import fsp  from 'fs/promises'
import { BrowserWindow } from 'electron'
import { SearchChannel } from '../../shared/ipc'
import type {
  SearchQuery, ReplaceQuery,
  SearchResult, ReplaceResult,
  SearchResultFile,
} from '../../shared/types/search.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger }                     from '../utils/logger'
import { ripgrepService }             from './RipgrepService'

const MAX_FILE_BYTES = 1 * 1024 * 1024   // 1 MB — skip larger files
const MAX_RESULTS    = 5000              // hard cap

export class SearchService {
  private mainWindow:   BrowserWindow | null = null

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('SearchService', 'Initialized')
  }

  destroy(): void {
    this.cancel()
    this.mainWindow  = null
    logger.info('SearchService', 'Destroyed')
  }

  cancel(): void {
    ripgrepService.cancel()
  }

  // ── Find in files (Ripgrep Powered) ───────────────────────────────────────

  async findInFiles(
    rootPath:    string,
    query:       SearchQuery,
    webContents: Electron.WebContents,
  ): Promise<SearchResult> {
    const startMs = Date.now()
    const allResults: SearchResultFile[] = []
    let totalMatches = 0
    let filesSearched = 0
    let truncated = false

    // Merge results for the same file (Ripgrep sends one event per line)
    const fileMap = new Map<string, SearchResultFile>()

    try {
      await ripgrepService.search(
        rootPath,
        query,
        (fileResult) => {
          if (truncated) return

          let existing = fileMap.get(fileResult.filePath)
          if (existing) {
            existing.matches.push(...fileResult.matches)
            existing.matchCount += fileResult.matchCount
          } else {
            existing = fileResult
            fileMap.set(fileResult.filePath, existing)
            allResults.push(existing)
          }

          totalMatches += fileResult.matchCount
          if (totalMatches >= (query.maxResults || MAX_RESULTS)) {
            truncated = true
            ripgrepService.cancel()
          }

          // Stream partial results
          webContents.send(SearchChannel.PROGRESS, {
            scannedFiles: ++filesSearched,
            matchedFiles: allResults.length,
            totalMatches,
            currentFile: fileResult.filePath,
          })
        },
        (error) => {
          logger.error('SearchService', 'Ripgrep error', error)
        }
      )
    } catch (e) {
      if (e instanceof Error && e.message.includes('exited with code 1')) {
        // Code 1 just means no matches found, which is fine
      } else {
        throw e
      }
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

  // ── Replace in files (Ripgrep Optimized) ───────────────────────────────────

  async replaceInFiles(rootPath: string, query: ReplaceQuery): Promise<ReplaceResult> {
    const startMs = Date.now()
    
    // Step 1: Use Ripgrep to find files that contain the pattern
    const candidateFiles: string[] = []
    try {
      await ripgrepService.search(
        rootPath,
        { ...query, maxResults: 10000 },
        (res) => {
          if (!candidateFiles.includes(res.filePath)) {
            candidateFiles.push(res.filePath)
          }
        },
        (err) => logger.error('SearchService', 'Replace-Find error', err)
      )
    } catch (e) { /* ignore no matches */ }

    if (candidateFiles.length === 0) {
      return { query, filesModified: 0, totalReplacements: 0, errors: [] }
    }

    // Step 2: Perform replacement only on those files
    let filesModified     = 0
    let totalReplacements = 0
    const errors: ReplaceResult['errors'] = []

    const regex = this.buildRegex(query, true)

    for (const filePath of candidateFiles) {
      try {
        const fullPath = filePath // Ripgrep usually returns absolute or relative to root
        // Ensure path is absolute if it's not
        const absolutePath = rootPath && !filePath.startsWith(rootPath) 
          ? require('path').join(rootPath, filePath) 
          : filePath

        const stat = await fsp.stat(absolutePath)
        if (stat.size > MAX_FILE_BYTES) continue

        const content = await fsp.readFile(absolutePath, 'utf-8')
        let count = 0
        const newContent = content.replace(regex, () => { count++; return query.replaceText })
        
        if (count > 0) {
          await fsp.writeFile(absolutePath, newContent, 'utf-8')
          filesModified++
          totalReplacements += count
        }
      } catch (e) {
        errors.push({ filePath, message: e instanceof Error ? e.message : String(e) })
      }
    }

    logger.info('SearchService', `Replace completed in ${Date.now() - startMs}ms. Modified ${filesModified} files.`)
    return { query, filesModified, totalReplacements, errors }
  }

  private buildRegex(query: SearchQuery | ReplaceQuery, global = false): RegExp {
    let pattern = query.text
    if (!query.isRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (query.isWholeWord) {
      pattern = `\\b${pattern}\\b`
    }
    const flags = [global ? 'g' : '', query.isCaseSensitive ? '' : 'i', 'm'].join('')
    return new RegExp(pattern, flags)
  }
}

export const searchService = new SearchService()
