'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onSave: (value: string) => void;
}

export function PromptDialog({
  open,
  onOpenChange,
  initialValue,
  onSave,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue)

  // Update local state when initialValue changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSave = () => {
    onSave(value)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full min-h-[200px] p-4 border rounded-lg resize-none"
            placeholder="Enter prompt"
            maxLength={120}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

