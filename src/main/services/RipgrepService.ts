import { spawn, ChildProcess } from 'child_process'
import { getRipgrepPath } from '../utils/pathUtils'
import { logger } from '../utils/logger'
import type { SearchQuery, SearchMatch, SearchResultFile } from '../../shared/types/search.types'

export interface RipgrepMatchEvent {
  type: 'match'
  data: {
    path: { text: string }
    lines: { text: string }
    line_number: number
    absolute_offset: number
    submatches: Array<{
      match: { text: string }
      start: number
      end: number
    }>
  }
}

export interface RipgrepSummaryEvent {
  type: 'summary'
  data: {
    stats: {
      matched_lines: number
      matches: number
      files_with_matches: number
      searched_extensions: Record<string, number>
    }
  }
}

export type RipgrepEvent = RipgrepMatchEvent | RipgrepSummaryEvent

export class RipgrepService {
  private currentProcess: ChildProcess | null = null

  async search(
    rootPath: string,
    query: SearchQuery,
    onMatch: (fileResult: SearchResultFile) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const rgPath = getRipgrepPath()
    const args = this.buildArgs(query, rootPath)

    const fs = require('fs')
    if (!fs.existsSync(rgPath)) {
      const errorMsg = `Ripgrep binary not found at: ${rgPath}`
      logger.error('Ripgrep', errorMsg)
      onError(errorMsg)
      throw new Error(errorMsg)
    }

    logger.info('Ripgrep', `Spawning: ${rgPath} ${args.join(' ')}`)

    return new Promise((resolve, reject) => {
      try {
        this.currentProcess = spawn(rgPath, args, { cwd: rootPath })

        this.currentProcess.on('error', (err) => {
          logger.error('Ripgrep', `Spawn error: ${err.message}`, err)
          this.currentProcess = null
          onError(err.message)
          reject(err)
        })

        let remainder = ''
        // ... rest of the logic ...

        this.currentProcess.stdout?.on('data', (data) => {
          const chunk = remainder + data.toString()
          const lines = chunk.split('\n')
          remainder = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const event: RipgrepEvent = JSON.parse(line)
              if (event.type === 'match') {
                const fileResult = this.parseMatch(event)
                onMatch(fileResult)
              }
            } catch (e) {
              logger.error('Ripgrep', 'Failed to parse JSON line', e)
            }
          }
        })

        this.currentProcess.stderr?.on('data', (data) => {
          const err = data.toString()
          // Ignore some common warnings
          if (!err.includes('Permission denied') && !err.includes('The system cannot find the path specified')) {
            logger.warn('Ripgrep', err)
          }
        })

        this.currentProcess.on('close', (code, signal) => {
          this.currentProcess = null
          // code is null if the process was killed (e.g. by our cancel() call)
          if (code === 0 || code === 1 || code === null) {
            resolve()
          } else {
            reject(new Error(`Ripgrep exited with code ${code} (signal: ${signal})`))
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  cancel(): void {
    if (this.currentProcess) {
      this.currentProcess.kill()
      this.currentProcess = null
    }
  }

  private buildArgs(query: SearchQuery, rootPath: string): string[] {
    const args = [
      '--json',
      '--column',
      '--line-number',
      '--heading',
      '--color', 'never',
      '--block-buffered',
    ]

    if (!query.isCaseSensitive) args.push('--ignore-case')
    if (query.isWholeWord) args.push('--word-regexp')
    if (!query.isRegex) args.push('--fixed-strings')

    // Max results per file? Ripgrep doesn't have a direct equivalent but we can limit total
    // or handle it in the service. Let's use --max-count if we wanted per-file.
    
    // Include patterns
    if (query.includePattern) {
      const patterns = query.includePattern.split(',').map(p => p.trim()).filter(Boolean)
      patterns.forEach(p => {
        args.push('--glob', p)
      })
    }

    // Exclude patterns
    if (query.excludePattern) {
      const patterns = query.excludePattern.split(',').map(p => p.trim()).filter(Boolean)
      patterns.forEach(p => {
        args.push('--glob', `!${p}`)
      })
    }

    // Default ignores are handled by Ripgrep via .gitignore
    // But we can add some defaults if needed
    const defaultExcludes = ['node_modules', '.git', 'dist', 'build', 'out']
    defaultExcludes.forEach(p => {
      args.push('--glob', `!${p}`)
    })

    args.push('--', query.text, rootPath)

    return args
  }

  private parseMatch(event: RipgrepMatchEvent): SearchResultFile {
    const filePath = event.data.path.text
    const lineText = event.data.lines.text.replace(/\r?\n$/, '')
    const lineNumber = event.data.line_number

    const matches: SearchMatch[] = event.data.submatches.map(m => ({
      lineNumber,
      column: m.start + 1,
      matchText: m.match.text,
      lineText,
      matchStart: m.start,
      matchEnd: m.end
    }))

    return {
      filePath,
      matches,
      matchCount: matches.length
    }
  }
}

export const ripgrepService = new RipgrepService()
