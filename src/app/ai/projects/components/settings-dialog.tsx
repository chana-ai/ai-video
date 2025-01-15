import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import type { SettingsDialogProps } from "../types"

export function SettingsDialog({ open, onOpenChange, value, onSave, title }: SettingsDialogProps) {
  const [currentValue, setCurrentValue] = useState(value)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onSave(currentValue)
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

