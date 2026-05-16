import axios from 'axios'
import { MarketplaceExtension } from '../../shared/types/extension.types'
import { logger } from '../utils/logger'

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
        // Let's ensure we get a usable icon URL
        const icon = ext.iconUrl || (ext.files && ext.files.icon);
        
        return {
          id: `${ext.namespace}.${ext.name}`,
          name: ext.displayName || ext.name,
          publisher: ext.namespace,
          description: ext.description || '',
          version: ext.version,
          icon: icon,
          downloadUrl: ext.downloadUrl
        };
      })
    } catch (error: any) {
      logger.error('MarketplaceService', 'Failed to fetch from Open VSX', error)
      return []
    }
  }

  async install(id: string): Promise<boolean> {
    logger.info('MarketplaceService', `Installing extension from Open VSX: ${id}`)
    // In a real implementation:
    // 1. Fetch extension metadata to get download URL
    // 2. Download .vsix file
    // 3. Extract to extensions directory
    return true
  }
}

export const marketplaceService = new MarketplaceService()
