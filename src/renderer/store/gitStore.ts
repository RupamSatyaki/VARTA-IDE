import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'
import type { GitStatus, GitCommit } from '../../shared/types/git.types'

export interface GitState {
  status:           GitStatus | null
  commits:          GitCommit[]
  activeBranch:     string | null
  isLoading:        boolean
  lastError:        string | null
  generatedMessage: string | null
}

export interface GitActions {
  setStatus:          (status: GitStatus | null) => void
  setCommits:         (commits: GitCommit[]) => void
  setLoading:         (loading: boolean) => void
  setError:           (error: string | null) => void
  setGeneratedMessage:(msg: string | null) => void
  reset:              () => void
}

const INITIAL: GitState = {
  status:           null,
  commits:          [],
  activeBranch:     null,
  isLoading:        false,
  lastError:        null,
  generatedMessage: null,
}

export const useGitStore = create<GitState & GitActions>()(
  immer((set) => ({
    ...INITIAL,

    setStatus: (status) => set((s) => {
      s.status       = status
      s.activeBranch = status?.branch ?? null
      s.lastError    = null
    }),

    setCommits:          (commits) => set((s) => { s.commits   = commits }),
    setLoading:          (loading) => set((s) => { s.isLoading = loading }),
    setError:            (error)   => set((s) => { s.lastError = error; s.isLoading = false }),
    setGeneratedMessage: (msg)     => set((s) => { s.generatedMessage = msg }),
    reset:               ()        => set(() => ({ ...INITIAL })),
  }))
)
