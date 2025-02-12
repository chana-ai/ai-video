import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RightPanel } from "./right-panel"
import { useEffect, useState } from "react"

interface PromptEditPanelProps {
  open: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
  onSave: (text: String) => void
}

export function PromptEditPanel({ open, onClose, value, onChange, onSave }: PromptEditPanelProps) {
  const [promptText, setPromptText] = useState(value || "")
 
  return (
    <RightPanel open={open} onClose={onClose} title="Edit prompt">
      <div className="space-y-4">
        <Textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className="min-h-[200px] resize-none"
          placeholder="Enter scene prompt here..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(promptText)
              onClose()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </RightPanel>
  )
}

