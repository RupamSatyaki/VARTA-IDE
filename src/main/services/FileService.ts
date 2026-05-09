import fs   from 'fs'
import fsp  from 'fs/promises'
import path from 'path'
import { Readable } from 'stream'
import {
  FileStat, FileTreeNode, ReadFileResult,
  WriteFileOptions, RenameOptions, CopyOptions,
  MoveOptions, ReadDirOptions, FileType,
} from '../../shared/types/file.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { isBinaryFile, hasBinaryExtension, getExtension } from '../utils/pathUtils'
import { logger } from '../utils/logger'

/** Files larger than this are streamed / warned as large */
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024  // 10 MB

export class FileService {
  init(): void {
    logger.info('FileService', 'Initialized')
  }

  destroy(): void {
    logger.info('FileService', 'Destroyed')
  }

  // ── Stat ──────────────────────────────────────────────────────────────────

  async stat(filePath: string): Promise<FileStat> {
    try {
      const s = await fsp.stat(filePath)
      const name = path.basename(filePath)
      const ext  = getExtension(filePath)

      let type: FileType = 'unknown'
      if (s.isFile())            { type = 'file' }
      else if (s.isDirectory())  { type = 'directory' }
      else if (s.isSymbolicLink()) { type = 'symlink' }

      return {
        path:       filePath,
        name,
        type,
        size:       s.size,
        createdAt:  s.birthtimeMs,
        modifiedAt: s.mtimeMs,
        isReadOnly: !(s.mode & 0o200),
        extension:  ext,
      }
    } catch (e) {
      throw VartaError.from(e, VartaErrorCode.FILE_NOT_FOUND)
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fsp.access(filePath)
      return true
    } catch {
      return false
    }
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async readFile(filePath: string): Promise<ReadFileResult> {
    try {
      const statResult = await this.stat(filePath)

      // Fast-path binary detection via extension
      if (hasBinaryExtension(filePath)) {
        return this.buildBinaryResult(filePath, statResult)
      }

      // For large files, check binary before reading entire content
      if (statResult.size > LARGE_FILE_THRESHOLD) {
        const binary = await isBinaryFile(filePath)
        if (binary) {
          return this.buildBinaryResult(filePath, statResult)
        }
        // Large text file — read anyway but log a warning
        logger.warn('FileService', `Large file opened: ${filePath} (${statResult.size} bytes)`)
      }

      // Check binary by content for unknown extensions
      const binary = await isBinaryFile(filePath)
      if (binary) {
        return this.buildBinaryResult(filePath, statResult)
      }

      const content = await fsp.readFile(filePath, 'utf-8')
      return {
        path:     filePath,
        content,
        encoding: 'utf-8',
        stat:     statResult,
      }
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      throw new VartaError(VartaErrorCode.FILE_READ_FAILED, `Failed to read: ${filePath}`, e)
    }
  }

  /** Stream a large file as chunks — returns an async generator */
  async *readFileStream(filePath: string, chunkSize = 65536): AsyncGenerator<string> {
    try {
      const stream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: chunkSize })
      for await (const chunk of stream as Readable) {
        yield chunk as string
      }
    } catch (e) {
      throw new VartaError(VartaErrorCode.FILE_READ_FAILED, `Stream read failed: ${filePath}`, e)
    }
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  async writeFile(options: WriteFileOptions): Promise<void> {
    const { path: filePath, content, encoding = 'utf-8', createDirs = false } = options
    try {
      if (createDirs) {
        await fsp.mkdir(path.dirname(filePath), { recursive: true })
      }
      await fsp.writeFile(filePath, content, { encoding })
    } catch (e) {
      throw new VartaError(VartaErrorCode.FILE_WRITE_FAILED, `Failed to write: ${filePath}`, e)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fsp.unlink(filePath)
    } catch (e) {
      throw VartaError.from(e, VartaErrorCode.FILE_DELETE_FAILED)
    }
  }

  // ── Rename ────────────────────────────────────────────────────────────────

  async renameFile(options: RenameOptions): Promise<void> {
    try {
      await fsp.rename(options.oldPath, options.newPath)
    } catch (e) {
      throw new VartaError(VartaErrorCode.FILE_RENAME_FAILED, `Rename failed: ${options.oldPath} → ${options.newPath}`, e)
    }
  }

  // ── Copy ──────────────────────────────────────────────────────────────────

  async copyFile(options: CopyOptions): Promise<void> {
    const { sourcePath, destinationPath, overwrite = false } = options
    try {
      if (!overwrite && await this.exists(destinationPath)) {
        throw new VartaError(VartaErrorCode.FILE_ALREADY_EXISTS, `Destination already exists: ${destinationPath}`)
      }
      await fsp.copyFile(sourcePath, destinationPath)
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      throw new VartaError(VartaErrorCode.FILE_COPY_FAILED, `Copy failed: ${sourcePath} → ${destinationPath}`, e)
    }
  }

  // ── Move ──────────────────────────────────────────────────────────────────

  async moveFile(options: MoveOptions): Promise<void> {
    const { sourcePath, destinationPath, overwrite = false } = options
    try {
      if (!overwrite && await this.exists(destinationPath)) {
        throw new VartaError(VartaErrorCode.FILE_ALREADY_EXISTS, `Destination already exists: ${destinationPath}`)
      }
      await fsp.rename(sourcePath, destinationPath)
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      // Cross-device rename fails — fall back to copy+delete
      try {
        await fsp.copyFile(sourcePath, destinationPath)
        await fsp.unlink(sourcePath)
      } catch (e2) {
        throw new VartaError(VartaErrorCode.FILE_MOVE_FAILED, `Move failed: ${sourcePath} → ${destinationPath}`, e2)
      }
    }
  }

  // ── Directory ─────────────────────────────────────────────────────────────

  async readDir(options: ReadDirOptions): Promise<FileTreeNode[]> {
    const { path: dirPath, recursive = false, showHidden = false } = options
    try {
      return await this.readDirRecursive(dirPath, 0, recursive, showHidden)
    } catch (e) {
      if (e instanceof VartaError) { throw e }
      throw new VartaError(VartaErrorCode.DIR_READ_FAILED, `Failed to read directory: ${dirPath}`, e)
    }
  }

  private async readDirRecursive(
    dirPath: string,
    depth: number,
    recursive: boolean,
    showHidden: boolean,
  ): Promise<FileTreeNode[]> {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true })
    const nodes: FileTreeNode[] = []

    for (const entry of entries) {
      // Always hide .git directory — too large and not useful in file tree
      if (entry.name === '.git') { continue }
      if (!showHidden && entry.name.startsWith('.')) { continue }

      const fullPath = path.join(dirPath, entry.name)
      let type: FileType = 'unknown'
      if (entry.isFile())            { type = 'file' }
      else if (entry.isDirectory())  { type = 'directory' }
      else if (entry.isSymbolicLink()) { type = 'symlink' }

      const node: FileTreeNode = {
        path:  fullPath,
        name:  entry.name,
        type,
        depth,
      }

      if (type === 'directory' && recursive) {
        try {
          node.children = await this.readDirRecursive(fullPath, depth + 1, recursive, showHidden)
        } catch {
          node.children = []  // permission denied etc — show empty
        }
      }

      nodes.push(node)
    }

    // Directories first, then files, both alphabetically
    return nodes.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') { return -1 }
      if (a.type !== 'directory' && b.type === 'directory') { return 1 }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }

  async createDir(dirPath: string): Promise<void> {
    try {
      await fsp.mkdir(dirPath, { recursive: true })
    } catch (e) {
      throw new VartaError(VartaErrorCode.DIR_CREATE_FAILED, `Failed to create directory: ${dirPath}`, e)
    }
  }

  async deleteDir(dirPath: string): Promise<void> {
    try {
      await fsp.rm(dirPath, { recursive: true, force: true })
    } catch (e) {
      throw new VartaError(VartaErrorCode.DIR_DELETE_FAILED, `Failed to delete directory: ${dirPath}`, e)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildBinaryResult(filePath: string, statResult: FileStat): ReadFileResult {
    return {
      path:     filePath,
      content:  '',
      encoding: 'binary' as BufferEncoding,
      stat:     { ...statResult },
    }
  }
}

export const fileService = new FileService()
