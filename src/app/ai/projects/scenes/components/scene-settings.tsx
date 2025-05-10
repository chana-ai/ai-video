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
import type { SceneSettingsProps, VideoSettings, VoiceSettings } from "../types"
import { VoiceSettingsPanel } from "./voice-settings-panel"

import instance from "@/lib/axios";


export function SceneSettings({
  scene,
  onUpdate,
}: Omit<SceneSettingsProps, "onVideoPreviewToggle" | "isVideoPreviewOpen">) {

  // if (!scene) return null

  const [isEditing, setIsEditing] = useState(false)
  const [isPromptEditOpen, setIsPromptEditOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [imageUrl, setImageUrl] = useState()
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false)

  const [title, setTitle] = useState(scene?.title || "")
  const [description, setDescription] = useState(scene?.description ||"")
  const [prompt, setPrompt] = useState<string>(scene?.prompt || "")
  const [videoSetting, setVideoSetting] = useState<VideoSettings>()
  const [voiceMenu, setVoiceMenu] = useState({} as { [key: string]: string })


  const [activeTab, setActiveTab] = useState<"prompt" | "prompt_cn">("prompt")

  const [isLoading, setIsLoading] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState(scene?.video_prompt || "")
  const [isVideoPrompt, setIsVideoPrompt] = useState(false)
  const [videoPromptCN, setVideoPromptCN] = useState(scene?.video_prompt_cn || "")
  const [isVideoPromptCN, setIsVideoPromptCN] = useState(false)

  // const promptRef = useRef<HTMLTextAreaElement>(null)
  const generateVideoRef = useRef<HTMLButtonElement>(null)

  console.log("scene in scene-settings is  ", scene)




  useEffect(() => {
    setVideoPrompt(scene?.video_prompt)
    setVideoPromptCN(scene?.video_prompt_cn)
    setDescription(scene?.description)
    // setVideoPromptCN(scene?.video_prompt_cn)
    setVideoSetting(scene?.video_setting)
    setImageUrl(scene?.image_url)
    setVideoPrompt(scene?.voice_setting)
    // console.log(`scene. prompt ${videoPrompt} and ${videoPromptCN} while the original ${scene.video_prompt}`)

    instance.post("/api/v2/voice/list_voices", {
      project_id: scene?.project_id,
      stage_id: scene?.stage_id
    }).then((res) => {
      setVoiceMenu(res)
    })
  },
    [scene?.project_id, scene?.stage_id, scene?.video_prompt, scene?.description, scene?.video_prompt_cn]
  )


  const hasImage = Boolean(scene?.image_url)

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
      setImageUrl(res.image_url)
      onUpdate({...scene, image_url: res.image_url, isModified: true}, '');
    }).catch( error => {
      console.error(`Error generating initial image: ${error.message}`);
    });

  }

  const handleGenerateVideoPrompt = async () =>{
    setIsLoading(true);
    instance.post('/api/v2/scene/generateVideoPrompt', {
      scene_id: scene.id,
      stage_id: scene.stage_id,
      project_id: scene.project_id
    }).then((res) => {
      console.log(`Scene ${scene.id} video prompt ${res.video_prompt} updated successfully.`);
      onUpdate({...scene, video_prompt: res.video_prompt, video_prompt_cn: res.video_prompt_cn, isModified: true}, '')
      setVideoPrompt(res.video_prompt)
      setVideoPromptCN(res.video_prompt_cn)
      setIsLoading(false);
    }).catch( error => {
      console.error(`Error generating initial image: ${error.message}`);
    });
  }

  const handleGenerateVideo = async (regenerate_prompt: boolean = false) => {
    setIsGeneratingVideo(true)
    let data = {
        scene_id: scene?.id,
        project_id: scene?.project_id,
        stage_id: scene?.stage_id,
        regenerate_prompt: regenerate_prompt
    }

    if(isVideoPrompt && regenerate_prompt == false){
        data['video_prompt'] = videoPrompt;
    }
    // if(isVideoPromptCN){
    //   data['video_prompt_cn'] = videoPromptCN;
    // }

    instance.post('/api/v2/scene/createClip', data).then((res) => {
        if(regenerate_prompt){
          // 重新生成的
          onUpdate({...scene, video_prompt: res.video_prompt, video_prompt_cn: videoPromptCN, isModified: true}, "");
        }else{
          onUpdate({...scene, video_prompt: videoPrompt, video_prompt_cn: videoPromptCN, isModified: false}, "");
        }

        setIsVideoPrompt(false)
        // setIsVideoPromptCN(false)
        setIsGeneratingVideo(false)
    }).catch( error => {
        setIsGeneratingVideo(false)
        setIsVideoPrompt(false)
        setIsVideoPromptCN(false)

        console.error(`Error generating initial image: ${error.message}`);
    });

  }

  const handleSavePromptes = () =>{
    let data = {
      scene_id: scene?.id,
      stage_id: scene?.stage_id,
      project_id: scene?.project_id
    }

    if(isVideoPrompt){
      data['video_prompt'] = videoPrompt;
    }

    if(isVideoPromptCN){
      data['video_prompt_cn'] = videoPromptCN;
    }

    instance.post('/api/v2/scene/savePrompts',
        data
    ).then((res) => {
        setIsVideoPrompt(false)
        setIsVideoPromptCN(false)

    }).catch( error => {
        setIsVideoPrompt(false)
        setIsVideoPromptCN(false)

        console.error(`Error generating initial image: ${error.message}`);
    });
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
                value={description|| ""}
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
                {imageUrl && (
                  <img
                    src= {imageUrl || "/placeholder.svg"}
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
                <Mic className="h-4 w-4 text-gray-400" onClick={ () => setIsVoiceSettingsOpen(true)}/>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-0"
                onClick={() => {
                  onUpdate({ ...scene, status: "voice_generating", isModified: true }, '')
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
                  disabled={isLoading}
                  ref={generateVideoRef}
                  className="bg-purple-600 hover:bg-purple-700 relative"
                  onClick={async () => {
                    handleGenerateVideoPrompt();

                  }}
                > Generate Video Prompt</Button>
              </div>
            </div>

        <div className="relative"></div>
        <div className="relative">
             {/* <h2 className="text-xl font-bold">生成的分镜视频提示词</h2> */}

             <div className="flex border-b">

              </div>

              <div className="relative">
                <Textarea
                  value={videoPromptCN}
                  placeholder={`Ente here...`}
                  className="min-h-[200px] resize-none "
                  disabled={isLoading}
                  onChange={(e) => {
                    setVideoPrompt(e.target.value), setIsVideoPrompt(true)
                  }}
                />

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-block w-6 h-6 border-4 border-gray-200 rounded-full border-t-purple-600 animate-spin" />
                  </div>
                )}
              </div>
        </div>
        <div className="relative">
          <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                disabled = {isVideoPrompt == false && isVideoPromptCN == false}
                onClick={() => {
                  setIsVideoPrompt(false)
                  setIsVideoPromptCN(false)
                  console.log('scene: {scene_id} and video_prompt: {video_prompt} and trigger: {trigger}')
                  handleSavePromptes(false)
                }}
              >
                仅保存
              </Button>
              <Button  disabled={ !(scene?.image_url !=null && videoPrompt!=null) } onClick={() => {
                  handleGenerateVideo()
                }}>
                  生成视频
              </Button>
              {/* <Button  disabled={!(scene?.image_url!=null && videoPromptCN!=null && isVideoPromptCN)}
                  onClick = { ()=> handleGenerateVideo(true)}
                >
                  使用中文并生成视频
              </Button> */}
            </div>
          </div>

          <div className="relative">
          <VideoDisplayPanel
            // id = {scene?.id}
            // video_prompt={videoPrompt || scene?.video_prompt}
            videoUrl={scene?.video_url}
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
        value={prompt}
        onChange={setPrompt}
        onSave={() => {
          // console.log(`prompt : ${prompt}`)
          if(!prompt){
            return
          }
          onUpdate({ ...scene, prompt: prompt, isModified: true }, "prompt")
        }}
      />

      {/* Video Settings Panel */}
      <VideoSettingsPanel
        open={isVideoSettingsOpen}
        onOpenChange={setIsVideoSettingsOpen}
        settings={videoSetting}
        onSave={ (video_setting)=> {
          onUpdate({ ...scene, video_setting: video_setting, isModified: true }, "video_setting")
        }

        }
      />

      {/* Voice Settings Panel - Only renders when isVoiceSettingsOpen is true */}
      {isVoiceSettingsOpen  && scene?.project_id && scene?.stage_id && (
        <VoiceSettingsPanel
          open={isVoiceSettingsOpen}
          onOpenChange={setIsVoiceSettingsOpen}
          settings={scene?.voice_setting}
          voice_menu={voiceMenu}
          project_id={scene?.project_id?.toString()}
          stage_id = {scene?.stage_id?.toString()}
          subtitle={scene?.description}
          voice_url={scene?.voice_url}
          scene_id={scene.id}
          onGenerate={ (voice_path: string) => {
             scene.voice_url = voice_path
          }}
          onSave={(settings) => {
            instance.post('/api/v2/voice/update_voice_config', {
              project_id: scene?.project_id,
              stage_id: scene?.stage_id,
              voice_name: settings.voice_name,
              scene_id: scene.id
            }).then(() => {
                console.log('update config success')
                scene.voice_setting = settings
            // setVoiceSettings(settings)
              console.log('.............', scene.voice_setting)
            })

          }}
        />
      )}
    </div>
  )
}

// /* You can add this to your CSS file or in a <style jsx> block */
// .spinner {
//   border: 4px solid #f3f3f3;
//   border-top: 4px solid #3498db;
//   border-radius: 50%;
//   width: 24px;
//   height: 24px;
//   animation: spin 1s linear infinite;
// }
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }

