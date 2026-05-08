import React, { useCallback } from 'react'
import { TitleBar }         from './TitleBar'
import { ActivityBar }      from './ActivityBar'
import { Sidebar }          from './Sidebar'
import { EditorArea }       from './EditorArea'
import { PanelArea }        from './PanelArea'
import { StatusBar }        from './StatusBar'
import { ResizableDivider } from './ResizableDivider'
import { AIChatPanel }      from '../ai/AIChatPanel'
import { useUIStore }       from '../../store/uiStore'

export function RootLayout() {
  const {
    sidebarVisible, panelVisible, secondarySidebarVisible,
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
      <TitleBar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Activity bar */}
        <ActivityBar />

        {/* Primary sidebar */}
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

        {/* Secondary sidebar — AI Chat */}
        {secondarySidebarVisible && (
          <div className="flex flex-col shrink-0 overflow-hidden rounded-xl ml-2"
            style={{ width: 320, backgroundColor: '#28242e' }}>
            <AIChatPanel />
          </div>
        )}
      </div>

      <StatusBar />
    </div>
  )
}
