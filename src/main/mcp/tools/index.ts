import { createFileTool } from './filesystem'

/**
 * Registers ALL tools into the registry.
 * This is the central point where new tool categories should be added.
 */
export const allTools = [
  createFileTool,
  // Add more tools here as they are implemented
]
