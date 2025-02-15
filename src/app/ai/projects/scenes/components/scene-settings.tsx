"use client"

import { useState, useRef, useCallback } from "react"
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
import { Pen, Upload, Settings2, Mic } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { UploadDialog } from "./upload-dialog"
import { VideoSettingsPanel } from "./video-settings-panel"
import { VideoDisplayPanel } from "./video-display-panel"
import { PromptEditPanel } from "./prompt-edit-panel"
import type { SceneSettingsProps, VideoSettings } from "../types"

export function SceneSettings({
  scene,
  onUpdate,
}: Omit<SceneSettingsProps, "onVideoPreviewToggle" | "isVideoPreviewOpen">) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPromptEditOpen, setIsPromptEditOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)

  const [title, setTitle] = useState(scene?.title || "")
  const [description, setDescription] = useState(scene?.description ||"")
  const [prompt, setPrompt] = useState(scene?.prompt || "")
  
  // const promptRef = useRef<HTMLTextAreaElement>(null)
  const generateVideoRef = useRef<HTMLButtonElement>(null)

  if (!scene) return null
  console.log(`scene. descriptopm ${scene.description}`)
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


  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 5000))
    onUpdate({
      ...scene,
      videoUrl: "/placeholder.mp4",
      isModified: true,
    }, '')
    setIsGeneratingVideo(false)
  }

  const handleVideoDownload = () => {
    // Implement video download logic
    console.log("Downloading video...")
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-[1200px] mx-auto relative">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={70} minSize={30}>
          <div className="h-full bg-gray-50 p-4 sm:p-6 rounded-lg space-y-4 sm:space-y-6 overflow-y-auto">
            {/* Title Section */}
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditing(false)
                  onUpdate({ ...scene, title: title, isModified: true }, 'title')
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
              <Textarea
                // ref={promptRef}
                value={description ||scene.description}
                placeholder="Enter scene descrpiton"
                className="min-h-[120px] resize-none"
                onChange={ (e) => {setDescription(e.target.value)}}
                onBlur={() => onUpdate({ ...scene, description: description, isModified: true }, 'description')}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  //setEditedPrompt(scene.description)
                  setIsPromptEditOpen(true)
                }}
              >
                <Pen className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Section */}
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
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
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-medium">Video Control</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsVideoSettingsOpen(true)}>
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <Button
                  ref={generateVideoRef}
                  className="bg-purple-600 hover:bg-purple-700 relative"
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo || !hasImage}
                >
                  {isGeneratingVideo ? (
                    <>
                      Generate Video
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </>
                  ) : (
                    "Generate Video"
                  )}
                </Button>
              </div>
            </div>

            {/* Voice Section */}
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-medium">Voice</h3>
                <Mic className="h-4 w-4 text-gray-400" />
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-0"
                onClick={() => {
                  onUpdate({ ...scene, status: "voice_generating", isModified: true })
                }}
              >
                Generate Voice
              </Button>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

        <Panel defaultSize={30} minSize={20}>
          <VideoDisplayPanel
            videoUrl={scene.videoUrl}
            isGenerating={isGeneratingVideo}
            onDownload={handleVideoDownload}
          />
        </Panel>
      </PanelGroup>

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

      {/* Prompt Edit Panel */}
      <PromptEditPanel
        open={isPromptEditOpen}
        onClose={() => setIsPromptEditOpen(false)}
        value={prompt || scene.prompt}
        onChange={setPrompt}
        onSave={() => {
          // console.log(`prompt : ${prompt}`)
          onUpdate({ ...scene, prompt: prompt, isModified: true }, "prompt")
        }}
      />

      {/* Video Settings Panel */}
      <VideoSettingsPanel
        open={isVideoSettingsOpen}
        onOpenChange={setIsVideoSettingsOpen}
        settings={scene.videoSettings}
        onSave={ (video_setting)=> {
          onUpdate({ ...scene, video_setting: video_setting, isModified: true }, "video_setting")
        }
          
        }
      />
    </div>
  )
}

