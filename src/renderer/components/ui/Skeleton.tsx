import React from 'react'
import { cn } from '../../utils/cn'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  rounded?: boolean
  className?: string
}

export function Skeleton({ width, height, rounded = false, className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[#2d2d2d]',
        rounded ? 'rounded-full' : 'rounded',
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
