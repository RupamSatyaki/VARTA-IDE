import React, { useState, useCallback } from 'react'
import { CodeCanvas }            from './CodeCanvas'
import { EditorTabs }            from './EditorTabs'
import { EditorBreadcrumb }      from './EditorBreadcrumb'
import { WelcomeScreen }         from './WelcomeScreen'
import { UnsavedChangesDialog }  from './UnsavedChangesDialog'
import { useTabStore }           from '../../store/tabStore'
import { useUIStore }            from '../../store/uiStore'
import { useEditor }             from '../../hooks/useEditor'
import { useFileTree }           from '../../hooks/useFileTree'

export function EditorPane() {
  const { tabs, activeTabId, setActive } = useTabStore()

  const {
    saveFile, saveAllFiles, closeTab,
    handleChange, reopenLastClosed, openFile,
    getContent,
  } = useEditor()

  const { openFolder } = useFileTree()

  const [unsavedDialog, setUnsavedDialog] = useState<{
    tabId: string; filename: string
  } | null>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  // ── Tab close with dirty check ───────────────────────────────────────────
  const handleCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId)
    if (!tab) { return }
    if (tab.isDirty) {
      const filename = tab.filePath.replace(/\\/g, '/').split('/').pop() ?? tab.title
      setUnsavedDialog({ tabId, filename })
    } else {
      closeTab(tabId)
    }
  }, [tabs, closeTab])

  // ── Next tab ─────────────────────────────────────────────────────────────
  const handleNextTab = useCallback(() => {
    if (tabs.length < 2) { return }
    const idx  = tabs.findIndex((t) => t.id === activeTabId)
    const next = tabs[(idx + 1) % tabs.length]
    setActive(next.id)
  }, [tabs, activeTabId, setActive])

  // ── New untitled ─────────────────────────────────────────────────────────
  const handleNewUntitled = useCallback(() => {
    openFile('untitled', false)
  }, [openFile])

  // ── Unsaved dialog ───────────────────────────────────────────────────────
  const handleSaveAndClose = useCallback(async () => {
    if (!unsavedDialog) { return }
    await saveFile(unsavedDialog.tabId)
    closeTab(unsavedDialog.tabId)
    setUnsavedDialog(null)
  }, [unsavedDialog, saveFile, closeTab])

  const handleDontSave = useCallback(() => {
    if (!unsavedDialog) { return }
    closeTab(unsavedDialog.tabId)
    setUnsavedDialog(null)
  }, [unsavedDialog, closeTab])

  const showEditor = tabs.length > 0 && activeTab !== null

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-[#1e1e1e]">

      {/* Tab bar — always rendered when tabs exist */}
      {tabs.length > 0 && (
        <EditorTabs
          onCloseTab={handleCloseTab}
          onNewUntitled={handleNewUntitled}
        />
      )}

      {/* Breadcrumb */}
      {activeTab && (
        <EditorBreadcrumb filePath={activeTab.filePath} />
      )}

      {/* Welcome screen — shown when no tabs */}
      {!showEditor && (
        <WelcomeScreen
          onNewFile={handleNewUntitled}
          onOpenFile={() =>
            window.varta.dialog.openFile().then((r) => {
              if (r.success && !r.data.cancelled && r.data.paths[0]) {
                openFile(r.data.paths[0], false)
              }
            })
          }
          onOpenFolder={openFolder}
        />
      )}

      {/*
        CodeCanvas — mounted ONCE, never unmounted while tabs exist.
        Tab switch = model swap inside CodeCanvas via path/tabId props.
        NO key prop here — that would remount Monaco on every switch.
      */}
      {showEditor && activeTab && (
        <CodeCanvas
          tabId={activeTab.id}
          path={activeTab.filePath}
          content={getContent(activeTab.id)}
          language={activeTab.language}
          onChange={(val) => handleChange(activeTab.id, val)}
          onSave={() => saveFile(activeTab.id)}
          onSaveAll={saveAllFiles}
          onClose={() => handleCloseTab(activeTab.id)}
          onNextTab={handleNextTab}
          onReopenClosed={reopenLastClosed}
        />
      )}

      {/* Unsaved changes dialog */}
      {unsavedDialog && (
        <UnsavedChangesDialog
          open={true}
          filename={unsavedDialog.filename}
          onSave={handleSaveAndClose}
          onDontSave={handleDontSave}
          onCancel={() => setUnsavedDialog(null)}
        />
      )}
    </div>
  )
}
