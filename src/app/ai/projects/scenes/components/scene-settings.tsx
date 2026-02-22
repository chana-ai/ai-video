"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { Settings2, Users, Check } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { VideoSettingsPanel } from "./video-settings-panel"
import { VideoDisplayPanel } from "./video-display-panel"
import { PromptEditPanel } from "./prompt-edit-panel"
import type { SceneSettingsProps, VideoSettings, VoiceSettings } from "../types"
import { VoiceSettingsPanel } from "./voice-settings-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import instance from "@/lib/axios";

const POLL_INTERVAL_MS = 15000

type VideoModel = 'MINMAX' | 'WAN'

interface Character {
  id: number
  name: string
}

export function SceneSettings({
  scene,
  onUpdate,
}: Omit<SceneSettingsProps, "onVideoPreviewToggle" | "isVideoPreviewOpen">) {

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isPromptEditOpen, setIsPromptEditOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false)

  const [title, setTitle] = useState(scene?.title || "")
  const [description, setDescription] = useState(scene?.description || "")
  const [prompt, setPrompt] = useState<string>(scene?.prompt || "")
  const [videoSetting, setVideoSetting] = useState<VideoSettings>()

  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const [isLoading, setIsLoading] = useState(false);
  const [isVideoPromptChanged, setIsVideoPromptChanged] = useState(false)
  const [videoPrompt, setVideoPrompt] = useState(scene?.video_prompt || "")

  // Video model selection
  const [videoModel, setVideoModel] = useState<VideoModel>('MINMAX')

  // Ref characters dialog state
  const [isRefCharsOpen, setIsRefCharsOpen] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharIds, setSelectedCharIds] = useState<Set<number | 'NONE'>>(new Set<number | 'NONE'>(['NONE']))
  const [pendingCharIds, setPendingCharIds] = useState<Set<number | 'NONE'>>(new Set<number | 'NONE'>(['NONE']))

  const generateVideoRef = useRef<HTMLButtonElement>(null)
  const refCharsDialogRef = useRef<HTMLDivElement>(null)

  //Following are error messages
  const [generatingImageError, setGeneratingImageError] = useState<string | false>(false)
  const [clipErrorMessage, setClipErrorMessage] = useState<string | false>(false)

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasPendingGenerationRef = useRef(false)

  const sceneIdentifiers = useMemo(() => {
    if (!scene?.id || !scene?.project_id || !scene?.stage_id) {
      return null
    }

    return {
      sceneId: scene.id,
      projectId: scene.project_id,
      stageId: scene.stage_id,
    }
  }, [scene?.id, scene?.project_id, scene?.stage_id])

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const fetchSceneStatus = useCallback(async (): Promise<boolean> => {
    if (!sceneIdentifiers) {
      setIsGeneratingVideo(false)
      clearPollTimer()
      return false
    }

    try {
      const { projectId, stageId, sceneId } = sceneIdentifiers
      const response = await instance.get(
        `/api/v2/task/scene_status?project_id=${projectId}&stage_id=${stageId}&scene_id=${sceneId}`
      )

      const records = Array.isArray(response) ? response : response ? [response] : []
      const matchedScene = records.find(
        (entry: any) => `${entry.scene_id ?? entry.sceneId}` === `${sceneId}`
      )

      if (!matchedScene) {
        if (!hasPendingGenerationRef.current) {
          setIsGeneratingVideo(false)
          clearPollTimer()
        }
        return hasPendingGenerationRef.current
      }

      const status = `${matchedScene.status ?? ""}`.toUpperCase()
      const remoteVideoUrl = matchedScene.video_url ?? matchedScene.videoUrl
      const isProcessing = ["PROCESSING", "PENDING", "INIT"].includes(status)

      if (isProcessing) {
        hasPendingGenerationRef.current = true
        setIsGeneratingVideo(true)
        return true
      }

      hasPendingGenerationRef.current = false

      if (["COMPLETE"].includes(status) && remoteVideoUrl) {
        if (remoteVideoUrl != scene?.video_url) {
          onUpdate("video_url", remoteVideoUrl)
        }

        setIsGeneratingVideo(false)
        clearPollTimer()
        return false
      }
      setIsGeneratingVideo(false)
      clearPollTimer()
      return false
    } catch (error) {
      console.error("Failed to fetch scene status", error)
      return hasPendingGenerationRef.current
    }
  }, [clearPollTimer, onUpdate, sceneIdentifiers])

  const startPolling = useCallback(() => {
    if (!sceneIdentifiers) {
      return
    }

    if (!pollTimerRef.current) {
      pollTimerRef.current = setInterval(() => {
        fetchSceneStatus()
      }, POLL_INTERVAL_MS)
    }
  }, [fetchSceneStatus, sceneIdentifiers])

  useEffect(() => {
    setVideoPrompt(scene?.video_prompt || '')
    setDescription(scene?.description || '')
    setTitle(scene?.title || '')
    setVideoSetting(scene?.video_setting)
    setPrompt(scene?.prompt || '')
  },
    [scene]
  )

  useEffect(() => {
    hasPendingGenerationRef.current = false
    clearPollTimer()
    setIsGeneratingVideo(false)

    if (!sceneIdentifiers) {
      return
    }

    let isActive = true

    const initialize = async () => {
      const inProgress = await fetchSceneStatus()
      if (!isActive) {
        return
      }
      if (inProgress) {
        startPolling()
      }
    }

    initialize()

    return () => {
      isActive = false
      clearPollTimer()
    }
  }, [sceneIdentifiers])

  // Fetch characters when scene changes (project_id / stage_id available)
  useEffect(() => {
    if (!scene?.project_id || !scene?.stage_id) return
    instance.get(`/api/v2/character/list?project_id=${scene.project_id}&stage_id=${scene.stage_id}`)
      .then((res: any) => {
        setCharacters(res.characters || [])
      })
      .catch((err) => {
        console.error("Failed to fetch characters:", err)
      })
  }, [scene?.project_id, scene?.stage_id])

  // Close ref chars dialog on outside click
  useEffect(() => {
    if (!isRefCharsOpen) return
    const handler = (e: MouseEvent) => {
      if (refCharsDialogRef.current && !refCharsDialogRef.current.contains(e.target as Node)) {
        setIsRefCharsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isRefCharsOpen])

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true)
    instance.post('/api/v2/scene/generateSceneImage', {
      scene_id: scene?.id,
      project_id: scene?.project_id,
      stage_id: scene?.stage_id,
    }).then((res: any) => {
      console.log(`Scene ${scene?.id} updated successfully.`);
      onUpdate("image_url", res.image_url);
      setIsGeneratingImage(false)
    }).catch(error => {
      console.error(`Error generating initial image: ${error.message}`);
      setIsGeneratingImage(false)
      setGeneratingImageError(error.message)
    });
  }

  const handleGenerateVideoPrompt = async () => {
    setIsLoading(true);
    instance.post('/api/v2/scene/generateVideoPrompt', {
      scene_id: scene?.id,
      stage_id: scene?.stage_id,
      project_id: scene?.project_id,
      video_model: videoModel,
    }).then((res: any) => {
      onUpdate("video_prompt", res.video_prompt)
      setIsLoading(false);
    }).catch(error => {
      console.error(`Error generating video prompt: ${error.message}`);
      setIsLoading(false);
    });
  }

  const handleGenerateVideo = useCallback(
    async (regenerate_prompt: boolean = false) => {
      if (!scene?.id || !scene?.project_id || !scene?.stage_id) {
        return
      }

      setClipErrorMessage(false)
      setIsGeneratingVideo(true)
      hasPendingGenerationRef.current = true

      const payload = {
        scene_id: scene.id,
        project_id: scene.project_id,
        stage_id: scene.stage_id,
        regenerate_prompt,
        video_prompt: videoPrompt,
        video_model: videoModel,
      }

      try {
        await instance.post("/api/v2/scene/createClip", payload)
        if (isVideoPromptChanged) {
          onUpdate("video_prompt", videoPrompt)
          setIsVideoPromptChanged(false)
        }
        await fetchSceneStatus()
        startPolling()
      } catch (error: any) {
        hasPendingGenerationRef.current = false
        setIsGeneratingVideo(false)
        clearPollTimer()
        console.error(`Error generating clip: ${error?.message ?? error}`)
        const response = error?.response?.data
        if (response?.code === 533) {
          setClipErrorMessage(response.message as string)
        } else {
          setClipErrorMessage("系统开了小差，联系下管理员，或者稍后再试")
        }
      }
    },
    [
      clearPollTimer,
      fetchSceneStatus,
      isVideoPromptChanged,
      onUpdate,
      scene?.id,
      scene?.project_id,
      scene?.stage_id,
      startPolling,
      videoPrompt,
      videoModel,
    ]
  )

  const handleSavePromptes = () => {
    if (isVideoPromptChanged == false) {
      return
    }
    let data = {
      scene_id: scene?.id,
      stage_id: scene?.stage_id,
      project_id: scene?.project_id,
      video_prompt: videoPrompt
    }

    instance.post('/api/v2/scene/savePrompts',
      data
    ).then((res) => {
      console.log("save prompts success")
      onUpdate("video_prompt", videoPrompt)
      setIsVideoPromptChanged(false)
    }).catch(error => {
      console.error(`Error saving prompts: ${error.message}`);
      let response = error.response.data
      setClipErrorMessage(response.message)
      setIsVideoPromptChanged(false)
    });
  }

  const handleOpenRefChars = () => {
    setPendingCharIds(new Set(selectedCharIds))
    setIsRefCharsOpen(true)
  }

  const handleConfirmRefChars = () => {
    setSelectedCharIds(new Set(pendingCharIds))
    setIsRefCharsOpen(false)
    // TODO: persist selection to backend if needed
    // instance.post('/api/v2/scene/set_ref_characters', { scene_id: scene?.id, character_ids: [...pendingCharIds].filter(id => id !== 'NONE') })
  }

  const togglePendingChar = (id: number | 'NONE') => {
    setPendingCharIds(prev => {
      const next = new Set<number | 'NONE'>(prev)
      if (id === 'NONE') {
        return new Set<number | 'NONE'>(['NONE'])
      }
      next.delete('NONE')
      if (next.has(id)) {
        next.delete(id)
        if (next.size === 0) next.add('NONE')
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-[1200px] mx-auto relative">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={70} minSize={30}>
          <div className="h-full bg-gray-50 p-4 sm:p-6 rounded-lg space-y-4 sm:space-y-6 overflow-y-auto">

            {/* ── Title & Description side-by-side ── */}
            <div className="flex gap-4 items-start">
              {/* Title */}
              {/* <div className="flex-1 min-w-0">
                <Label className="text-xs text-gray-500 mb-1 block">标题</Label>
                {isEditingTitle ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      onUpdate("title", title)
                      setIsEditingTitle(false)
                    }}
                    autoFocus
                    className="text-sm font-semibold"
                  />
                ) : (
                  <p
                    className="text-sm font-semibold cursor-pointer px-3 py-2 rounded-md border border-transparent hover:border-gray-300 hover:bg-white transition-colors truncate"
                    title={title}
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {title || <span className="text-gray-400 italic">点击编辑标题</span>}
                  </p>
                )}
              </div> */}

              {/* Description */}
              <div className="flex-[2] min-w-0">
                {/* <Label className="text-xs text-gray-500 mb-1 block">描述</Label> */}
                {isEditingDescription ? (
                  <Textarea
                    value={description}
                    placeholder="输入场景描述"
                    className="min-h-[80px] resize-none text-sm"
                    autoFocus
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => {
                      onUpdate("description", description)
                      setIsEditingDescription(false)
                    }}
                  />
                ) : (
                  <p
                    className="text-sm cursor-pointer px-3 py-2 rounded-md border border-transparent hover:border-gray-300 hover:bg-white transition-colors min-h-[38px] whitespace-pre-wrap"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {description || <span className="text-gray-400 italic">点击编辑描述</span>}
                  </p>
                )}
              </div>
            </div>

            {/* ── Prompt textarea (replaces PromptEditPanel trigger) ── */}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">图像提示词</Label>
              <Textarea
                value={prompt}
                placeholder="输入图像提示词..."
                className="min-h-[100px] resize-none"
                onChange={(e) => setPrompt(e.target.value)}
                onBlur={() => {
                  if (prompt) onUpdate("image_prompt", prompt)
                }}
              />
            </div>

            {/* ── Image Section ── */}
            <div>
              {/* Action buttons row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Select Ref Characters button + floating dialog */}
                <div className="relative" ref={refCharsDialogRef}>
                  {/* <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleOpenRefChars}
                  >
                    <Users className="h-4 w-4" />
                    选择参考角色
                    {selectedCharIds.size > 0 && !selectedCharIds.has('NONE') && (
                      <span className="ml-1 bg-purple-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                        {selectedCharIds.size}
                      </span>
                    )}
                  </Button> */}

                  {/* Floating dialog */}
                  {isRefCharsOpen && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white border rounded-lg shadow-xl p-4">
                      <p className="text-sm font-medium mb-3 text-gray-700">选择参考角色</p>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {/* NONE option */}
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1.5">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${pendingCharIds.has('NONE')
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300'
                              }`}
                            onClick={() => togglePendingChar('NONE')}
                          >
                            {pendingCharIds.has('NONE') && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm text-gray-600">无 (NONE)</span>
                        </label>

                        {/* Character list */}
                        {characters.map((char) => (
                          <label key={char.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1.5">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${pendingCharIds.has(char.id)
                                ? 'bg-purple-600 border-purple-600'
                                : 'border-gray-300'
                                }`}
                              onClick={() => togglePendingChar(char.id)}
                            >
                              {pendingCharIds.has(char.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm truncate">{char.name}</span>
                          </label>
                        ))}

                        {characters.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">暂无角色</p>
                        )}
                      </div>

                      <Button
                        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 h-8 text-sm"
                        onClick={handleConfirmRefChars}
                      >
                        确认
                      </Button>
                    </div>
                  )}
                </div>

                {/* Generate Image button */}
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  Generate Image
                </Button>

                {generatingImageError && (
                  <div style={{ color: 'red' }} className="text-sm">{generatingImageError}</div>
                )}
              </div>

              <div className="aspect-video bg-gray-200 rounded-lg">
                {scene?.image_url && (
                  <img
                    src={scene?.image_url || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full rounded-lg object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

        <Panel defaultSize={50} minSize={20}>

          {/* ── Video Control Section ── */}
          <div className="flex flex-wrap items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h3 className="font-medium">Video Control</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsVideoSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Video model radio + Generate Video Prompt — horizontal row */}
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <Select value={videoModel} onValueChange={(v: string) => setVideoModel(v as VideoModel)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="选择视频模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINMAX">MINMAX</SelectItem>
                  <SelectItem value="WAN">WAN</SelectItem>
                </SelectContent>
              </Select>

              <Button
                disabled={isLoading}
                ref={generateVideoRef}
                className="bg-purple-600 hover:bg-purple-700 relative"
                onClick={() => handleGenerateVideoPrompt()}
              >
                {isLoading && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Generate Video Prompt
              </Button>
            </div>
          </div>

          <div className="relative">
            <Textarea
              value={videoPrompt}
              placeholder="Enter here..."
              className="min-h-[200px] resize-none"
              disabled={isLoading}
              onChange={(e) => {
                setVideoPrompt(e.target.value)
                setIsVideoPromptChanged(true)
              }}
            />

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <span className="inline-block w-6 h-6 border-4 border-gray-200 rounded-full border-t-purple-600 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <div style={{ color: 'red' }} className="mr-auto self-center text-sm">{clipErrorMessage}</div>
            <Button
              variant="outline"
              disabled={isVideoPromptChanged == false}
              onClick={() => handleSavePromptes()}
            >
              仅保存
            </Button>
            <Button
              disabled={
                isGeneratingVideo ||
                scene?.image_url == null ||
                videoPrompt == null ||
                videoPrompt === ""
              }
              onClick={() => handleGenerateVideo()}
            >
              生成视频
            </Button>
          </div>

          <div className="relative mt-4">
            <VideoDisplayPanel
              scene={scene}
              isGeneratingVideo={isGeneratingVideo}
            />
          </div>
        </Panel>
      </PanelGroup>


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

      {/* Prompt Edit Panel (kept for compatibility, not used via pen icon anymore) */}
      <PromptEditPanel
        open={isPromptEditOpen}
        onClose={() => setIsPromptEditOpen(false)}
        value={prompt || ''}
        onChange={setPrompt}
        onSave={() => {
          if (!prompt) return
          onUpdate("image_prompt", prompt)
        }}
      />

      {/* Video Settings Panel */}
      <VideoSettingsPanel
        open={isVideoSettingsOpen}
        onOpenChange={setIsVideoSettingsOpen}
        settings={videoSetting}
        onSave={(video_setting) => {
          onUpdate("video_setting", video_setting)
        }}
      />

      {/* Voice Settings Panel - Only renders when isVoiceSettingsOpen is true */}
      {
        isVoiceSettingsOpen && scene?.project_id && scene?.stage_id && (
          <VoiceSettingsPanel
            open={isVoiceSettingsOpen}
            onOpenChange={setIsVoiceSettingsOpen}
            settings={scene?.voice_setting}
            voice_menu={{}}
            project_id={scene?.project_id?.toString()}
            stage_id={scene?.stage_id?.toString()}
            subtitle={scene?.description}
            voice_url={scene?.voice_url}
            scene_id={scene.id}
            onGenerate={(voice_path: string) => {
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
                console.log('.............', scene.voice_setting)
              })
            }}
          />
        )
      }
    </div >
  )
}
