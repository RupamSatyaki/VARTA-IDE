import { createFile, readFile } from './filesystem'

/**
 * Registers ALL tools into the registry.
 * This is the central point where new tool categories should be added.
 */
export const allTools = [
  createFile,
  readFile,
  // Add more tools here as they are implemented
]
