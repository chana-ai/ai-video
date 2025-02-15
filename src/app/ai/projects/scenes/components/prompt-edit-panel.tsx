import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RightPanel } from "./right-panel"

interface PromptEditPanelProps {
  open: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

export function PromptEditPanel({ open, onClose, value, onChange, onSave }: PromptEditPanelProps) {
  return (
    <RightPanel
      open={open}
      onClose={onClose}
      title="Edit Prompt"
      className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
    >
      <div className="flex flex-col h-full">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-grow resize-none mb-4"
          placeholder="Enter scene prompt..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave()
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

