import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path'
import { createWriteStream } from 'fs'
import { spawn } from 'child_process'
import { app } from 'electron'
import { MarketplaceExtension } from '../../shared/types/extension.types'
import { logger } from '../utils/logger'
import { extensionService } from './ExtensionService'
import { VartaError, VartaErrorCode } from '../../shared/errors'

export class MarketplaceService {
  private readonly API_BASE = 'https://open-vsx.org/api/-'

  /**
   * Helper to run shell commands asynchronously to avoid blocking the main thread.
   */
  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { shell: true })
      let stderr = ''

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`))
        }
      })

      proc.on('error', (err) => {
        reject(err)
      })
    })
  }

  async search(query: string): Promise<MarketplaceExtension[]> {
    const searchTerm = query?.trim() || ''
    logger.info('MarketplaceService', `[API] Searching Open VSX for: "${searchTerm || 'trending'}"`)
    
    try {
      const url = searchTerm 
        ? `${this.API_BASE}/search?query=${encodeURIComponent(searchTerm)}&size=50` 
        : `${this.API_BASE}/search?size=50&sortBy=downloadCount&sortOrder=desc`

      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Varta-IDE/0.1.0' },
        timeout: 10000
      })
      const extensions = response.data.extensions || []
      
      return extensions.map((ext: any) => {
        const icon = ext.iconUrl || (ext.files && ext.files.icon);
        const downloadUrl = ext.files?.download || ext.downloadUrl;
        
        return {
          id: `${ext.namespace}.${ext.name}`,
          name: ext.displayName || ext.name,
          publisher: ext.namespace,
          description: ext.description || '',
          version: ext.version,
          icon: icon,
          downloadUrl: downloadUrl
        };
      })
    } catch (error: any) {
      logger.error('MarketplaceService', 'Failed to fetch from Open VSX', error)
      return []
    }
  }

  async install(id: string): Promise<boolean> {
    logger.info('MarketplaceService', `Installing extension: ${id}`)
    
    try {
      // 1. Get detailed info to find download URL
      const [namespace, name] = id.split('.')
      const metaUrl = `https://open-vsx.org/api/${namespace}/${name}/latest`
      const metaRes = await axios.get(metaUrl, { timeout: 10000 })
      const downloadUrl = metaRes.data.files?.download
      
      if (!downloadUrl) {
        throw new VartaError(VartaErrorCode.EXTENSION_INSTALL_FAILED, `Could not find download URL for ${id}`)
      }

      // 2. Prepare paths
      const extensionsDir = path.join(app.getPath('userData'), 'extensions')
      const tempZip      = path.join(app.getPath('temp'), `${id}.vsix`)
      const tempExtract  = path.join(app.getPath('temp'), `${id}_extracted`)
      const destDir      = path.join(extensionsDir, id)

      await fsp.mkdir(extensionsDir, { recursive: true })
      await fsp.rm(tempExtract, { recursive: true, force: true })
      await fsp.mkdir(tempExtract, { recursive: true })
      await fsp.rm(destDir, { recursive: true, force: true })
      await fsp.mkdir(destDir, { recursive: true })

      // 3. Download .vsix (ZIP)
      logger.info('MarketplaceService', `Downloading: ${downloadUrl}`)
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 30000
      })

      const writer = createWriteStream(tempZip)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      // 4. Extract
      logger.info('MarketplaceService', `Extracting to temp: ${tempExtract}`)
      if (process.platform === 'win32') {
        const tempZipRename = tempZip.replace(/\.vsix$/, '.zip')
        try {
          await fsp.rename(tempZip, tempZipRename)
          await this.runCommand('powershell', [
            '-NoProfile',
            '-Command',
            `Expand-Archive -Path '${tempZipRename}' -DestinationPath '${tempExtract}' -Force`
          ])
        } finally {
          await fsp.rm(tempZipRename, { force: true }).catch(() => {})
        }
      } else {
        await this.runCommand('tar', ['-xf', tempZip, '-C', tempExtract])
      }

      // 5. Locate package.json and move contents
      let sourceDir = tempExtract
      const internalExtDir = path.join(tempExtract, 'extension')
      const manifestInInternal = path.join(internalExtDir, 'package.json')
      
      try {
        await fsp.access(manifestInInternal)
        sourceDir = internalExtDir
        logger.info('MarketplaceService', `Found manifest in 'extension/' folder`)
      } catch (e) {
        try {
          await fsp.access(path.join(tempExtract, 'package.json'))
          logger.info('MarketplaceService', `Found manifest in extract root`)
        } catch (e2) {
          throw new VartaError(VartaErrorCode.EXTENSION_INVALID, 'Missing package.json in extension package')
        }
      }

      logger.info('MarketplaceService', `Moving files from ${sourceDir} to ${destDir}`)
      const files = await fsp.readdir(sourceDir)
      if (files.length === 0) {
        throw new Error(`Extracted source directory is empty: ${sourceDir}`)
      }

      for (const file of files) {
        const src = path.join(sourceDir, file)
        const dst = path.join(destDir, file)
        try {
          await fsp.rename(src, dst)
        } catch (e) {
          await fsp.cp(src, dst, { recursive: true })
          await fsp.rm(src, { recursive: true, force: true })
        }
      }

      // 6. Cleanup
      await fsp.rm(tempZip, { force: true }).catch(() => {})
      await fsp.rm(tempExtract, { recursive: true, force: true }).catch(() => {})

      // 7. Reload ExtensionService
      logger.info('MarketplaceService', `Installation successful, reloading extensions`)
      await extensionService.reloadAll()

      return true
    } catch (error: any) {
      logger.error('MarketplaceService', `Failed to install extension ${id}`, error)
      return false
    }
  }
}

export const marketplaceService = new MarketplaceService()
