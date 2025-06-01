"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { VoiceSettings, VoiceSettingsPanelProps } from "../types"
import { useEffect, useState } from "react"
import { PlayCircle, PauseCircle } from "lucide-react"
import instance from "@/lib/axios";


export function VoiceSettingsPanel({
  open,
  onOpenChange,
  settings,
  voice_menu,
  scene_id,
  project_id,
  stage_id,
  subtitle,
  voice_url,
  onSave,
  onGenerate
}: VoiceSettingsPanelProps) { 
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  // const [voice_path, setVoicePath] = useState<string>(voice_url || "")
  const [duration, setDuration] = useState(0)

  const [isGenerating, setIsGenerating] = useState(false)

  const defaultSettings: VoiceSettings = {
    voice_name: settings?.voice_name || "超真实笑笑",
    background: settings?.background || "无",
    voice_pitch: settings?.voice_pitch || 0,
    voice_speed: settings?.voice_speed || 1,
    voice_volume: settings?.voice_volume || 1,
  }

  const handlePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    setupVoice(voice_url || "")

  }, [voice_url])

  const setupVoice = (remote_video_url: string) => {
    if(remote_video_url == null || remote_video_url == '' )
      return

    const audio = new Audio(remote_video_url)
      
    // Add event listeners
    audio.addEventListener('ended', () => {
      setIsPlaying(false)
    })
    
    audio.addEventListener('loadedmetadata', () => {
      // Get duration in seconds when audio loads
      const durationInSeconds = Math.round(audio.duration)
      setDuration(durationInSeconds)
      console.log(`Audio duration: ${durationInSeconds} seconds`)
    })

    audio.addEventListener('error', (e) => {
      console.error('Error loading audio:', e)
      setIsPlaying(false)
    })

    setAudioElement(audio)
  }

  const handleSave = () => {
    onOpenChange(false)
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    let post_data = {
      project_id: project_id,
      stage_id: stage_id,
    }
    if (scene_id) {
      post_data['scene_id'] = scene_id;
    }

    instance.post('/api/v2/voice/generate_voice', post_data).then((res) => {
      setIsGenerating(false)
      setupVoice(res.voice_path)
      onGenerate(res.voice_path)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">音频设置</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">配音声音</label>
            <Select
              defaultValue={defaultSettings.voice_name}
              onValueChange={(value) => {
                defaultSettings.voice_name = value
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择配音声音" />
              </SelectTrigger>
              <SelectContent>
                {
                  voice_menu && Object.entries(voice_menu).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Voice Preview Section */}
          <div className="grid gap-2 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              {subtitle}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="focus:outline-none"
                >
                  {isPlaying ? (
                    <PauseCircle className="h-8 w-8 text-purple-600" />
                  ) : (
                    <PlayCircle className="h-8 w-8 text-purple-600" />
                  )}
                </button>
                <div className="text-sm text-gray-500">
                  {isPlaying ? `${Math.floor(duration/60)}:${String(duration % 60).padStart(2, '0')}` : "0:00"} / {`${Math.floor(duration/60)}:${String(duration % 60).padStart(2, '0')}`}
                </div>
              </div>
              <div className="flex-grow mx-4">
                <div className="h-1 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-purple-600 rounded-full" 
                    style={{ width: isPlaying ? '100%' : '0%', transition: 'width 7s linear' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* <div className="grid gap-2">
            <label className="text-sm font-medium">背景音</label>
            <Select
              defaultValue={defaultSettings.background}
              onValueChange={(value) => {
                defaultSettings.background = value
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择背景音" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-background">无</SelectItem>
                <SelectItem value="自动匹配">自动匹配</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          {/* <div className="grid gap-2">
            <label className="text-sm font-medium">文本内容</label>
            <p className="text-sm text-gray-600">
              基于所有场景的描述内容生成
            </p>
          </div> */}
          <div className="flex flex-row items-center gap-2">
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={handleSave}
            >
              保存
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" 
              disabled={isGenerating}
              onClick={handleGenerate}
            >
              生成语音
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 