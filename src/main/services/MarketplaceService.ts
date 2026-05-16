import axios from 'axios'
import { MarketplaceExtension } from '../../shared/types/extension.types'
import { logger } from '../utils/logger'

export class MarketplaceService {
  private readonly API_BASE = 'https://open-vsx.org/api/-'

  async search(query: string): Promise<MarketplaceExtension[]> {
    logger.info('MarketplaceService', `Searching Open VSX for: ${query || 'trending'}`)
    
    try {
      // Use sortBy=downloadCount to get the most popular/relevant results first
      const url = query 
        ? `${this.API_BASE}/search?q=${encodeURIComponent(query)}&size=50&sortBy=downloadCount&sortOrder=desc`
        : `${this.API_BASE}/search?size=50&sortBy=downloadCount&sortOrder=desc` // Trending

      const response = await axios.get(url)
      const extensions = response.data.extensions || []
      
      logger.info('MarketplaceService', `Found ${extensions.length} extensions for query: ${query}`)

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
