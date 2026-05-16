import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path'
import { createWriteStream } from 'fs'
import { execSync } from 'child_process'
import { app } from 'electron'
import { MarketplaceExtension } from '../../shared/types/extension.types'
import { logger } from '../utils/logger'
import { extensionService } from './ExtensionService'

export class MarketplaceService {
  private readonly API_BASE = 'https://open-vsx.org/api/-'

  async search(query: string): Promise<MarketplaceExtension[]> {
    const searchTerm = query?.trim() || ''
    logger.info('MarketplaceService', `[API] Searching Open VSX for: "${searchTerm || 'trending'}"`)
    
    try {
      // For searches, we want relevance. For trending (empty query), we want downloadCount.
      const url = searchTerm 
        ? `${this.API_BASE}/search?query=${encodeURIComponent(searchTerm)}&size=50` 
        : `${this.API_BASE}/search?size=50&sortBy=downloadCount&sortOrder=desc`

      logger.info('MarketplaceService', `[API] Fetching URL: ${url}`)
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Varta-IDE/0.1.0' }
      })
      const extensions = response.data.extensions || []
      
      logger.info('MarketplaceService', `[API] Found ${extensions.length} extensions for: "${searchTerm || 'trending'}"`)

      return extensions.map((ext: any) => {
        // Open VSX sometimes provides relative URLs or specific fields for icons
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
      const metaRes = await axios.get(metaUrl)
      const downloadUrl = metaRes.data.files?.download
      
      if (!downloadUrl) {
        throw new Error(`Could not find download URL for ${id}`)
      }

      // 2. Prepare paths
      const extensionsDir = path.join(app.getPath('userData'), 'extensions')
      const tempZip      = path.join(app.getPath('temp'), `${id}.vsix`)
      const destDir      = path.join(extensionsDir, id)

      await fsp.mkdir(extensionsDir, { recursive: true })
      await fsp.mkdir(destDir, { recursive: true })

      // 3. Download .vsix (ZIP)
      logger.info('MarketplaceService', `Downloading: ${downloadUrl}`)
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream'
      })

      const writer = createWriteStream(tempZip)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      // 4. Extract using 'tar' (built-in on Windows 10+, macOS, Linux)
      logger.info('MarketplaceService', `Extracting to: ${destDir}`)
      
      // vsix is a zip, tar -xf works on modern systems
      // Note: Open VSX vsix files often contain an 'extension/' subdirectory
      const extractCmd = `tar -xf "${tempZip}" -C "${destDir}"`
      execSync(extractCmd)

      // 5. Cleanup temp file
      await fsp.rm(tempZip, { force: true })

      // 6. Reload ExtensionService to recognize new extension
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
