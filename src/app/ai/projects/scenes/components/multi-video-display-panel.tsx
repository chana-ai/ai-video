import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Copy, X, RefreshCw } from "lucide-react"
import { useState, useCallback, memo } from "react"
import type { CombinedVideo } from "../types"

interface MultiVideoDisplayPanelProps {
  combinedVideos: CombinedVideo[]
  isGenerating?: boolean
  onClose?: () => void
}

export function MultiVideoDisplayPanel({
  combinedVideos,
  isGenerating,
  onClose,
}: MultiVideoDisplayPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    combinedVideos.length > 0 ? combinedVideos[0].version : null
  )

  const selectedVideo = combinedVideos.find(video => video.version === selectedVersion)

  const handleCopyUrl = useCallback(async () => {
    if (selectedVideo?.url) {
      try {
        await navigator.clipboard.writeText(selectedVideo.url)
        // You could add a toast notification here
        console.log('URL copied to clipboard')
      } catch (err) {
        console.error('Failed to copy URL:', err)
      }
    }
  }, [selectedVideo?.url])

  const handleVersionChange = (version: string) => {
    setSelectedVersion(Number(version))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Multi-Video Preview</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Version Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Version:</label>
            <Select value={selectedVersion?.toString()} onValueChange={handleVersionChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {combinedVideos.map((video) => (
                  <SelectItem key={video.version} value={video.version.toString()}>
                    Version {video.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : selectedVideo?.url ? (
              <video 
                src={selectedVideo.url} 
                className="w-full h-full object-cover object-contain" 
                controls 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No video available
              </div>
            )}
          </div>

          {/* URL Display with Copy */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Video URL:</label>
            <div className="relative">
              <Textarea
                value={selectedVideo?.url || ''}
                readOnly
                className="pr-10 resize-none"
                rows={3}
                placeholder="No video URL available"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyUrl}
                disabled={!selectedVideo?.url}
                className="absolute top-2 right-2 h-6 w-6"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 