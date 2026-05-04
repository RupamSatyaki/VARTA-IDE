import React, { useCallback, useRef } from 'react'
import { cn } from '../../utils/cn'

export interface TreeNode<T> {
  id: string
  data: T
  children?: TreeNode<T>[]
  isExpanded?: boolean
}

export interface TreeViewProps<T> {
  nodes: TreeNode<T>[]
  renderNode: (node: TreeNode<T>, depth: number) => React.ReactNode
  onExpand?: (node: TreeNode<T>) => void
  onSelect?: (node: TreeNode<T>) => void
  selectedId?: string
  className?: string
}

export function TreeView<T>({
  nodes,
  renderNode,
  onExpand,
  onSelect,
  selectedId,
  className,
}: TreeViewProps<T>) {
  const flatRef = useRef<TreeNode<T>[]>([])

  const flatten = useCallback((ns: TreeNode<T>[], depth = 0): Array<{ node: TreeNode<T>; depth: number }> => {
    const result: Array<{ node: TreeNode<T>; depth: number }> = []
    for (const n of ns) {
      result.push({ node: n, depth })
      if (n.isExpanded && n.children) {
        result.push(...flatten(n.children, depth + 1))
      }
    }
    return result
  }, [])

  const flat = flatten(nodes)
  flatRef.current = flat.map((f) => f.node)

  const handleKeyDown = (e: React.KeyboardEvent, node: TreeNode<T>, idx: number) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); (flat[idx + 1]?.node && onSelect?.(flat[idx + 1].node)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); (flat[idx - 1]?.node && onSelect?.(flat[idx - 1].node)) }
    if (e.key === 'ArrowRight' && node.children) { e.preventDefault(); if (!node.isExpanded) { onExpand?.(node) } }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); if (node.isExpanded) { onExpand?.(node) } }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(node) }
  }

  return (
    <div role="tree" className={cn('outline-none', className)}>
      {flat.map(({ node, depth }, idx) => (
        <div
          key={node.id}
          role="treeitem"
          aria-selected={selectedId === node.id}
          aria-expanded={node.children ? node.isExpanded : undefined}
          tabIndex={selectedId === node.id ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, node, idx)}
          onClick={() => {
            onSelect?.(node)
            if (node.children) { onExpand?.(node) }
          }}
          className={cn(
            'flex items-center cursor-pointer select-none',
            'hover:bg-[#2a2d2e] focus:outline-none focus:bg-[#2a2d2e]',
            selectedId === node.id && 'bg-[#37373d]',
          )}
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          {renderNode(node, depth)}
        </div>
      ))}
    </div>
  )
}
