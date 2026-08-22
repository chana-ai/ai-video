import { RefreshCw } from "lucide-react"

import type { VideoDisplayProps } from "@/app/ai/projects/types"

export function VideoDisplayPanel({ scene, onClose, isGeneratingVideo }: VideoDisplayProps) {
  const showSpinner = Boolean(isGeneratingVideo)

  return (
    <div className="h-full w-full rounded-lg bg-white p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">Video Preview</h3>
        {showSpinner || onClose ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {showSpinner ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : null}
            {onClose ? (
              <button
                type="button"
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                onClick={onClose}
              >
                Close
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex-grow">
        <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100">
          {showSpinner ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : scene?.video_url ? (
            <video
              src={scene?.video_url}
              className="h-full w-full object-contain"
              controls
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No video available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
