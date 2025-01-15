import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Settings2, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import { ImagePreview } from "./image-preview"
import { VideoPreview } from "./video-preview"
import { SettingsDialog } from "./settings-dialog"
import { VideoSettingsDialog } from "./video-settings-dialog"
import type { ScenePanel as ScenePanelType } from "../types"

interface ScenePanelProps {
  panel: ScenePanelType
  isMaximized: boolean
  onMaximize: () => void
  onUpdate: (panel: ScenePanelType) => void
}

export function ScenePanel({ panel, isMaximized, onMaximize, onUpdate }: ScenePanelProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [isImageSettingsOpen, setIsImageSettingsOpen] = useState(false)
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [isImageSectionCollapsed, setIsImageSectionCollapsed] = useState(false)
  const [isVideoSectionCollapsed, setIsVideoSectionCollapsed] = useState(false)

  const handleTitleClick = () => {
    const currentTime = new Date().getTime()
    if (currentTime - lastClickTime < 300) { // Double click threshold
      onMaximize()
    }
    setLastClickTime(currentTime)
  }

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    onUpdate({
      ...panel,
      images: [...panel.images, '/placeholder.svg?height=400&width=600']
    })
    setIsGeneratingImage(false)
  }

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    onUpdate({
      ...panel,
      videos: [...panel.videos, '/placeholder.mp4']
    })
    setIsGeneratingVideo(false)
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${isMaximized ? 'col-span-full' : ''}`}>
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer" 
        onClick={handleTitleClick}
      >
        <h3 className="text-lg font-semibold">{panel.title}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Information</h4>
          </div>
          <Textarea
            value={panel.information}
            onChange={(e) => onUpdate({ ...panel, information: e.target.value })}
            className="min-h-[100px] mb-2"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsImageSettingsOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              className="flex-1"
              onClick={handleGenerateImage}
            >
              Generate Image
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Image</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsImageSectionCollapsed(!isImageSectionCollapsed)}
            >
              {isImageSectionCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!isImageSectionCollapsed && (
            <ImagePreview
              images={panel.images}
              currentIndex={panel.currentImageIndex}
              onIndexChange={(index) => onUpdate({ ...panel, currentImageIndex: index })}
              isLoading={isGeneratingImage}
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Video Control</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVideoSectionCollapsed(!isVideoSectionCollapsed)}
              >
                {isVideoSectionCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {!isVideoSectionCollapsed && (
            <>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsVideoSettingsOpen(true)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  className="flex-1"
                  onClick={handleGenerateVideo}
                >
                  Generate Video
                </Button>
              </div>
              <VideoPreview
                videos={panel.videos}
                currentIndex={panel.currentVideoIndex}
                onIndexChange={(index) => onUpdate({ ...panel, currentVideoIndex: index })}
                isLoading={isGeneratingVideo}
              />
            </>
          )}
        </div>
      </div>

      <SettingsDialog
        open={isImageSettingsOpen}
        onOpenChange={setIsImageSettingsOpen}
        value={panel.imagePrompt || ''}
        onSave={(value) => onUpdate({ ...panel, imagePrompt: value })}
        title="Image Settings"
      />

      <VideoSettingsDialog
        open={isVideoSettingsOpen}
        onOpenChange={setIsVideoSettingsOpen}
        onSave={(settings) => {
          onUpdate({
            ...panel,
            videoSettings: settings
          })
        }}
      />
    </div>
  )
}

