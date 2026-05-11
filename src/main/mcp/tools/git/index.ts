import { getStatus } from './getStatus'
import { stageFiles } from './stageFiles'
import { commit } from './commit'
import { getDiff } from './getDiff'

export * from './getStatus'
export * from './stageFiles'
export * from './commit'
export * from './getDiff'

export const gitTools = [
  getStatus,
  stageFiles,
  commit,
  getDiff
]
