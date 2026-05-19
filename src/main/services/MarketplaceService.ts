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
      const tempVsix = path.join(app.getPath('temp'), `${id}.vsix`)

      // 3. Download .vsix (ZIP)
      logger.info('MarketplaceService', `Downloading: ${downloadUrl}`)
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 30000
      })

      const writer = createWriteStream(tempVsix)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      const result = await this.extractAndInstall(tempVsix, id)
      await fsp.rm(tempVsix, { force: true }).catch(() => {})
      return result
    } catch (error: any) {
      logger.error('MarketplaceService', `Failed to install extension ${id}`, error)
      return false
    }
  }

  async installFromFile(filePath: string): Promise<boolean> {
    logger.info('MarketplaceService', `Installing extension from file: ${filePath}`)
    try {
      const fileName = path.basename(filePath, '.vsix')
      return await this.extractAndInstall(filePath, fileName)
    } catch (error: any) {
      logger.error('MarketplaceService', `Failed to install extension from ${filePath}`, error)
      return false
    }
  }

  private async extractAndInstall(vsixPath: string, idHint: string): Promise<boolean> {
    const tempExtract  = path.join(app.getPath('temp'), `${idHint}_extracted`)
    const extensionsDir = path.join(app.getPath('userData'), 'extensions')
    
    try {
      await fsp.mkdir(extensionsDir, { recursive: true })
      await fsp.rm(tempExtract, { recursive: true, force: true })
      await fsp.mkdir(tempExtract, { recursive: true })

      // 1. Extract
      logger.info('MarketplaceService', `Extracting to temp: ${tempExtract}`)
      if (process.platform === 'win32') {
        const tempZip = path.join(app.getPath('temp'), `${idHint}_tmp.zip`)
        try {
          await fsp.copyFile(vsixPath, tempZip)
          await this.runCommand('powershell', [
            '-NoProfile',
            '-Command',
            `Expand-Archive -Path '${tempZip}' -DestinationPath '${tempExtract}' -Force`
          ])
        } finally {
          await fsp.rm(tempZip, { force: true }).catch(() => {})
        }
      } else {
        await this.runCommand('tar', ['-xf', vsixPath, '-C', tempExtract])
      }

      // 2. Locate package.json and move contents
      let sourceDir = tempExtract
      const internalExtDir = path.join(tempExtract, 'extension')
      const manifestInInternal = path.join(internalExtDir, 'package.json')
      
      let manifestPath = ''
      try {
        await fsp.access(manifestInInternal)
        sourceDir = internalExtDir
        manifestPath = manifestInInternal
        logger.info('MarketplaceService', `Found manifest in 'extension/' folder`)
      } catch (e) {
        manifestPath = path.join(tempExtract, 'package.json')
        try {
          await fsp.access(manifestPath)
          logger.info('MarketplaceService', `Found manifest in extract root`)
        } catch (e2) {
          throw new VartaError(VartaErrorCode.EXTENSION_INVALID, 'Missing package.json in extension package')
        }
      }

      // Read manifest to get real ID
      const raw = await fsp.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(raw)
      const realId = manifest.id || (manifest.publisher && manifest.name ? `${manifest.publisher}.${manifest.name}` : idHint)
      const destDir = path.join(extensionsDir, realId)

      await fsp.rm(destDir, { recursive: true, force: true })
      await fsp.mkdir(destDir, { recursive: true })

      logger.info('MarketplaceService', `Moving files from ${sourceDir} to ${destDir}`)
      const files = await fsp.readdir(sourceDir)
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

      // 3. Cleanup
      await fsp.rm(tempExtract, { recursive: true, force: true }).catch(() => {})

      // 4. Reload ExtensionService
      logger.info('MarketplaceService', `Installation successful, reloading extensions`)
      await extensionService.reloadAll()

      return true
    } catch (error: any) {
      logger.error('MarketplaceService', `Extraction/Installation failed`, error)
      throw error
    }
  }

}

export const marketplaceService = new MarketplaceService()
