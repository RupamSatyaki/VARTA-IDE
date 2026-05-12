import { windowManager } from '../../window/WindowManager'
import { logger } from '../../utils/logger'

/**
 * ConfirmationGate ensures that destructive operations require user approval.
 */
export class ConfirmationGate {
  /**
   * Request confirmation from the user via the renderer UI.
   */
  static async confirm(message: string, detail?: string): Promise<boolean> {
    logger.info('ConfirmationGate', `Requesting confirmation: ${message}`)
    
    return new Promise((resolve) => {
      // Use a unique ID for this request
      const requestId = Math.random().toString(36).substring(7)
      
      const { ipcMain } = require('electron')
      const replyChannel = `mcp:confirm-reply:${requestId}`
      
      const handler = (_event: any, approved: boolean) => {
        ipcMain.removeListener(replyChannel, handler)
        logger.info('ConfirmationGate', `Confirmation received for ${requestId}: ${approved}`)
        resolve(approved)
      }
      
      ipcMain.on(replyChannel, handler)
      
      windowManager.send('mcp:confirm-request', {
        requestId,
        message,
        detail,
        replyChannel
      })
      
      // Safety timeout: auto-reject if no response after 5 minutes
      setTimeout(() => {
        ipcMain.removeListener(replyChannel, handler)
        resolve(false)
      }, 300000)
    })
  }
}
