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

  // ── Load one directory level (non-recursive) ──────────────────────────────

  const loadDir = useCallback(async (folderPath: string): Promise<void> => {
    const { setNodes, setLoading } = storeRef.current
    setLoading(true)
    try {
      const res = await window.varta.fs.readDir({
        path:       folderPath,
        recursive:  false,   // LAZY — only load one level at a time
        showHidden: false,
      })
      if (isIPCSuccess(res)) {
        setNodes(res.data)
      } else {
        notifyRef.current({ type: 'error', message: `Failed to read folder: ${res.error.message}` })
      }
    } catch (e) {
      notifyRef.current({ type: 'error', message: 'Failed to load file tree' })
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Load children of an expanded folder ───────────────────────────────────

  const loadChildren = useCallback(async (folderPath: string): Promise<void> => {
    try {
      const res = await window.varta.fs.readDir({
        path:       folderPath,
        recursive:  false,
        showHidden: false,
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

  // ── Refresh ───────────────────────────────────────────────────────────────

  const refreshNode = useCallback(async (folderPath: string) => {
    const { rootPath } = storeRef.current
    if (!rootPath) { return }
    await loadDir(rootPath)
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

  // ── Watcher setup ─────────────────────────────────────────────────────────

  const setupWatcher = useCallback((folderPath: string) => {
    if (watchCleanup) { watchCleanup(); watchCleanup = null }

    const watchId = `filetree-${Date.now()}`
    window.varta.fs.startWatch(watchId, [folderPath]).catch(() => {})

    const offWatch = window.varta.fs.onWatchEvent((_id, event) => {
      if (_id !== watchId) { return }
      if (['add', 'unlink', 'addDir', 'unlinkDir'].includes(event.type)) {
        refreshNode(dirname(event.path))
      }
    })

    watchCleanup = () => {
      offWatch()
      window.varta.fs.stopWatch(watchId).catch(() => {})
    }
  }, [refreshNode])

  // ── Collapse all ──────────────────────────────────────────────────────────

  const collapseAll = useCallback(() => {
    const { expandedPaths, setExpanded, rootPath } = storeRef.current
    for (const p of Array.from(expandedPaths)) {
      setExpanded(p, false)
    }
    if (rootPath) { storeRef.current.setExpanded(rootPath, true) }
  }, [])

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (watchCleanup) { watchCleanup(); watchCleanup = null }
    }
  }, [])

  return {
    openFolder,
    toggleFolder,
    loadDir,
    refreshNode,
    createFile,
    createFolder,
    deleteItem,
    renameItem,
    openFile,
    setupWatcher,
    collapseAll,
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
