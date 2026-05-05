import React, { useCallback } from 'react'
import { TitleBar }         from './TitleBar'
import { ActivityBar }      from './ActivityBar'
import { Sidebar }          from './Sidebar'
import { EditorArea }       from './EditorArea'
import { PanelArea }        from './PanelArea'
import { StatusBar }        from './StatusBar'
import { ResizableDivider } from './ResizableDivider'
import { useUIStore }       from '../../store/uiStore'

export function RootLayout() {
  const {
    sidebarVisible, panelVisible,
    setSidebarWidth, setPanelHeight,
  } = useUIStore()

  const onSidebarResize = useCallback((delta: number) => {
    setSidebarWidth(useUIStore.getState().sidebarWidth + delta)
  }, [setSidebarWidth])

  const onPanelResize = useCallback((delta: number) => {
    setPanelHeight(useUIStore.getState().panelHeight - delta)
  }, [setPanelHeight])

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#1a1620]">
      {/* Title bar */}
      <TitleBar />

      {/* Main area: activity bar + sidebar + editor + panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Activity bar */}
        <ActivityBar />

        {/* Sidebar */}
        {sidebarVisible && (
          <>
            <Sidebar />
            <ResizableDivider orientation="vertical" onResize={onSidebarResize} />
          </>
        )}

        {/* Editor + bottom panel column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <EditorArea />

          {panelVisible && (
            <>
              <ResizableDivider orientation="horizontal" onResize={onPanelResize} />
              <PanelArea />
            </>
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
