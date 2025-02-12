"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pen, Upload, Settings2, RefreshCw, ChevronLeft, ChevronRight, Mic } from "lucide-react"
import { UploadDialog } from "./upload-dialog"
import { VideoSettingsPanel } from "./video-settings-panel"
import { VideoDisplayPanel } from "./video-display-panel"
import { PromptEditPanel } from "./prompt-edit-panel"
import type { SceneSettingsProps, VideoSettings } from "../types"

export function SceneSettings({ scene, onUpdate, onVideoPreviewToggle, isVideoPreviewOpen }: SceneSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPromptEditOpen, setIsPromptEditOpen] = useState(false)
  const [prompt, setPrompt] = useState(scene?.prompt || "")

  // const [description, setDescription] = useState(scene?.description || "")

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [title, setTitle] = useState(scene?.title || "")
  

  if (!scene) return null

  const hasImage = Boolean(scene.imageUrl)

  const handleUploadClick = () => {
    if (scene.imageUrl) {
      setIsConfirmDialogOpen(true)
    } else {
      setIsUploadDialogOpen(true)
    }
  }

  const handleUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    onUpdate({ ...scene, imageUrl, isModified: true })
    setIsUploadDialogOpen(false)
  }

  const handleVideoSettingsSave = (settings: VideoSettings) => {
    onUpdate({ ...scene, videoSettings: settings, isModified: true })
  }

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true)
    onVideoPreviewToggle()
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 5000))
    onUpdate({
      ...scene,
      videoUrl: "/placeholder.mp4",
      isModified: true,
    })
    setIsGeneratingVideo(false)
  }

  const handleVideoDownload = () => {
    // Implement video download logic
    console.log("Downloading video...")
  }

  const handleVideoConfirm = () => {
    onVideoPreviewToggle()
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-6 max-w-3xl">
      {/* Title Section */}
      {isEditing ? (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            setIsEditing(false)
            onUpdate({ ...scene, title: title, isModified: true })
          }}
          autoFocus
          className="text-xl font-bold"
        />
      ) : (
        <h2 className="text-xl font-bold cursor-pointer" onClick={() => setIsEditing(true)}>
          {scene.title}
        </h2>
      )}

      {/* Description Section */}
      <div className="relative">
        <Textarea value={scene.description} placeholder="办公室场景" className="min-h-[120px] resize-none" 
          onChange={ (e) =>{
            onUpdate({...scene, description: e.target.value, isModified: true})
          }
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => {
            setIsPromptEditOpen(true)
          }}
        >
          <Pen className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Section */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleUploadClick}>
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              onUpdate({ ...scene, status: "image_generating", isModified: true })
            }}
          >
            Generate Image
          </Button>
        </div>
        <div className="aspect-video bg-gray-200 rounded-lg">
          {scene.imageUrl && (
            <img
              src={scene.imageUrl || "/placeholder.svg"}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          )}
        </div>
      </div>

      {/* Video Control Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">Video Control</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsVideoSettingsOpen(true)}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onVideoPreviewToggle}>
            {isVideoPreviewOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleGenerateVideo}
            disabled={isGeneratingVideo || !hasImage}
          >
            {isGeneratingVideo ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
            Generate Video
          </Button>
        </div>
      </div>

      {/* Voice Section */}
      {/* <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">Voice</h3>
          <Mic className="h-4 w-4 text-gray-400" />
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => {
            onUpdate({ ...scene, status: "voice_generating", isModified: true })
          }}
        >
          Generate Voice
        </Button>
      </div> */}

      {/* Upload Dialog */}
      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleUpload}
        existingImage={scene.imageUrl}
      />

      {/* Confirm Replace Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will replace the current image. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsConfirmDialogOpen(false)
                setIsUploadDialogOpen(true)
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Description Edit Panel */}
      <PromptEditPanel
        open={isPromptEditOpen}
        onClose={() => setIsPromptEditOpen(false)}
        value={prompt || scene.prompt}
        onChange={setPrompt}
        onSave={(promptText) => {
          onUpdate({ ...scene, prompt: promptText, isModified: true })
          console.log("................", promptText)
        }}
      />

      {/* Video Settings Panel */}
      <VideoSettingsPanel
        open={isVideoSettingsOpen}
        onOpenChange={setIsVideoSettingsOpen}
        settings={scene.videoSettings}
        onSave={handleVideoSettingsSave}
      />

      {/* Video Display Panel */}
      <VideoDisplayPanel
        open={isVideoPreviewOpen}
        onOpenChange={onVideoPreviewToggle}
        videoUrl={scene.videoUrl}
        isGenerating={isGeneratingVideo}
        onDownload={handleVideoDownload}
        onConfirm={handleVideoConfirm}
      />
    </div>
  )
}

