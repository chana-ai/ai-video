"use client"

import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Mic, Loader2, Pause } from "lucide-react"

import type { ProjectDetail, } from "@/app/ai/projects/types"
import type { Character } from "@/app/ai/projects/scenes/types"

interface VoiceComponentProps {
  storyboardId: number | undefined
  projectDetail: ProjectDetail | null
  storyboardConfig: any
  // storyboardConfig: {
  //   assets?: any[]
  //   dialogue?: any
  //   voice_settings?: {
  //     speech_rate?: number
  //     emotion?: string
  //     selected_asset_id?: number
  //     selected_asset_name?: string
  //     voice_name?: string
  //   }
  //   projectDetail?: ProjectDetail
  //   stage_id?: Number
  //   scene_id?: Number
  //   user_id?: Number
  // } | null
  characters: Character[]
  voice_url: string | null
  speechTypeLabel: string
  speechPlain: string
  speechLines: any[]
  isDialogue: boolean
  on_update_scene_voice_setting: (voice_url: string, voice_settings: any) => void
}

export interface VoiceComponentHandle {
  playAudio: () => void
  pauseAudio: () => void
  toggleAudioPlay: () => void
}

export const VoiceComponent = forwardRef<VoiceComponentHandle, VoiceComponentProps>(({
  storyboardId,
  projectDetail,
  storyboardConfig,
  characters,
  voice_url,
  speechTypeLabel,
  speechPlain,
  speechLines,
  isDialogue,
  on_update_scene_voice_setting
}, ref) => {
  VoiceComponent.displayName = 'VoiceComponent'
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)


  const [selectedAsset, setSelectedAsset] = useState<Character | null>(null)
  const [speed, setSpeed] = useState<Number>()
  const [emotion, setEmotion] = useState<string>()
  const [speech_text, setSpeechText] = useState<string>()
  const [dialogueLines, setDialogueLines] = useState<any[]>([])

  // Initialize state variables from storyboard config voice settings
  useEffect(() => {
    if (!storyboardConfig) return
    // Get voice settings from storyboard config with fallback to project-level settings
    const voice_settings = storyboardConfig.voice_settings || {}
    const speech_rate = voice_settings.speech_rate || 1.0
    const emotion_value = voice_settings.emotion || 'neutral'
    const selected_asset_id = storyboardConfig.dialogue?.asset_id

    // Initialize script from dialogue
    setSpeechText(speechPlain)
    setDialogueLines(speechLines)

    // Find and set the selected asset based on selected_asset_id
    let selectedAsset: Character | null = null

    if (selected_asset_id && characters.length > 0) {
      const asset = characters.find(c => c.id.toString() === selected_asset_id)
      if (asset) {
        selectedAsset = asset
      }
    } else if (characters.length > 0) {
      // Find first character with valid voice setting
      const validAsset = characters.find(c => c.config?.voice_setting)
      selectedAsset = validAsset || characters[0]
    }

    // Set state variables
    setSpeed(speech_rate)
    setEmotion(emotion_value)
    setSelectedAsset(selectedAsset)
  }, [storyboardConfig, characters, speechPlain, speechLines])

  const emotions = [
    { zh: '中性', en: 'neutral' },
    { zh: '开心', en: 'happy' },
    { zh: '悲伤', en: 'sad' },
    { zh: '愤怒', en: 'angry' },
    { zh: '惊讶', en: 'surprised' }
  ]

  // Expose audio control methods to parent
  useImperativeHandle(ref, () => ({
    playAudio: () => {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play()
        setIsPlayingAudio(true)
      }
    },
    pauseAudio: () => {
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlayingAudio(false)
      }
    },
    toggleAudioPlay: () => {
      if (!audioRef.current) return
      if (isPlayingAudio) {
        audioRef.current.pause()
        setIsPlayingAudio(false)
      } else if (audioRef.current.src) {
        audioRef.current.play()
        setIsPlayingAudio(true)
      }
    }
  }), [audioRef, isPlayingAudio])

  // Get voice settings from state variables
  const currentVoiceSpeed = String(speed || 1.0)
  const currentVoiceEmotion = emotion || 'neutral'

  // Function to get voice name from asset or return error message
  const getVoiceNameFromAsset = (asset: Character | null | undefined) => {
    if (!asset) {
      return {
        hasVoice: false,
        displayName: null
      }
    }

    if (!asset.config?.voice_setting) {
      return {
        hasVoice: false,
        displayName: '资产管理中先确认音色'
      }
    }

    const voiceSetting = asset.config.voice_setting
    if (voiceSetting.mode === 'tts') {
      return {
        hasVoice: !!voiceSetting.tts?.voice,
        displayName: voiceSetting.tts?.voice || '资产管理中先确认音色'
      }
    } else if (voiceSetting.mode === 'clone') {
      return {
        hasVoice: !!voiceSetting.clone?.voice,
        displayName: voiceSetting.clone?.voice || '资产管理中先确认音色'
      }
    } else {
      return {
        hasVoice: false,
        displayName: '资产管理中先确认音色'
      }
    }
  }


  const handleGenerateAudio = useCallback(async () => {
    if (!projectDetail?.id || !projectDetail?.user_id) {
      alert('Missing required project, stage, or scene information')
      setIsGeneratingAudio(false)
      return
    }

    setIsGeneratingAudio(true)

    // Check if asset has voice setting
    const voiceInfo = getVoiceNameFromAsset(selectedAsset)
    if (!voiceInfo.hasVoice) {
      alert('请先在资产管理中确认音色')
      setIsGeneratingAudio(false)
      return
    }

    // Get voice value
    const voiceSetting = selectedAsset?.config?.voice_setting
    if (!voiceSetting || !selectedAsset) {
      alert('请先在资产管理中确认音色')
      setIsGeneratingAudio(false)
      return
    }

    let voice: string

    if (voiceSetting.mode === 'tts') {
      voice = voiceSetting.tts?.voice || ''
    } else {
      voice = voiceSetting.clone?.voice || ''
    }

    if (!voice) {
      alert('请先在资产管理中确认音色')
      setIsGeneratingAudio(false)
      return
    }

    try {
      const instance = (await import('@/lib/axios')).default
      const res: any = await instance.post('/api/v2/voice/generate_voice', {
        project_id: projectDetail.id,
        stage_id: projectDetail.stage_id,
        scene_id: storyboardId,
        user_id: projectDetail.user_id,
        text: speech_text,
        asset_id: selectedAsset?.id!,
        emotion: emotion || 'neutral',
        voice: voice,
        speed: Number(speed) || undefined
      })

      if (res.voice_path) {
        // Update voice settings only when generating audio
        on_update_scene_voice_setting(res.voice_path, {
          selectedAsset: selectedAsset,
          text: speech_text,
          speed: Number(speed),
          emotion: emotion,
          selected_asset_id: selectedAsset?.id!,
          selected_asset_name: selectedAsset?.name,
          voice_name: voice,
          mode: voiceSetting.mode,
          vendor: voiceSetting.mode === "tts" ? "azure" : "qwen"
        })
      }
    } catch (err: any) {
      alert(`生成音频失败: ${err.message || '未知错误'}`)
    } finally {
      setIsGeneratingAudio(false)
    }
  }, [selectedAsset, speed, emotion, projectDetail, storyboardId, speech_text, isDialogue, on_update_scene_voice_setting])

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col relative focus-within:ring-1 focus-within:ring-purple-200 transition-all">
        <div className="flex justify-between items-center bg-gray-50/80 border-b border-gray-100 px-3 py-2">
          <span className="text-[10px] font-bold text-gray-700 tracking-widest uppercase">{speechTypeLabel} SCRIPT</span>

          <div className="flex items-center gap-2">
            <Select
              value={selectedAsset?.id?.toString() || ''}
              onValueChange={(value) => {
                const asset = characters.find(c => c.id === Number(value))
                setSelectedAsset(asset || null)
              }}
            >
              <SelectTrigger className="w-[120px] h-6 text-[9px] bg-white border-gray-200 rounded shadow-sm font-medium focus:ring-0">
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((character) => (
                  <SelectItem key={character.id} value={character.id.toString()} className="text-[9px] font-medium">
                    {character.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(() => {
              const voiceInfo = getVoiceNameFromAsset(selectedAsset)
              return voiceInfo.displayName ? (
                <span className={`text-[9px] font-medium ${voiceInfo.hasVoice ? 'text-green-600' : 'text-red-500'}`}>
                  {voiceInfo.displayName}
                </span>
              ) : null
            })()}
          </div>
        </div>

        {!isDialogue ? (
          <Textarea
            value={speech_text}
            className="min-h-[100px] border-0 text-[12px] resize-none focus-visible:ring-0 rounded-none shadow-none"
            placeholder="Enter narration script to voiceover..."
            onChange={(e) => {
              setSpeechText(e.target.value)
            }}
          />
        ) : (
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar p-2 bg-gray-50/30">
            {dialogueLines.map((line, idx) => (
              <div key={idx} className="flex gap-1.5 items-start bg-white rounded flex-col border border-gray-100 overflow-hidden group">
                <div className="flex w-full items-center border-b border-gray-50">
                  <span className="w-5 flex items-center justify-center text-xs text-gray-600 font-bold bg-gray-50 h-full">{idx + 1}</span>
                  <input
                    value={line.character}
                    className="w-20 font-bold text-indigo-700 bg-transparent text-xs p-1.5 outline-none placeholder:text-gray-500 transition-colors"
                    placeholder="Actor"
                    onChange={(e) => {
                      const name = e.target.value
                      console.log('Character changed:', name)
                    }}
                  />
                  <div className="flex-1 flex justify-end px-1">
                    <button
                      className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        console.log('Delete line:', idx)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <Textarea
                  value={line.content}
                  className="flex-1 w-full min-h-[30px] p-2 resize-none bg-transparent text-[12px] border-none focus-visible:ring-0 shadow-none leading-relaxed"
                  placeholder="Type dialogue line..."
                  onChange={(e) => {
                    const updatedLines = [...dialogueLines]
                    updatedLines[idx] = {
                      ...line,
                      content: e.target.value
                    }
                    setDialogueLines(updatedLines)
                  }}
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7 font-bold text-gray-600 hover:text-gray-700 mt-2"
              onClick={() => {
                console.log('Add dialogue line')
              }}
            >
              + ADD DIALOGUE LINE
            </Button>
          </div>
        )}

        <div className="flex bg-gray-50 border-t border-gray-100 p-2 gap-2 mt-auto justify-between items-center">
          <div className="flex gap-2">
            <Select
              value={currentVoiceSpeed}
              onValueChange={(v) => {
                setSpeed(Number(v))
              }}
            >
              <SelectTrigger className="w-[85px] h-7 text-[10px] bg-white border-gray-200 rounded shadow-sm font-medium focus:ring-0">
                <SelectValue placeholder="Speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.75" className="text-[10px] font-medium">0.75x</SelectItem>
                <SelectItem value="1" className="text-[10px] font-medium">1.0x (Nrm)</SelectItem>
                <SelectItem value="1.25" className="text-[10px] font-medium">1.25x</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={currentVoiceEmotion}
              onValueChange={(v) => {
                setEmotion(v)
              }}
            >
              <SelectTrigger className="w-[85px] h-7 text-xs bg-white border-gray-200 rounded shadow-sm font-medium focus:ring-0">
                <SelectValue placeholder="Emotion" />
              </SelectTrigger>
              <SelectContent>
                {emotions.map((emo) => (
                  <SelectItem key={emo.zh} value={emo.en} className="text-xs font-medium">
                    {emo.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {audioRef.current?.src && (
              <button
                onClick={() => {
                  if (audioRef.current && isPlayingAudio) {
                    audioRef.current.pause()
                    setIsPlayingAudio(false)
                  } else if (audioRef.current?.src) {
                    audioRef.current.play()
                    setIsPlayingAudio(true)
                  }
                }}
                className="h-7 w-7 rounded bg-indigo-600 shadow-sm shadow-indigo-200 text-white flex items-center justify-center hover:bg-indigo-700 transition active:scale-95"
              >
                {isPlayingAudio ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3 ml-0.5" />
                )}
              </button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs bg-white font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm"
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio}
            >
              {isGeneratingAudio ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mic className="h-3 w-3 mr-1" />} Sync Audio
            </Button>
          </div>
        </div>
      </div>

      {/* Audio element for playback */}
      {voice_url && <audio
        ref={audioRef}
        src={voice_url || ''}
        onEnded={() => setIsPlayingAudio(false)}
        onPlay={() => setIsPlayingAudio(true)}
        onPause={() => setIsPlayingAudio(false)}
      />
      }
    </>
  )
})
