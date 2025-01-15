'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onSave: (value: string) => void;
}

export function PromptDialog({ open, onOpenChange, initialValue, onSave }: PromptDialogProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')

  const handleSave = () => {
    if (value.length > 200) {
      setError('Description must not exceed 200 words')
      return
    }
    onSave(value)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Character Prompt</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            className="min-h-[200px]"
            placeholder="Enter character description (max 200 words)"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

