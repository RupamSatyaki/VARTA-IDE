import { filesystemTools } from './filesystem'
import { editorTools } from './editor'
import { runCommand } from './terminal'
import { gitTools } from './git'

/**
 * Registers ALL tools into the registry.
 * This is the central point where new tool categories should be added.
 */
export const allTools = [
  ...filesystemTools,
  ...editorTools,
  runCommand,
  ...gitTools,
  // Add more tools here as they are implemented
]
