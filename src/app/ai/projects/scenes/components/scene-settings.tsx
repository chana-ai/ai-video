"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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


import instance from "@/lib/axios";

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


  const [activeTab, setActiveTab] = useState<"prompt" | "prompt_cn">("prompt")

  const [videoPrompt, setVideoPrompt] = useState(scene?.video_prompt || "")
  const [videoPromptCN, setVideoPromptCN] = useState(scene?.video_prompt_cn || "")
  
  // const promptRef = useRef<HTMLTextAreaElement>(null)
  const generateVideoRef = useRef<HTMLButtonElement>(null)

  if (!scene) return null

  // useEffect(() => {
  //   console.log(`scene. prompt ${videoPrompt} and ${videoPromptCN} while the original ${scene.video_prompt}`)  
  // },
  //   [videoPrompt, videoPromptCN, title, description]
  // )
  

  const hasImage = Boolean(scene.image_url)

  const handleUploadClick = () => {
    if (scene.image_url) {
      setIsConfirmDialogOpen(true)
    } else {
      setIsUploadDialogOpen(true)
    }
  }

  const handleUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    onUpdate({ ...scene, image_url: imageUrl, isModified: true }, '')
    setIsUploadDialogOpen(false)
  }

  const handleGenerateImage = async () => {
    instance.post('/api/v2/scene/generateSceneImage', {
      scene_id: scene.id,
      project_id: scene.project_id,
      stage_id: scene.stage_id,
    }).then((res) => {
      console.log(`Scene ${scene.id} updated successfully.`);
      onUpdate({...scene, image_url: res.image_url, isModified: true}, '');
    }).catch( error => {
      console.error(`Error generating initial image: ${error.message}`);
    });
    
  }

  const handleGenerateVideoPrompt = async () =>{
    instance.post('/api/v2/scene/generateVideoPrompt', {
      scene_id: scene.id,
      stage_id: scene.stage_id,
      project_id: scene.project_id
    }).then((res) => {
      console.log(`Scene ${scene.id} video prompt ${res.video_prompt} updated successfully.`);
      onUpdate({...scene, video_prompt: res.video_prompt, video_prompt_cn: res.video_prompt_cn, isModified: true}, '')
      setVideoPrompt(res.video_prompt)
      setVideoPromptCN(res.video_prompt_cn)
      
    }).catch( error => {
      console.error(`Error generating initial image: ${error.message}`);
    });
  }

  const handleGenerateVideo = async (trigger: boolean = false) => {
    if(trigger)
      setIsGeneratingVideo(true)
    // Simulate API call
    instance.post('/api/v2/scene/createClip', {
      scene_id: scene.id,
      project_id: scene.project_id,
      stage_id: scene.stage_id,
      video_prompt: videoPrompt,
      video_prompt_cn: videoPromptCN,
      trigger: trigger
    }).then((res) => {
      console.log(`Scene ${scene.id} updated successfully.`);
      if(trigger){
        onUpdate({...scene, image_url: res.video_url, isModified: true}, '');
        setIsGeneratingVideo(false)
      }
      
    }).catch( error => {
      if(trigger)
        setIsGeneratingVideo(false)
      console.error(`Error generating initial image: ${error.message}`);
    });

    await new Promise((resolve) => setTimeout(resolve, 5000))
    
    onUpdate({
      ...scene,
      video_url: "/placeholder.mp4",
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
                className="min-h-[100px] resize-none"
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
                  onClick={handleGenerateImage}
                >
                  Generate Image
                </Button>
              </div>
              <div className="aspect-video bg-gray-200 rounded-lg">
                {scene.image_url && (
                  <img
                    src={scene.image_url || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
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
        
        <Panel defaultSize={50} minSize={20}>
          
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
                  //ref={generateVideoRef}
                  className="bg-purple-600 hover:bg-purple-700 relative"
                  onClick={ () => {
                    handleGenerateVideoPrompt()
                  }}
                  
                > Generate Video Prompt</Button>
              </div>
            </div>

        <div className="relative"></div>    
        <div className="relative">
             <h2 className="text-xl font-bold">生成的分镜视频提示词</h2>
             
             <div className="flex border-b">
                <button
                  className={`px-4 py-2 ${
                    activeTab === "prompt"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => {
                    setActiveTab("prompt")
                    console.log(`prompt: ${videoPrompt}`)
                  }
                }
                >
                  英文提示词
                </button>
                <button
                  className={`px-4 py-2 ${
                    activeTab === "prompt_cn"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => {
                    setActiveTab("prompt_cn")
                    console.log(`promptCN: ${videoPromptCN}`)
                  }}
                >
                  中文提示词
                </button>
              </div>


              <Textarea
                // ref={promptRef}
                value={activeTab === "prompt" ? (videoPrompt || scene.video_prompt) : (videoPromptCN || scene.video_prompt_cn)}
                onChange={(e) => (activeTab === "prompt" ? setVideoPrompt(e.target.value) : setVideoPromptCN(e.target.value))}
                placeholder={`Enter ${activeTab === "prompt" ? "prompt" : "prompt_cn"} here...`}
                className="min-h-[200px] resize-none"
              />
              
        </div>
        <div className="relative">
          <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log(' scene: {scene_id} and video_prompt: {video_prompt} and trigger: {trigger}')
                  handleGenerateVideo(videoPrompt, false)
                }}
              >
                保存
              </Button>
              <Button  disabled={!scene?.image_url} onClick={() => {
                  handleGenerateVideo(videoPrompt, true)
                }}>
                  保存并生成视频
              </Button>
            </div>
          </div>
        
          <div className="relative">
          <VideoDisplayPanel
            // id = {scene?.id}
            // video_prompt={videoPrompt || scene?.video_prompt}
            videoUrl={scene.video_url}
            isGenerating={isGeneratingVideo}
            onDownload={handleVideoDownload}
            onConfirm={(scene_id, video_prompt, trigger = false) => {
                console.log(' scene: {scene_id} and video_prompt: {video_prompt} and trigger: {trigger}')
                handleGenerateVideo(video_prompt, trigger)
            }}
          />
          </div>
        </Panel>
      </PanelGroup>

      {/* Upload Dialog */}
      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleUpload}
        existingImage={scene.image_url}
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
        settings={scene?.video_setting}
        onSave={ (video_setting)=> {
          onUpdate({ ...scene, video_setting: video_setting, isModified: true }, "video_setting")
        }
          
        }
      />
    </div>
  )
}

