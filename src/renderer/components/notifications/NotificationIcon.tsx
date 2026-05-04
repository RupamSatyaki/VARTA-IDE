import React from 'react'

export function NotificationIcon({ type }: { type: 'info' | 'success' | 'warning' | 'error' }) {
  if (type === 'success') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#4ec9b0] shrink-0">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
      </svg>
    )
  }
  if (type === 'warning') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#ff8c00] shrink-0">
        <path d="M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.72L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z"/>
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#f44747] shrink-0">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v5h1V6h-1zm0 6v1h1v-1h-1z"/>
      </svg>
    )
  }
  // info
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#569cd6] shrink-0">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v1h1V6h-1zm0 2v5h1V8h-1z"/>
    </svg>
  )
}
