import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RightPanel } from "./right-panel"

interface DescriptionEditPanelProps {
  open: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

export function DescriptionEditPanel({ open, onClose, value, onChange, onSave }: DescriptionEditPanelProps) {
  return (
    <RightPanel open={open} onClose={onClose} title="Edit Description">
      <div className="space-y-4">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[200px] resize-none"
          placeholder="Enter scene description..."
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

