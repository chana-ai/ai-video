import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import type { VideoDisplayProps } from "../types"

export function VideoDisplayPanel({
  videoUrl,
  isGenerating,
  onDownload,
}: Omit<VideoDisplayProps, "open" | "onOpenChange" | "onConfirm">) {
  return (
    <div className="h-full w-full bg-white rounded-lg shadow-md p-4 flex flex-col">
      <h3 className="text-lg font-medium mb-4">Video Preview</h3>
      <div className="flex-grow">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
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
      </div>
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          disabled={isGenerating || !videoUrl}
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  )
}

