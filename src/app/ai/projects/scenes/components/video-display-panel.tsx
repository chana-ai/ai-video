import { Button } from "@/components/ui/button"
import { Download, Check, RefreshCw } from "lucide-react"
import { RightPanel } from "./right-panel"
import type { VideoDisplayProps } from "../types"

export function VideoDisplayPanel({
  open,
  onOpenChange,
  videoUrl,
  isGenerating,
  onDownload,
  onConfirm,
}: VideoDisplayProps) {
  return (
    <RightPanel open={open} onClose={() => onOpenChange(false)} title="Video Preview">
      <div className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : videoUrl ? (
            <video src={videoUrl} className="w-full h-full object-cover" controls />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">No video available</div>
          )}
        </div>
        <div className="flex justify-between">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={isGenerating || !videoUrl}
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button className="flex items-center gap-2" disabled={isGenerating || !videoUrl} onClick={onConfirm}>
            <Check className="h-4 w-4" />
            OK
          </Button>
        </div>
      </div>
    </RightPanel>
  )
}

