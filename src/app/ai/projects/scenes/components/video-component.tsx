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
import { wsManager, type WsMessage } from "@/lib/websocket"
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
      const unsubscribeAccepted = wsManager.subscribe('createVideoClipAccepted', (message: WsMessage) => {
        console.log('createVideoClipAccepted:', message)
        if (message.task_id) {
          onUpdateVideoTaskId?.(message.task_id)
        }
      })

      const unsubscribeComplete = wsManager.subscribe('createVideoClipComplete', async (message: WsMessage) => {
        console.log('createVideoClipComplete:', message)
        if (message.data && message.data.video_url) {
          onUpdateVideoUrl?.(message.data.video_url)
          setIsGeneratingVideo(false)
        }
      })

      const unsubscribeError = wsManager.subscribe('createVideoClipError', (message: WsMessage) => {
        console.error('createVideoClipError:', message)
        const errorMsg = message.message || '视频生成失败，请稍后重试'
        showToast(errorMsg, 'error')
        setIsGeneratingVideo(false)
      })

      try {
        // Send WebSocket request
        await wsManager.sendCreateVideoClip(
          storyboardId,
          videoPrompt,
          projectDetail?.id || 0, // project_id will be passed from parent
          projectDetail?.stage_id || 0, // stage_id will be passed from parent
          projectDetail?.user_id || 0,
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
    onUpdateVideoTaskId
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
              className="w-full h-full object-contain"
              controls
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-600 gap-3">
              <Play className="w-12 h-12 opacity-80 mix-blend-screen" />
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-700">No Video Available</p>
            </div>
          )}
        </div>

        {/* Model / Vendor Selection & Generate Video Prompt button */}
        <div className="flex items-center justify-between gap-2">
          {/* <Select
            value={currentVideoModel}
            onValueChange={(v: string) => {
              if (storyboardConfig) {
                storyboardConfig.video_settings = {
                  ...storyboardConfig.video_settings,
                  model: v
                }
              }
            }}
          >
            <SelectTrigger className="w-32 h-9 text-xs font-bold rounded-xl bg-gray-50 border-gray-100 focus:ring-purple-200">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MINMAX" className="text-xs font-bold">MINMAX</SelectItem>
              <SelectItem value="RUNNINGHUB" className="text-xs font-bold">WAN</SelectItem>
            </SelectContent>
          </Select>
 */}
          <Button
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="h-9 text-xs font-bold rounded-xl text-purple-600 border-purple-200 hover:bg-purple-50 px-4"
            onClick={handleGenerateVideoPrompt}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : 'Generate Prompt'}
          </Button>
        </div>

        {/* Video Prompt */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest pl-1">Director&apos;s Script</Label>
          <Textarea
            value={videoPrompt}
            className="min-h-[140px] text-sm bg-gray-50/50 border-none resize-none focus:bg-white transition-colors p-4 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-200 leading-relaxed font-mono shadow-inner"
            onChange={(e) => {
              const val = e.target.value
              if (storyboard) {
                storyboard.video_prompt = val
              }
              setVideoPrompt(val)
            }}
            placeholder="Describe precise camera movements, cinematic effects, and atmosphere..."
          />
        </div>
      </div>

      {/* Generate Video Action Button */}
      <div className="pt-3 border-t border-gray-100">
        <Button
          size="lg"
          className="w-full h-[52px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-base font-black tracking-widest rounded-xl shadow-[0_8px_20px_-6px_rgba(147,51,234,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
          disabled={isGeneratingVideo || !storyboard?.video_prompt}
          title={!storyboard?.video_prompt ? "Please enter a video prompt first" : ""}
          onClick={() => handleGenerateVideo()}
        >
          {isGeneratingVideo ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <span className="text-xl mr-2">🎬</span>}
          GENERATE VIDEO
        </Button>
      </div>
    </div>
  )
}