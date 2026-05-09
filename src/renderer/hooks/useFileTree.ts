import { useCallback, useEffect, useRef } from 'react'
import { useFileTreeStore }     from '../store/fileTreeStore'
import { useEditorStore }       from '../store/editorStore'
import { useTabStore }          from '../store/tabStore'
import { useNotificationStore } from '../store/notificationStore'
import { detectLanguage }       from '../../shared/constants/languages'
import { isIPCSuccess }         from '../../shared/ipc'
import type { FileTreeNode }    from '../../shared/types/file.types'

function dirname(p: string): string {
  const norm  = p.replace(/\\/g, '/')
  const parts = norm.split('/')
  parts.pop()
  return parts.join('/') || '/'
}

function basename(p: string): string {
  return p.replace(/\\/g, '/').split('/').pop() ?? p
}

// Module-level watcher cleanup (survives re-renders)
let watchCleanup: (() => void) | null = null

export function useFileTree() {
  const store   = useFileTreeStore()
  const edStore = useEditorStore()
  const tabStore = useTabStore()
  const { add: notify } = useNotificationStore()

  // Use refs so callbacks always see latest values without stale closures
  const storeRef    = useRef(store)
  const edStoreRef  = useRef(edStore)
  const tabStoreRef = useRef(tabStore)
  const notifyRef   = useRef(notify)

  storeRef.current    = store
  edStoreRef.current  = edStore
  tabStoreRef.current = tabStore
  notifyRef.current   = notify

  // ── Load one directory level — preserves expanded children ──────────────

  const loadDir = useCallback(async (folderPath: string, silent = false): Promise<void> => {
    const { setNodes, setLoading } = storeRef.current
    if (!silent) { setLoading(true) }
    try {
      const res = await window.varta.fs.readDir({
        path:       folderPath,
        recursive:  false,
        showHidden: true,
      })
      if (isIPCSuccess(res)) {
        const { nodes: oldNodes, expandedPaths } = storeRef.current
        const merged = res.data.map((newNode) => {
          if (newNode.type !== 'directory') { return newNode }
          if (!expandedPaths.has(newNode.path)) { return newNode }
          const old = findNode(oldNodes, newNode.path)
          if (old?.children && old.children.length > 0) {
            return { ...newNode, children: old.children }
          }
          return newNode
        })
        setNodes(merged)
      } else {
        if (!silent) notifyRef.current({ type: 'error', message: `Failed to read folder: ${res.error.message}` })
      }
    } catch {
      if (!silent) notifyRef.current({ type: 'error', message: 'Failed to load file tree' })
    } finally {
      if (!silent) { setLoading(false) }
    }
  }, [])

  // ── Load children of an expanded folder ───────────────────────────────────

  const loadChildren = useCallback(async (folderPath: string): Promise<void> => {
    try {
      const res = await window.varta.fs.readDir({
        path:       folderPath,
        recursive:  false,
        showHidden: true,   // show dotfiles
      })
      if (!isIPCSuccess(res)) { return }

      // Patch the children into the existing nodes tree
      const { nodes, setNodes } = storeRef.current
      const patched = patchChildren(nodes, folderPath, res.data)
      setNodes(patched)
    } catch { /* ignore */ }
  }, [])

  // ── Open folder ───────────────────────────────────────────────────────────

  const openFolder = useCallback(async () => {
    const res = await window.varta.dialog.openFolder({ title: 'Open Folder' })
    if (!isIPCSuccess(res) || res.data.cancelled || res.data.paths.length === 0) { return }

    const folderPath = res.data.paths[0]
    storeRef.current.setRoot(folderPath)
    await loadDir(folderPath)
    setupWatcher(folderPath)
    window.varta.git.openRepo(folderPath).catch(() => {})
  }, [loadDir])

  // ── Toggle folder expand (lazy-loads children on first expand) ────────────

  const toggleFolder = useCallback(async (folderPath: string) => {
    const { expandedPaths, toggleExpanded, nodes } = storeRef.current
    const isExpanded = expandedPaths.has(folderPath)

    if (!isExpanded) {
      // Check if children already loaded
      const node = findNode(nodes, folderPath)
      if (!node?.children || node.children.length === 0) {
        await loadChildren(folderPath)
      }
    }
    toggleExpanded(folderPath)
  }, [loadChildren])

  // ── Refresh — surgical: only reload the affected folder ─────────────────

  const refreshNode = useCallback(async (folderPath: string) => {
    const { rootPath } = storeRef.current
    if (!rootPath) { return }

    // Root level reload
    if (folderPath === rootPath) {
      await loadDir(rootPath)
      return
    }

    // Always read fresh nodes from store at call time
    const { expandedPaths } = storeRef.current

    if (!expandedPaths.has(folderPath)) {
      // Not expanded — just clear children so next expand reloads fresh
      storeRef.current.setNodes(
        patchChildren(storeRef.current.nodes, folderPath, [])
      )
      return
    }

    // Expanded — reload children surgically
    try {
      const res = await window.varta.fs.readDir({
        path:       folderPath,
        recursive:  false,
        showHidden: true,
      })
      if (!isIPCSuccess(res)) { return }
      // Read nodes AGAIN after async — they may have changed
      storeRef.current.setNodes(
        patchChildren(storeRef.current.nodes, folderPath, res.data)
      )
    } catch { /* ignore */ }
  }, [loadDir])

  // ── Open file ─────────────────────────────────────────────────────────────

  const openFile = useCallback(async (filePath: string, preview: boolean) => {
    const { tabs, addTab } = tabStoreRef.current
    const { openTab }      = edStoreRef.current

    // Already open → just activate
    const existing = tabs.find((t) => t.filePath === filePath)
    if (existing) {
      addTab(existing)
      storeRef.current.setSelected(filePath)
      return
    }

    const res = await window.varta.fs.readFile(filePath)
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Cannot open: ${res.error.message}` })
      return
    }

    if (res.data.encoding === 'binary') {
      notifyRef.current({ type: 'warning', message: `'${res.data.stat.name}' is a binary file.` })
      return
    }

    const language = detectLanguage(filePath)
    const tabId    = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const tab = {
      id:        tabId,
      filePath,
      title:     res.data.stat.name,
      language,
      isDirty:   false,
      isPreview: preview,
      isPinned:  false,
    }

    addTab(tab)
    openTab(tab)
    storeRef.current.setSelected(filePath)
  }, [])

  // ── Create file ───────────────────────────────────────────────────────────

  const createFile = useCallback(async (parentPath: string, name: string) => {
    const filePath = `${parentPath.replace(/\\/g, '/')}/${name}`
    const res = await window.varta.fs.writeFile({ path: filePath, content: '', createDirs: false })
    if (isIPCSuccess(res)) {
      await refreshNode(parentPath)
      await openFile(filePath, false)
    } else {
      notifyRef.current({ type: 'error', message: `Failed to create file: ${res.error.message}` })
    }
  }, [refreshNode, openFile])

  // ── Create folder ─────────────────────────────────────────────────────────

  const createFolder = useCallback(async (parentPath: string, name: string) => {
    const folderPath = `${parentPath.replace(/\\/g, '/')}/${name}`
    const res = await window.varta.fs.createDir(folderPath)
    if (isIPCSuccess(res)) {
      await refreshNode(parentPath)
    } else {
      notifyRef.current({ type: 'error', message: `Failed to create folder: ${res.error.message}` })
    }
  }, [refreshNode])

  // ── Delete item ───────────────────────────────────────────────────────────

  const deleteItem = useCallback(async (itemPath: string, isDirectory: boolean) => {
    const name = basename(itemPath)
    const confirmRes = await window.varta.dialog.confirm(
      `Delete '${name}' permanently?`,
      'This action cannot be undone.',
    )
    if (!isIPCSuccess(confirmRes) || !confirmRes.data.confirmed) { return }

    const res = isDirectory
      ? await window.varta.fs.deleteDir(itemPath)
      : await window.varta.fs.deleteFile(itemPath)

    if (isIPCSuccess(res)) {
      await refreshNode(dirname(itemPath))
      const { tabs, removeTab } = tabStoreRef.current
      const affected = tabs.find((t) => t.filePath === itemPath || t.filePath.startsWith(itemPath + '/'))
      if (affected) { removeTab(affected.id) }
    } else {
      notifyRef.current({ type: 'error', message: `Failed to delete: ${res.error.message}` })
    }
  }, [refreshNode])

  // ── Rename item ───────────────────────────────────────────────────────────

  const renameItem = useCallback(async (oldPath: string, newName: string) => {
    const parent  = dirname(oldPath)
    const newPath = `${parent}/${newName}`
    const res = await window.varta.fs.renameFile({ oldPath, newPath })
    if (isIPCSuccess(res)) {
      await refreshNode(parent)
      const { tabs, removeTab } = tabStoreRef.current
      const affected = tabs.find((t) => t.filePath === oldPath)
      if (affected) {
        removeTab(affected.id)
        await openFile(newPath, false)
      }
    } else {
      notifyRef.current({ type: 'error', message: `Failed to rename: ${res.error.message}` })
    }
  }, [refreshNode, openFile])

  // ── Move item (drag & drop) ───────────────────────────────────────────────

  const moveItem = useCallback(async (sourcePath: string, targetDirPath: string) => {
    const name    = basename(sourcePath)
    const newPath = `${targetDirPath.replace(/\\/g, '/')}/${name}`
    if (newPath === sourcePath.replace(/\\/g, '/')) { return }

    const res = await window.varta.fs.renameFile({ oldPath: sourcePath, newPath })
    if (isIPCSuccess(res)) {
      // Reload root + all expanded folders immediately (silent — no loading flash)
      const { rootPath, expandedPaths } = storeRef.current
      if (rootPath) {
        await loadDir(rootPath, true)
        const dirs = Array.from(expandedPaths).filter(p => p !== rootPath)
        await Promise.all(dirs.map(async (dir) => {
          const r = await window.varta.fs.readDir({ path: dir, recursive: false, showHidden: true }).catch(() => null)
          if (r && isIPCSuccess(r)) {
            storeRef.current.setNodes(patchChildren(storeRef.current.nodes, dir, r.data))
          }
        }))
      }
      // Update open tab
      const { tabs, removeTab } = tabStoreRef.current
      const affected = tabs.find((t) =>
        t.filePath === sourcePath ||
        t.filePath.startsWith(sourcePath + '/') ||
        t.filePath.startsWith(sourcePath + '\\')
      )
      if (affected) {
        removeTab(affected.id)
        if (affected.filePath === sourcePath) { await openFile(newPath, false) }
      }
    } else {
      notifyRef.current({ type: 'error', message: `Move failed: ${res.error.message}` })
    }
  }, [loadDir, openFile])

  // Keep refreshNode in a ref so watcher always calls latest version
  const refreshNodeRef = useRef(refreshNode)
  refreshNodeRef.current = refreshNode

  const setupWatcher = useCallback((folderPath: string) => {
    if (watchCleanup) { watchCleanup(); watchCleanup = null }

    const watchId = `filetree-${Date.now()}`
    window.varta.fs.startWatch(watchId, [folderPath]).catch(() => {})

    const offWatch = window.varta.fs.onWatchEvent((_id, event) => {
      if (_id !== watchId) { return }
      if (event.type === 'change') { return }  // content change, not structural

      const parentDir = dirname(event.path)
      refreshNodeRef.current(parentDir)
    })

    watchCleanup = () => {
      offWatch()
      window.varta.fs.stopWatch(watchId).catch(() => {})
    }
  }, [])  // no deps — uses ref

  // ── Collapse all ──────────────────────────────────────────────────────────

  const collapseAll = useCallback(() => {
    const { expandedPaths, setExpanded, rootPath } = storeRef.current
    for (const p of Array.from(expandedPaths)) {
      setExpanded(p, false)
    }
    if (rootPath) { storeRef.current.setExpanded(rootPath, true) }
  }, [])

  // ── Auto-refresh every 2 seconds — silent, no loading flash ─────────────

  useEffect(() => {
    const timer = setInterval(async () => {
      const { rootPath, expandedPaths } = storeRef.current
      if (!rootPath) { return }

      // Silent reload — no setLoading, no blink
      await loadDir(rootPath, true)

      const dirs = Array.from(expandedPaths).filter(p => p !== rootPath)
      for (const dir of dirs) {
        const r = await window.varta.fs.readDir({ path: dir, recursive: false, showHidden: true }).catch(() => null)
        if (r && isIPCSuccess(r)) {
          storeRef.current.setNodes(patchChildren(storeRef.current.nodes, dir, r.data))
        }
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (watchCleanup) { watchCleanup(); watchCleanup = null }
    }
  }, [])

  return {
    openFolder, toggleFolder, loadDir, refreshNode,
    createFile, createFolder, deleteItem, renameItem, moveItem,
    openFile, setupWatcher, collapseAll,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Recursively find a node by path */
function findNode(nodes: FileTreeNode[], targetPath: string): FileTreeNode | null {
  for (const n of nodes) {
    if (n.path === targetPath) { return n }
    if (n.children) {
      const found = findNode(n.children, targetPath)
      if (found) { return found }
    }
  }
  return null
}

/** Return a new nodes array with children patched at the given path */
function patchChildren(
  nodes:      FileTreeNode[],
  targetPath: string,
  children:   FileTreeNode[],
): FileTreeNode[] {
  return nodes.map((n) => {
    if (n.path === targetPath) {
      return { ...n, children }
    }
    if (n.children) {
      return { ...n, children: patchChildren(n.children, targetPath, children) }
    }
    return n
  })
}
