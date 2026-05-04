import React from 'react'
import { Dialog } from '../ui/Dialog'

export interface UnsavedChangesDialogProps {
  open:       boolean
  filename:   string
  onSave:     () => void
  onDontSave: () => void
  onCancel:   () => void
}

export function UnsavedChangesDialog({
  open,
  filename,
  onSave,
  onDontSave,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Unsaved Changes"
      closeOnBackdrop={false}
      width="w-[420px]"
      actions={[
        { label: 'Cancel',     variant: 'ghost',   onClick: onCancel },
        { label: "Don't Save", variant: 'danger',  onClick: onDontSave },
        { label: 'Save',       variant: 'primary', onClick: onSave },
      ]}
    >
      <p className="text-sm text-[#d4d4d4]">
        Do you want to save the changes you made to{' '}
        <span className="font-semibold text-[#d4d4d4]">{filename}</span>?
      </p>
      <p className="text-xs text-[#6e6e6e] mt-2">
        Your changes will be lost if you don't save them.
      </p>
    </Dialog>
  )
}
