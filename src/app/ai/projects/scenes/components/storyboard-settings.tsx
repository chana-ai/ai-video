"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
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
import { Users, Check, Upload, Play, Pause, Loader2, Mic } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { VideoDisplayPanel } from "./video-display-panel"
import { PromptEditPanel } from "./prompt-edit-panel"
import type { StoryboardSettingsProps, VideoSettings, DialogLine } from "../types"
import { VoiceSettingsPanel } from "./voice-settings-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import instance from "@/lib/axios"

type VideoModel = 'MINMAX' | 'WAN'

interface Character { id: number; name: string }

// ── Helpers ──────────────────────────────────────────────

/** Map narration number to a readable label */
function narrationLabel(narration: number | undefined): string {
  if (narration === 1) return 'Narration'
  if (narration === 2) return 'Monologue'
  if (narration === 3) return 'Dialogue'
  return 'Narration'
}

/** Parse storyboard.dialog into either a plain string or DialogLine[] */
function parseDialog(dialog: string | DialogLine[] | undefined, narration: number): { isDialogue: boolean; plain: string; lines: DialogLine[] } {
  if (narration === 3) {
    if (Array.isArray(dialog)) return { isDialogue: true, plain: '', lines: dialog }
    if (typeof dialog === 'string') {
      try {
        const parsed = JSON.parse(dialog)
        if (Array.isArray(parsed)) return { isDialogue: true, plain: '', lines: parsed }
      } catch { /* ignore */ }
      return { isDialogue: true, plain: '', lines: [{ character: '', content: dialog }] }
    }
    return { isDialogue: true, plain: '', lines: [] }
  }
  if (typeof dialog === 'string') return { isDialogue: false, plain: dialog, lines: [] }
  if (Array.isArray(dialog)) return { isDialogue: false, plain: dialog.map(l => l.content).join('\n'), lines: [] }
  return { isDialogue: false, plain: '', lines: [] }
}

// ── Component ─────────────────────────────────────────────

export function StoryboardSettings({
  storyboard,
  projectDetail,
  onUpdate,
}: StoryboardSettingsProps) {

  // ── General UI state ──
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)

  // ── Storyboard data (Uncontrolled with Refs) ──
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const [isDescriptionDirty, setIsDescriptionDirty] = useState(false)
  const [isPromptDirty, setIsPromptDirty] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatingImageError, setGeneratingImageError] = useState<string | false>(false)

  // ── Video prompt meta ──
  const [isLoading, setIsLoading] = useState(false)
  const [isVideoPromptChanged, setIsVideoPromptChanged] = useState(false)
  const [videoPrompt, setVideoPrompt] = useState(storyboard?.video_prompt || "")
  const [clipErrorMessage, setClipErrorMessage] = useState<string | false>(false)
  const [videoModel, setVideoModel] = useState<VideoModel>('MINMAX')

  // ── Ref characters ──
  const [isRefCharsOpen, setIsRefCharsOpen] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharIds, setSelectedCharIds] = useState<Set<number | 'NONE'>>(new Set<number | 'NONE'>(['NONE']))
  const [pendingCharIds, setPendingCharIds] = useState<Set<number | 'NONE'>>(new Set<number | 'NONE'>(['NONE']))

  // ── Audio & Speech ──
  const [speechPlain, setSpeechPlain] = useState('')
  const [speechLines, setSpeechLines] = useState<DialogLine[]>([])
  const [voiceSpeed, setVoiceSpeed] = useState(
    String(projectDetail?.config?.voice_setting?.voice_speed ?? '1.0')
  )
  const [voiceEmotion, setVoiceEmotion] = useState('neutral')
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const imageUploadRef = useRef<HTMLInputElement>(null)
  const refCharsDialogRef = useRef<HTMLDivElement>(null)

  const narration = projectDetail?.narration ?? 1
  const speechTypeLabel = narrationLabel(narration)
  const isDialogue = narration === 3

  // Sync when storyboard prop changes
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = storyboard?.description || ''
    if (promptRef.current) promptRef.current.value = storyboard?.prompt || ''
    setVideoPrompt(storyboard?.video_prompt || '')
    setIsDescriptionDirty(false)
    setIsPromptDirty(false)
    setIsVideoPromptChanged(false)
    setAudioPreviewUrl(null)

    const parsed = parseDialog(storyboard?.dialog, narration)
    setSpeechPlain(parsed.plain)
    setSpeechLines(parsed.lines)
  }, [storyboard, narration])

  // Sync voiceSpeed from projectDetail
  useEffect(() => {
    if (projectDetail?.config?.voice_setting?.voice_speed != null) {
      setVoiceSpeed(String(projectDetail.config.voice_setting.voice_speed))
    }
  }, [projectDetail])

  // Fetch characters
  useEffect(() => {
    if (!storyboard?.project_id || !storyboard?.stage_id) return
    instance.get(`/api/v2/asset/list?project_id=${storyboard.project_id}&stage_id=${storyboard.stage_id}`)
      .then((res: any) => setCharacters(res.characters || []))
      .catch((err) => console.error("Failed to fetch characters:", err))
  }, [storyboard?.project_id, storyboard?.stage_id])

  // Close ref-chars popover on outside click
  useEffect(() => {
    if (!isRefCharsOpen) return
    const handler = (e: MouseEvent) => {
      if (refCharsDialogRef.current && !refCharsDialogRef.current.contains(e.target as Node))
        setIsRefCharsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isRefCharsOpen])

  // ── Handlers ─────────────────────────────────────────────

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true)
    instance.post('/api/v2/scene/generateSceneImage', {
      scene_id: storyboard?.id, project_id: storyboard?.project_id, stage_id: storyboard?.stage_id,
    }).then((res: any) => { onUpdate("image_url", res.image_url); setIsGeneratingImage(false) })
      .catch((error: any) => { setIsGeneratingImage(false); setGeneratingImageError(error.message) })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !storyboard) return
    const objectUrl = URL.createObjectURL(e.target.files[0])
    onUpdate("image_url", objectUrl)
    e.target.value = ''
  }

  const handleGenerateVideoPrompt = async () => {
    setIsLoading(true)
    instance.post('/api/v2/scene/generateVideoPrompt', {
      scene_id: storyboard?.id, stage_id: storyboard?.stage_id, project_id: storyboard?.project_id, video_model: videoModel,
    }).then((res: any) => { onUpdate("video_prompt", res.video_prompt); setIsLoading(false) })
      .catch((error: any) => { console.error(error.message); setIsLoading(false) })
  }

  const handleGenerateVideo = useCallback(async (regenerate_prompt = false) => {
    if (!storyboard?.id || !storyboard?.project_id || !storyboard?.stage_id) return
    setClipErrorMessage(false); setIsGeneratingVideo(true)
    try {
      await instance.post("/api/v2/scene/createClip", {
        scene_id: storyboard.id, project_id: storyboard.project_id, stage_id: storyboard.stage_id,
        regenerate_prompt, video_prompt: videoPrompt, video_model: videoModel,
      })
      if (isVideoPromptChanged) { onUpdate("video_prompt", videoPrompt); setIsVideoPromptChanged(false) }
      setIsGeneratingVideo(false)
    } catch (error: any) {
      setIsGeneratingVideo(false)
      const resp = error?.response?.data
      setClipErrorMessage(resp?.code === 533 ? resp.message : "系统开了小差，联系下管理员，或者稍后再试")
    }
  }, [isVideoPromptChanged, onUpdate, storyboard?.id, storyboard?.project_id, storyboard?.stage_id, videoPrompt, videoModel])

  const handleSavePromptes = () => {
    if (!isVideoPromptChanged) return
    instance.post('/api/v2/scene/savePrompts', {
      scene_id: storyboard?.id, stage_id: storyboard?.stage_id, project_id: storyboard?.project_id, video_prompt: videoPrompt
    }).then(() => { onUpdate("video_prompt", videoPrompt); setIsVideoPromptChanged(false) })
      .catch((error: any) => { setClipErrorMessage(error.response?.data?.message); setIsVideoPromptChanged(false) })
  }

  const handleOpenRefChars = () => { setPendingCharIds(new Set(selectedCharIds)); setIsRefCharsOpen(true) }
  const handleConfirmRefChars = () => { setSelectedCharIds(new Set(pendingCharIds)); setIsRefCharsOpen(false) }

  const togglePendingChar = (id: number | 'NONE') => {
    setPendingCharIds(prev => {
      const next = new Set<number | 'NONE'>(prev)
      if (id === 'NONE') return new Set<number | 'NONE'>(['NONE'])
      next.delete('NONE')
      if (next.has(id)) { next.delete(id); if (next.size === 0) next.add('NONE') } else next.add(id)
      return next
    })
  }

  const handleGenerateAudio = async () => {
    if (!storyboard?.id) return
    setIsGeneratingAudio(true); setAudioPreviewUrl(null)
    const script = isDialogue
      ? speechLines.map(l => `${l.character}: ${l.content}`).join('\n')
      : speechPlain
    try {
      const res: any = await instance.post('/api/v2/voice/generate_speech', {
        scene_id: storyboard.id, project_id: storyboard?.project_id, stage_id: storyboard?.stage_id,
        speech_type: speechTypeLabel.toLowerCase(),
        script,
        speed: voiceSpeed,
        emotion: voiceEmotion,
        voice_name: projectDetail?.config?.voice_setting?.voice_name,
      })
      if (res.audio_url) setAudioPreviewUrl(res.audio_url)
      else alert('生成音频失败，未获取到音频链接')
    } catch (err: any) {
      alert(`生成音频失败: ${err.message || '未知错误'}`)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const toggleAudioPlay = () => {
    if (!audioRef.current) return
    if (isPlayingAudio) { audioRef.current.pause(); setIsPlayingAudio(false) }
    else { audioRef.current.play(); setIsPlayingAudio(true) }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-8rem)] max-w-[1400px] mx-auto relative">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={55} minSize={30}>
          <div className="h-full bg-gray-50 p-4 rounded-lg space-y-4 overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-700 tracking-wide">Storyboard Elements</h2>
            <section className="bg-white rounded-lg border p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</Label>
                <div className="text-sm font-semibold truncate px-1">{storyboard?.title}</div>
              </div>

              <div className="space-y-1.5 relative group">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</Label>
                <div className="relative">
                  <Textarea
                    ref={descriptionRef}
                    defaultValue={storyboard?.description || ''}
                    placeholder="Brief description of the storyboard context..."
                    className="min-h-[72px] text-sm bg-gray-50/50 border-gray-100 resize-none focus:bg-white transition-colors p-3 rounded-lg border-none focus-visible:ring-1 focus-visible:ring-gray-200"
                    onChange={(e) => setIsDescriptionDirty(e.target.value !== (storyboard?.description || ''))}
                    onBlur={(e) => {
                      if (!e.relatedTarget?.closest('.confirm-btn')) {
                        setTimeout(() => {
                          if (descriptionRef.current) descriptionRef.current.value = storyboard?.description || ''
                          setIsDescriptionDirty(false)
                        }, 150)
                      }
                    }}
                  />
                  {isDescriptionDirty && (
                    <Button
                      size="icon"
                      className="confirm-btn absolute right-2 bottom-2 h-7 w-7 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all scale-110"
                      onClick={() => onUpdate("description", descriptionRef.current?.value)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 relative group">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">Image Prompt</Label>
                <div className="relative">
                  <Textarea
                    ref={promptRef}
                    defaultValue={storyboard?.prompt || ''}
                    placeholder="Enter image generation prompt…"
                    className="min-h-[80px] text-sm bg-gray-50/50 border-gray-100 resize-none focus:bg-white transition-colors p-3 rounded-lg border-none focus-visible:ring-1 focus-visible:ring-gray-200"
                    onChange={(e) => setIsPromptDirty(e.target.value !== (storyboard?.prompt || ''))}
                    onBlur={(e) => {
                      if (!e.relatedTarget?.closest('.confirm-btn')) {
                        setTimeout(() => {
                          if (promptRef.current) promptRef.current.value = storyboard?.prompt || ''
                          setIsPromptDirty(false)
                        }, 150)
                      }
                    }}
                  />
                  {isPromptDirty && (
                    <Button
                      size="icon"
                      className="confirm-btn absolute right-2 bottom-2 h-7 w-7 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all scale-110"
                      onClick={() => onUpdate("image_prompt", promptRef.current?.value)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg border p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Visual Ref</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative" ref={refCharsDialogRef}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" onClick={handleOpenRefChars}>
                    <Users className="h-3.5 w-3.5" />
                    Ref Characters
                    {selectedCharIds.size > 0 && !selectedCharIds.has('NONE') && (
                      <span className="ml-0.5 bg-purple-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center">
                        {selectedCharIds.size}
                      </span>
                    )}
                  </Button>
                  {isRefCharsOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-60 bg-white border rounded-lg shadow-xl p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Select Reference Characters</p>
                      <div className="space-y-1 max-h-52 overflow-y-auto">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${pendingCharIds.has('NONE') ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}
                            onClick={() => togglePendingChar('NONE')}
                          >
                            {pendingCharIds.has('NONE') && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs text-gray-500">None</span>
                        </label>
                        {characters.map((char) => (
                          <label key={char.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${pendingCharIds.has(char.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}
                              onClick={() => togglePendingChar(char.id)}
                            >
                              {pendingCharIds.has(char.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs truncate">{char.name}</span>
                          </label>
                        ))}
                      </div>
                      <Button size="sm" className="w-full mt-2 h-7 text-xs bg-purple-600 hover:bg-purple-700" onClick={handleConfirmRefChars}>
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" onClick={() => imageUploadRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />Upload
                </Button>
                <input ref={imageUploadRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs flex items-center gap-1.5" onClick={handleGenerateImage} disabled={isGeneratingImage}>
                  {isGeneratingImage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Generate Image
                </Button>
              </div>
              {storyboard?.image_url ? (
                <div className="w-full rounded-md overflow-hidden border bg-gray-50">
                  <img src={storyboard.image_url} alt="Storyboard preview" className="w-full h-auto max-h-[480px] object-contain block" />
                </div>
              ) : (
                <div className="w-full h-20 bg-gray-100 rounded-md border flex items-center justify-center">
                  <span className="text-xs text-gray-400">No image yet</span>
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg border p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" /> Speech
              </h3>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Script <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100">{speechTypeLabel}</span></Label>
                {!isDialogue ? (
                  <Textarea value={speechPlain} className="min-h-[100px] resize-none text-sm" onChange={(e) => setSpeechPlain(e.target.value)} />
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {speechLines.map((line, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-gray-50 rounded-md p-2 border text-xs">
                        <input value={line.character} className="w-24 font-semibold text-purple-700 bg-purple-50 border p-1 rounded" onChange={(e) => {
                          const updated = [...speechLines]; updated[idx] = { ...updated[idx], character: e.target.value }; setSpeechLines(updated)
                        }} />
                        <Textarea value={line.content} className="flex-1 min-h-[48px] resize-none" onChange={(e) => {
                          const updated = [...speechLines]; updated[idx] = { ...updated[idx], content: e.target.value }; setSpeechLines(updated)
                        }} />
                        <button className="text-gray-300 hover:text-red-400" onClick={() => setSpeechLines(speechLines.filter((_, i) => i !== idx))}>✕</button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full text-xs h-7 border-dashed" onClick={() => setSpeechLines([...speechLines, { character: '', content: '' }])}>+ Add line</Button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 mb-1 block">Speed</Label>
                  <Select value={voiceSpeed} onValueChange={setVoiceSpeed}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.75">0.75×</SelectItem>
                      <SelectItem value="1.0">1.0×</SelectItem>
                      <SelectItem value="1.25">1.25×</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 mb-1 block">Emotion</Label>
                  <Select value={voiceEmotion} onValueChange={setVoiceEmotion}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="happy">Happy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs gap-2" onClick={handleGenerateAudio} disabled={isGeneratingAudio}>
                {isGeneratingAudio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />} Generate Speech
              </Button>
              {audioPreviewUrl && (
                <div className="flex items-center gap-3 bg-indigo-50 rounded-md px-3 py-2">
                  <button onClick={toggleAudioPlay} className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <audio ref={audioRef} src={audioPreviewUrl} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
                </div>
              )}
            </section>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300" />

        <Panel defaultSize={45} minSize={20}>
          <div className="h-full p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={videoModel} onValueChange={(v: string) => setVideoModel(v as VideoModel)}>
                  <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINMAX">MINMAX</SelectItem>
                    <SelectItem value="WAN">WAN</SelectItem>
                  </SelectContent>
                </Select>
                <Button disabled={isLoading} size="sm" className="bg-purple-600 text-xs" onClick={handleGenerateVideoPrompt}>Generate Video Prompt</Button>
              </div>
            </div>
            <Textarea value={videoPrompt} className="min-h-[200px] text-sm" onChange={(e) => { setVideoPrompt(e.target.value); setIsVideoPromptChanged(true) }} />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm"
                disabled={!isVideoPromptChanged}
                onClick={handleSavePromptes}
              >
                Confirm Update
              </Button>
              <Button size="sm" disabled={isGeneratingVideo || !storyboard?.image_url || !videoPrompt} onClick={() => handleGenerateVideo()}>
                {isGeneratingVideo && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} 生成视频
              </Button>
            </div>
            <VideoDisplayPanel scene={storyboard as any} isGeneratingVideo={isGeneratingVideo} />
          </div>
        </Panel>
      </PanelGroup>

    </div>
  )
}
