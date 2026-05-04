import React from 'react'
import { EditorPane } from '../editor/EditorPane'

export function EditorArea() {
  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <EditorPane />
    </div>
  )
}
