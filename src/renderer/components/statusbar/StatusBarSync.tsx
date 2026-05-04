import React from 'react'
import { useGitStore } from '../../store/gitStore'
import { cn } from '../../utils/cn'

export function StatusBarSync() {
  const { isLoading } = useGitStore()

  if (!isLoading) { return null }

  return (
    <div className="flex items-center gap-1 px-2 h-full text-xs">
      <svg
        width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
        className="animate-spin"
      >
        <path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c.045.218.068.438.068.66 0 2.606-2.116 4.722-4.722 4.722S1.31 12.192 1.31 9.586 3.426 4.864 6.032 4.864c.314 0 .62.031.917.09"/>
      </svg>
      <span>Syncing…</span>
    </div>
  )
}
