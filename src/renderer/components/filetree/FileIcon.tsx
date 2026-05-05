import React, { useMemo } from 'react'
import { cn } from '../../utils/cn'
import { themeIcons } from 'seti-file-icons'

export interface FileIconProps {
  filename:   string
  isFolder?:  boolean
  isOpen?:    boolean
  size?:      number
  className?: string
}

// VS Code Seti color palette (exact colors from jesseweed/seti-ui)
const getIcon = themeIcons({
  blue:         '#519aba',
  grey:         '#4d5a5e',
  'grey-light': '#6d8086',
  green:        '#8dc149',
  orange:       '#e37933',
  pink:         '#f55385',
  purple:       '#a074c4',
  red:          '#cc3e44',
  white:        '#d4d4d4',
  yellow:       '#cbcb41',
  ignore:       '#41535b',
})

// Inject fill color directly into the <svg> tag
function injectFill(svg: string, color: string): string {
  return svg.replace('<svg ', `<svg fill="${color}" `)
}

function SetiIcon({ filename, size, className }: {
  filename: string
  size:     number
  className?: string
}) {
  const { svg, color } = useMemo(() => getIcon(filename), [filename])
  const coloredSvg     = useMemo(() => injectFill(svg, color), [svg, color])

  return (
    <span
      className={cn('shrink-0 inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: coloredSvg }}
    />
  )
}

export function FileIcon({
  filename,
  isFolder  = false,
  size      = 16,
  className,
}: FileIconProps) {
  if (isFolder) return null
  return <SetiIcon filename={filename} size={size} className={className} />
}
