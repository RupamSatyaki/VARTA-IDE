import { createFile, readFile, writeFile, deleteFile, listDirectory } from './filesystem'
import { runCommand } from './terminal'
import { getStatus } from './git'

/**
 * Registers ALL tools into the registry.
 * This is the central point where new tool categories should be added.
 */
export const allTools = [
  createFile,
  readFile,
  writeFile,
  deleteFile,
  listDirectory,
  runCommand,
  getStatus,
  // Add more tools here as they are implemented
]
