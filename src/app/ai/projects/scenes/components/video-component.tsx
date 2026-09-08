"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Loader2, Check } from "lucide-react"
import type { ProjectDetail } from "@/app/ai/projects/types"
import type { Character } from "@/app/ai/projects/scenes/types"
import instance from "@/lib/axios"
import { wsManager } from "@/lib/websocket"
import { showToast } from "@/lib/toast-helpers"

type VideoModel = 'MINMAX' | 'WAN'

interface VideoComponentProps {
  storyboardId?: number
  storyboard?: any
  projectDetail: ProjectDetail | null
  image_id: number
  video_url?: string
  narration?: number
  speechPlain?: string
  speechLines?: any[]
  isDialogue?: boolean
  onUpdateVideoPrompt?: (prompt: string) => void
  onUpdateVideoUrl?: (url: string) => void
  onUpdateVideoTaskId?: (taskId: string) => void
}

export function VideoComponent({
  storyboardId,
  storyboard,
  projectDetail,
  image_id,
  video_url,
  onUpdateVideoPrompt,
  onUpdateVideoUrl,
  onUpdateVideoTaskId,
}: VideoComponentProps) {
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const currentVideoModel = (storyboard?.video_settings?.model || 'MINMAX') as VideoModel
  const [videoPrompt, setVideoPrompt] = useState<string>("")

  useEffect(() => {
    setVideoPrompt(storyboard?.video_prompt)
  }, [storyboard])

  const handleGenerateVideoPrompt = async () => {
    setIsLoading(true)
    try {
      const response: any = await instance.post('/api/v2/scene/generateVideoPrompt', {
        project_id: projectDetail?.id || 0,
        stage_id: projectDetail?.stage_id || 0,
        scene_id: storyboardId,
        user_id: projectDetail?.user_id || 0,
        video_model: currentVideoModel
      })

      const newPrompt = response.video_prompt
      setVideoPrompt(newPrompt)
      onUpdateVideoPrompt?.(newPrompt)
    } catch (error: any) {
      console.error('Failed to generate video prompt:', error)
      showToast(error.message || 'Failed to generate video prompt', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateVideo = useCallback(async () => {
    if (!storyboardId) return

    setIsGeneratingVideo(true)

    try {
      // Subscribe to WebSocket events for this generation
      const unsubscribeAccepted = wsManager.subscribe('createVideoClipAccepted', (message: any) => {
        console.log('createVideoClipAccepted:', message)
        if (message.task_id) {
          onUpdateVideoTaskId?.(message.task_id)
        }
      })

      const unsubscribeComplete = wsManager.subscribe('createVideoClipComplete', async (message: any) => {
        console.log('createVideoClipComplete:', message)
        if (message.result_url) {
          onUpdateVideoUrl?.(message.result_url)
          setIsGeneratingVideo(false)
        }
      })

      const unsubscribeError = wsManager.subscribe('createVideoClipError', (message: any) => {
        console.error('createVideoClipError:', message)
        const errorMsg = message.message || '视频生成失败，请稍后重试'
        showToast(errorMsg, 'error')
        setIsGeneratingVideo(false)
      })

      try {
        // Send WebSocket request
        await wsManager.createVideoClip(
          storyboardId,
          videoPrompt,
          image_id
        )

        onUpdateVideoPrompt?.(videoPrompt || "")
      } finally {
        // Cleanup subscriptions
        unsubscribeAccepted()
        unsubscribeComplete()
        unsubscribeError()
      }
    } catch (error: any) {
      setIsGeneratingVideo(false)
    }
  }, [
    storyboardId,
    storyboard,
    projectDetail,
    onUpdateVideoPrompt,
    onUpdateVideoUrl,
    onUpdateVideoTaskId,
    videoPrompt,
    image_id
  ])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 flex flex-col">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <Play className="w-3 h-3 text-purple-500 fill-current" /> Video Settings
          </h3>
          {video_url && (
            <span className="text-green-600 text-[10px] bg-green-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready
            </span>
          )}
        </div>

        {/* Video Player */}
        <div className="relative h-[350px] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-100">
          {isGeneratingVideo ? (
            <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 text-white z-10">
              <Loader2 className="w-10 h-10 animate-spin text-purple-300" />
              <span className="text-xs font-black tracking-widest uppercase">Synthesizing Sequence...</span>
            </div>
          ) : video_url ? (
            <video
              src={video_url}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <div className="text-gray-400 text-sm">No video generated yet</div>
          )}
        </div>

        {/* Video Settings Form */}
        <div className="space-y-3">
          {/* Video Prompt */}
          <div className="space-y-2">
            <Label htmlFor="video-prompt">视频提示词</Label>
            <Textarea
              id="video-prompt"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="请输入视频提示词..."
              rows={3}
              disabled={isGeneratingVideo || isLoading}
            />
          </div>

          {/* Generate Prompt Button */}
          <Button
            onClick={handleGenerateVideoPrompt}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                生成提示词
              </>
            )}
          </Button>

          {/* Generate Video Button */}
          <Button
            onClick={handleGenerateVideo}
            disabled={!videoPrompt || isGeneratingVideo}
            className="w-full"
          >
            {isGeneratingVideo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                生成视频
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
