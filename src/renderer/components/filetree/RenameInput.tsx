import React from 'react'
import { NewFileInput } from './NewFileInput'

export interface RenameInputProps {
  depth:     number
  oldName:   string
  onConfirm: (newName: string) => void
  onCancel:  () => void
}

export function RenameInput({ depth, oldName, onConfirm, onCancel }: RenameInputProps) {
  return (
    <NewFileInput
      depth={depth}
      initialValue={oldName}
      placeholder={oldName}
      onConfirm={onConfirm}
      onCancel={onCancel}
      selectBasename={true}
    />
  )
}
