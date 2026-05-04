import React from 'react'
import { cn } from '../../utils/cn'

export interface IconProps {
  name: string
  size?: number
  className?: string
  'aria-hidden'?: boolean
}

/**
 * Inline SVG icon component using codicon-style paths.
 * We embed the most common icons directly to avoid font loading.
 */
const ICONS: Record<string, string> = {
  // Files
  'file':          'M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z',
  'folder':        'M1 3l1-1h5l1 1 1-1h5l1 1v9l-1 1H2l-1-1V3zm1 9h12V4h-4l-1-1H2v9z',
  'folder-open':   'M1 3l1-1h5l1 1 1-1h5l1 1v1H1V3zm0 2h14v7l-1 1H2l-1-1V5zm1 7h12V6H2v6z',
  // Actions
  'close':         'M8 7.293L12.646 2.646l.708.708L8.707 8l4.647 4.646-.708.708L8 8.707l-4.646 4.647-.708-.708L7.293 8 2.646 3.354l.708-.708L8 7.293z',
  'add':           'M14 7H9V2H7v5H2v2h5v5h2V9h5z',
  'trash':         'M10 3h3v1h-1v9l-1 1H5l-1-1V4H3V3h3V2a1 1 0 011-1h2a1 1 0 011 1v1zm-5 1v8h6V4H5zm1-1h4V2H6v1z',
  'edit':          'M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3.28 1.77 1.77-3.28 1.51zm2.83-3.66L13.5 2.77l-.27-.27L4.97 9.66l.27.27z',
  'refresh':       'M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c.045.218.068.438.068.66 0 2.606-2.116 4.722-4.722 4.722S1.31 12.192 1.31 9.586 3.426 4.864 6.032 4.864c.314 0 .62.031.917.09l.217.046.224-.04.345-.062c.218-.039.44-.059.664-.059.222 0 .44.02.654.059l.345.062.224.04.217-.046c.297-.059.603-.09.917-.09.314 0 .62.031.917.09l.217.046.224-.04.345-.062c.218-.039.44-.059.664-.059h.001l.579.939z',
  'search':        'M6.5 1C3.467 1 1 3.467 1 6.5S3.467 12 6.5 12c1.322 0 2.538-.466 3.489-1.237l3.373 3.374.708-.707-3.374-3.373A5.47 5.47 0 0012 6.5C12 3.467 9.533 1 6.5 1zm0 1C9.033 2 11 3.967 11 6.5S9.033 11 6.5 11 2 9.033 2 6.5 3.967 2 6.5 2z',
  'settings':      'M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.7-1.3 2 .8.8 2-1.3.7.3.5 2.4h1.2l.5-2.4.7-.3 2 1.3.8-.8-1.3-2 .3-.7 2.4-.5V7.4l-2.4-.5-.3-.7 1.3-2-.8-.8-2 1.3-.7-.3zM8 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  'chevron-right': 'M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z',
  'chevron-down':  'M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z',
  'chevron-left':  'M5.928 7.976l4.357 4.357-.618.62L5 8.284v-.618L9.667 3l.618.619-4.357 4.357z',
  'chevron-up':    'M8.024 5.928L3.667 10.285l-.62-.618L7.716 5h.618L13 9.667l-.619.618-4.357-4.357z',
  // Git
  'git-branch':    'M5 2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-.5 0a2 2 0 10-4 0 2 2 0 004 0zM5 13.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-.5 0a2 2 0 10-4 0 2 2 0 004 0zM2.5 5v6M11 2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-.5 0a2 2 0 10-4 0 2 2 0 004 0zM8.5 5c0 3.5-3 5-6 5',
  'git-commit':    'M10.5 7.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM8 7.5a.5.5 0 11-1 0 .5.5 0 011 0zM0 8h5.5M10.5 8H16',
  // Terminal
  'terminal':      'M6 9L1 4l1-1 4 4-4 4-1-1 4-4zm4 4H6v-1h4v1z',
  // Extensions
  'extensions':    'M5 3l-1 1v3l-3 3v1h3v3l1 1h1l1-1v-3h3l1-1v-1l-3-3V4l-1-1H5zm1 1h1v3.5l.15.35 3 3V11H8v3H7v-3H4.5v-.15l3-3L7.5 7.5V4H6z',
  // Debug
  'debug':         'M14 4l-1-1-2 2a5 5 0 00-6 0L3 3 2 4l2 2a5 5 0 000 6l-2 2 1 1 2-2a5 5 0 006 0l2 2 1-1-2-2a5 5 0 000-6l2-2zm-6 8a4 4 0 110-8 4 4 0 010 8z',
  // AI
  'sparkle':       'M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z',
  // Misc
  'warning':       'M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.72L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z',
  'error':         'M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v5h1V5h-1zm0 6v1h1v-1h-1z',
  'info':          'M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v1h1V6h-1zm0 2v5h1V8h-1z',
  'check':         'M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z',
  'copy':          'M4 4l1-1h5.414L14 6.586V14l-1 1H5l-1-1V4zm1 0v9h8V7h-3V4H5zm6 0v2h2l-2-2zM3 1L2 2v9l1 1V2h6l-1-1H3z',
  'save':          'M13.353 1.146L14.5 2.293 14.854 3 15 3.5V14l-1 1H2l-1-1V2l1-1h9.5l.853.146zM13 2H6v3H5V2H3v12h10V4l-1-1V2zm-2 0v2H7V2h4zm-5 7h4v1H6v-1zm0 2h6v1H6v-1z',
  'account':       'M8 1a3 3 0 110 6A3 3 0 018 1zm0 1a2 2 0 100 4 2 2 0 000-4zm0 6c3.3 0 6 1.3 6 3v1H2v-1c0-1.7 2.7-3 6-3z',
}

export function Icon({ name, size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  const d = ICONS[name]
  if (!d) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" className={cn('inline-block', className)} aria-hidden={ariaHidden}>
        <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1"/>
      </svg>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn('inline-block shrink-0', className)}
      aria-hidden={ariaHidden}
    >
      <path d={d} />
    </svg>
  )
}
