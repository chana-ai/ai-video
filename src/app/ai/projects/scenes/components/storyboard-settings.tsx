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
import { Users, Check, Upload, Play, Pause, Loader2, Mic, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { VideoDisplayPanel } from "./video-display-panel"
import { PromptEditPanel } from "./prompt-edit-panel"
import type { StoryboardSettingsProps, VideoSettings, DialogLine } from "../types"
import { VoiceSettingsPanel } from "./voice-settings-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import instance from "@/lib/axios"
import { PromptChatbox } from "./PromptChatbox"

type VideoModel = 'MINMAX' | 'WAN'

interface Character {
  id: number;
  name: string;
  images?: { id: number; url: string }[]
}

// ── Helpers ──────────────────────────────────────────────

/** Map narration number to a readable label */
function narrationLabel(narration: number | undefined): string {
  if (narration === 1) return 'Narration'
  if (narration === 2) return 'Monologue'
  if (narration === 3) return 'Dialogue'
  return 'Narration'
}

/** Parse storyboard.dialog into either a plain string or DialogLine[] */
function parseDialog(dialog: any, narration: number): { isDialogue: boolean; plain: string; lines: DialogLine[] } {

  console.log('dialog', dialog, " narration ", narration)

  if (narration === 3) {
    if (Array.isArray(dialog)) {
      const lines = dialog.map(l => ({
        character: l.asset_name || l.asset_nae || l.character || '',
        content: l.content || ''
      }))
      return { isDialogue: true, plain: lines.map(l => l.content).join('\n'), lines }
    }
    if (typeof dialog === 'string') {
      try {
        const parsed = JSON.parse(dialog)
        if (Array.isArray(parsed)) {
          const lines = parsed.map((l: any) => ({
            character: l.asset_name || l.asset_nae || l.character || '',
            content: l.content || ''
          }))
          return { isDialogue: true, plain: lines.map(l => l.content).join('\n'), lines }
        }
      } catch { /* ignore */ }
      return { isDialogue: true, plain: dialog, lines: [{ character: '', content: dialog }] }
    }
    return { isDialogue: true, plain: '', lines: [] }
  }

  // Narration mode
  if (typeof dialog === 'string') return { isDialogue: false, plain: dialog, lines: [] }
  if (Array.isArray(dialog)) return { isDialogue: false, plain: dialog.map((l: any) => l.content).join('\n'), lines: [] }
  if (dialog && typeof dialog === 'object' && dialog.content !== undefined) {
    return { isDialogue: false, plain: dialog.content, lines: [] }
  }
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

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
    String(storyboard?.config?.voice_settings?.speech_rate ?? projectDetail?.config?.voice_setting?.voice_speed ?? '1.0')
  )
  const [voiceEmotion, setVoiceEmotion] = useState(storyboard?.config?.voice_settings?.emotion || 'neutral')
  const [emotions, setEmotions] = useState<{ en: string, zh: string }[]>([])
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  const imageUploadRef = useRef<HTMLInputElement>(null)
  const refCharsDialogRef = useRef<HTMLDivElement>(null)

  const narration = storyboard?.config?.narration ?? projectDetail?.narration ?? 1
  const speechTypeLabel = narrationLabel(narration)
  const isDialogue = narration === 3

  // Sync when storyboard prop changes
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = storyboard?.description || ''
    if (promptRef.current) promptRef.current.value = storyboard?.prompt || ''
    setVideoPrompt(storyboard?.video_prompt || '')
    setIsVideoPromptChanged(false)

    const parsed = parseDialog(storyboard?.config?.dialogue, narration)
    setSpeechPlain(parsed.plain)
    setSpeechLines(parsed.lines)
    // Sync voiceSpeed from projectDetail or storyboard
    // const speed = storyboard?.config?.voice_settings?.speech_rate ?? projectDetail?.config?.voice_setting?.voice_speed
    // if (speed != null) {
    //   setVoiceSpeed(String(speed))
    // }

    console.log('storyboard', storyboard)
  }, [storyboard, narration])


  // Fetch characters
  useEffect(() => {
    if (!storyboard?.project_id || !storyboard?.stage_id) return
    instance.get(`/api/v2/asset/list?project_id=${storyboard.project_id}&stage_id=${storyboard.stage_id}`)
      .then((res: any) => {
        const mapped = (res.characters || []).map((char: any) => ({
          ...char,
          images: [
            char.front_image_url && { id: char.id, url: char.front_image_url },
            char.side_image_url && { id: char.id, url: char.side_image_url }, // Fallback to asset ID for now
            char.back_image_url && { id: char.id, url: char.back_image_url }
          ].filter(Boolean)
        }))
        setCharacters(mapped)
      })
      .catch((err) => console.error("Failed to fetch characters:", err))
  }, [storyboard?.project_id, storyboard?.stage_id])

  // Fetch emotions
  useEffect(() => {
    instance.get('/api/v2/voice/get_emotion_list')
      .then((res: any) => {
        const fetchedEmotions = res || []
        setEmotions(fetchedEmotions)
        if (fetchedEmotions.length > 0) {
          setVoiceEmotion(fetchedEmotions[0].en)
        }
      })
      .catch((err) => console.error("Failed to fetch emotions:", err))
  }, [])

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

  const handleGenerateImage = async (prompt?: string, resolvedAssets?: Record<string, number>) => {
    setIsGeneratingImage(true)
    instance.post('/api/v2/scene/generateSceneImage', {
      scene_id: storyboard?.id,
      project_id: storyboard?.project_id,
      stage_id: storyboard?.stage_id,
      prompt: prompt,
      resolved_assets: resolvedAssets // Passing the resolved image maps
    }).then((res: any) => {
      if (prompt) onUpdate("image_prompt", prompt);
      onUpdate("image_url", res.image_url)
      setIsGeneratingImage(false)
    })
      .catch((error: any) => { setIsGeneratingImage(false); })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !storyboard) return
    const objectUrl = URL.createObjectURL(e.target.files[0])
    onUpdate("image_url", [objectUrl])
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
        video_prompt: videoPrompt
      })
      if (isVideoPromptChanged) { onUpdate("video_prompt", videoPrompt); setIsVideoPromptChanged(false) }
      setIsGeneratingVideo(false)
    } catch (error: any) {
      setIsGeneratingVideo(false)
      const resp = error?.response?.data
      setClipErrorMessage(resp?.code === 533 ? resp.message : "系统开了小差，联系下管理员，或者稍后再试")
    }
  }, [isVideoPromptChanged, onUpdate, storyboard?.id, storyboard?.project_id, storyboard?.stage_id, videoPrompt, videoModel])

  const handleSavePrompt = () => {
    if (!isVideoPromptChanged) return
    instance.post('/api/v2/scene/savePrompts', {
      scene_id: storyboard?.id,
      stage_id: storyboard?.stage_id,
      project_id: storyboard?.project_id,
      video_prompt: videoPrompt
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
    setIsGeneratingAudio(true)
    const script = isDialogue
      ? speechLines.map(l => `${l.character}: ${l.content}`).join('\n')
      : speechPlain
    if (!script) return
    try {
      const res: any = await instance.post('/api/v2/voice/generate_voice', {
        project_id: storyboard?.project_id,
        stage_id: storyboard?.stage_id,
        scene_id: storyboard.id,
        doc_id: storyboard?.doc_id,
        speech_type: speechTypeLabel.toLowerCase(),
        text: script,
        speed: voiceSpeed,
        emotion: voiceEmotion
      })
      if (res.voice_path) {
        onUpdate("voice_url", res.voice_path)
        onUpdate("voice_setting", { speech_rate: voiceSpeed, emotion: voiceEmotion })
        const dialogueVal = isDialogue ? speechLines : { content: speechPlain }
        onUpdate("dialogue", dialogueVal)
      }
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
    <div className="h-[calc(100vh-8rem)] max-w-[1500px] mx-auto relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm flex flex-col">
      {/* Absolute floating Character dialog container */}
      {isRefCharsOpen && (
        <div ref={refCharsDialogRef} className="absolute right-[40%] top-20 z-[200] w-64 bg-white border border-gray-100 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-right-2 duration-200">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Select Reference Characters</p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-2 transition-colors">
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${pendingCharIds.has('NONE') ? 'bg-purple-600 border-purple-600' : 'border-gray-200'}`} onClick={() => togglePendingChar('NONE')}>
                {pendingCharIds.has('NONE') && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-xs font-medium text-gray-500">No Character Reference</span>
            </label>
            {characters.map((char) => (
              <label key={char.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-2 transition-colors">
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${pendingCharIds.has(char.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-200'}`} onClick={() => togglePendingChar(char.id)}>
                  {pendingCharIds.has(char.id) && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-xs font-semibold text-gray-700 truncate">{char.name}</span>
              </label>
            ))}
          </div>
          <Button size="sm" className="w-full mt-4 h-9 text-xs bg-purple-600 hover:bg-purple-700 rounded-lg font-bold shadow-sm" onClick={handleConfirmRefChars}>
            Confirm Characters
          </Button>
        </div>
      )}
      <input ref={imageUploadRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <PanelGroup direction="horizontal" className="flex-1 h-full">
        <Panel defaultSize={65} minSize={40}>
          <div className="h-full space-y-4 overflow-y-auto no-scrollbar pb-6 px-6 pt-6 relative">

            {/* Visual Base / Result Monitor */}
            <div className="bg-black/95 rounded-2xl border border-gray-200 p-1 shadow-xl overflow-hidden relative">
              {storyboard?.video_url && !isGeneratingVideo ? (
                <VideoDisplayPanel scene={storyboard as any} isGeneratingVideo={isGeneratingVideo} />
              ) : (
                <div className="group/preview relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center m-0">
                  {storyboard?.image_url ? (
                    <img src={storyboard.image_url} alt="Storyboard base" className="w-full h-full object-contain transition-all duration-700 hover:scale-[1.02] cursor-zoom-in" onClick={() => setZoomImageUrl(storyboard.image_url || null)} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600 gap-3">
                      <ImageIcon className="w-12 h-12 opacity-80 mix-blend-screen" />
                      <p className="text-xs font-semibold tracking-widest uppercase opacity-70">No Image Reference</p>
                    </div>
                  )}
                  {isGeneratingImage && <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white z-10"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /><span className="text-xs font-bold tracking-widest uppercase">Rendering Visuals...</span></div>}
                  {isGeneratingVideo && <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 text-white z-10"><Loader2 className="w-10 h-10 animate-spin text-purple-300" /><span className="text-xs font-black tracking-widest uppercase">Synthesizing Sequence...</span></div>}
                </div>
              )}
            </div>

            {/* AI Video Cinematography Prompt */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3 mx-1">
              <div className="flex items-center justify-between pl-1">
                <Label className="text-[12px] font-black text-gray-800 uppercase tracking-widest flex gap-2 items-center"><Play className="w-4 h-4 text-purple-500 fill-current" /> Director's Script</Label>
                <div className="flex items-center gap-2">
                  <Select value={videoModel} onValueChange={(v: string) => setVideoModel(v as VideoModel)}>
                    <SelectTrigger className="w-36 h-9 text-xs font-bold rounded-xl bg-gray-50 border-gray-100 focus:ring-purple-200">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINMAX" className="text-xs font-bold">MINMAX-3.0</SelectItem>
                      <SelectItem value="WAN" className="text-xs font-bold">WAN-2.1-PRO</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button disabled={isLoading} variant="outline" size="sm" className="h-9 text-xs font-bold rounded-xl text-purple-600 border-purple-200 hover:bg-purple-50 px-4" onClick={handleGenerateVideoPrompt}>
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : 'Generate Video Prompt'}
                  </Button>
                </div>
              </div>
              <Textarea
                value={videoPrompt}
                className="min-h-[160px] text-[13px] bg-gray-50/50 border-none resize-none focus:bg-white transition-colors p-5 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-200 leading-relaxed font-mono shadow-inner"
                onChange={(e) => { setVideoPrompt(e.target.value); setIsVideoPromptChanged(true) }}
                placeholder="Describe precise camera movements, cinematic effects, and atmosphere..."
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" className="text-xs h-9 px-6 font-bold rounded-xl border-gray-200 hover:bg-gray-50" disabled={!isVideoPromptChanged} onClick={handleSavePrompt}>Save</Button>
              </div>
            </div>

          </div>
        </Panel>

        <PanelResizeHandle className="w-[1px] bg-gray-200 shadow-sm" />

        <Panel defaultSize={35} minSize={25}>
          <div className="h-full bg-white flex flex-col border-l border-white/50">
            <div className="flex-1 overflow-y-auto max-h-full no-scrollbar relative">

              {/* Settings Header */}
              <div className="p-6 pb-4 bg-gradient-to-b from-gray-50/80 to-white sticky top-0 z-10 backdrop-blur-md border-b border-gray-50/50">
                <h2 className="text-sm font-black text-gray-900 tracking-tight leading-tight">{storyboard?.title}</h2>
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-1.5 font-medium">{storyboard?.description || 'No scene description.'}</p>
              </div>

              <div className="p-6 pt-2 space-y-8">
                {/* Inspector Section 1: Visual Base Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" /> Image Subject
                    </h3>
                    {storyboard?.image_url && <span className="text-green-600 text-[10px] bg-green-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>}
                  </div>

                  {/* Image Control Toolbar */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-[34px] text-[11px] font-bold flex-1 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm" onClick={() => imageUploadRef.current?.click()}><Upload className="h-3 w-3 mr-1.5" /> Upload</Button>
                    <Button variant="outline" size="sm" className="h-[34px] text-[11px] font-bold flex-1 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm" onClick={handleOpenRefChars}><Users className="h-3 w-3 mr-1.5" /> Choose Actors</Button>
                  </div>

                  <div className="relative group rounded-xl bg-gray-50/80 border border-gray-100 p-1">
                    <PromptChatbox initialValue={storyboard?.prompt || ''} assets={characters} history={storyboard?.image_prompt_history} onGenerate={handleGenerateImage} isGenerating={isGeneratingImage} />
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

                {/* Inspector Section 2: Audio Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5" /> Audio Track
                    </h3>
                    {storyboard?.voice_url && <span className="text-green-600 text-[10px] bg-green-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col relative focus-within:ring-1 focus-within:ring-purple-200 transition-all">
                    <div className="flex justify-between items-center bg-gray-50/80 border-b border-gray-100 px-3 py-2">
                      <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">{speechTypeLabel} SCRIPT</span>
                    </div>
                    {!isDialogue ? (
                      <Textarea value={speechPlain} className="min-h-[100px] border-0 text-[12px] resize-none focus-visible:ring-0 rounded-none shadow-none" placeholder="Enter narration script to voiceover..." onChange={(e) => setSpeechPlain(e.target.value)} />
                    ) : (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar p-2 bg-gray-50/30">
                        {speechLines.map((line, idx) => (
                          <div key={idx} className="flex gap-1.5 items-start bg-white rounded flex-col border border-gray-100 overflow-hidden group">
                            <div className="flex w-full items-center border-b border-gray-50">
                              <span className="w-5 flex items-center justify-center text-[10px] text-gray-300 font-bold bg-gray-50 h-full">{idx + 1}</span>
                              <input value={line.character} className="w-20 font-bold text-indigo-700 bg-transparent text-[11px] p-1.5 outline-none placeholder:text-gray-300 transition-colors" placeholder="Actor" onChange={(e) => {
                                const updated = [...speechLines]; updated[idx] = { ...updated[idx], character: e.target.value }; setSpeechLines(updated)
                              }} />
                              <div className="flex-1 flex justify-end px-1"><button className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSpeechLines(speechLines.filter((_, i) => i !== idx))}>✕</button></div>
                            </div>
                            <Textarea value={line.content} className="flex-1 w-full min-h-[30px] p-2 resize-none bg-transparent text-[12px] border-none focus-visible:ring-0 shadow-none leading-relaxed" placeholder="Type dialogue line..." onChange={(e) => {
                              const updated = [...speechLines]; updated[idx] = { ...updated[idx], content: e.target.value }; setSpeechLines(updated)
                            }} />
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full text-[10px] h-7 font-bold text-gray-400 hover:text-gray-600 mt-2" onClick={() => setSpeechLines([...speechLines, { character: '', content: '' }])}>+ ADD DAILOGUE LINE</Button>
                      </div>
                    )}

                    <div className="flex bg-gray-50 border-t border-gray-100 p-2 gap-2 mt-auto justify-between items-center">
                      <div className="flex gap-2">
                        <Select value={voiceSpeed} onValueChange={setVoiceSpeed}>
                          <SelectTrigger className="w-[85px] h-7 text-[10px] bg-white border-gray-200 rounded shadow-sm font-medium focus:ring-0"><SelectValue placeholder="Speed" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.75" className="text-[10px] font-medium">0.75x</SelectItem>
                            <SelectItem value="1" className="text-[10px] font-medium">1.0x (Nrm)</SelectItem>
                            <SelectItem value="1.25" className="text-[10px] font-medium">1.25x</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={voiceEmotion} onValueChange={setVoiceEmotion}>
                          <SelectTrigger className="w-[85px] h-7 text-[10px] bg-white border-gray-200 rounded shadow-sm font-medium focus:ring-0"><SelectValue placeholder="Emotion" /></SelectTrigger>
                          <SelectContent>
                            {emotions.length > 0 ? (
                              emotions.map((emo) => (
                                <SelectItem key={emo.zh} value={emo.en} className="text-[10px] font-medium">
                                  {emo.en}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="neutral" className="text-[10px] font-medium">Neutral</SelectItem>
                                <SelectItem value="happy" className="text-[10px] font-medium">Emotion</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {storyboard?.voice_url && (
                          <button onClick={toggleAudioPlay} className="h-7 w-7 rounded bg-indigo-600 shadow-sm shadow-indigo-200 text-white flex items-center justify-center hover:bg-indigo-700 transition active:scale-95">
                            {isPlayingAudio ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                          </button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 px-3 text-[10px] bg-white font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm" onClick={handleGenerateAudio} disabled={isGeneratingAudio}>
                          {isGeneratingAudio ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mic className="h-3 w-3 mr-1" />} Sync Audio
                        </Button>
                      </div>
                    </div>
                  </div>
                  <audio ref={audioRef} src={storyboard?.voice_url || undefined} onEnded={() => setIsPlayingAudio(false)} className="hidden" />

                </div>
              </div>

              {/* Pad bottom for floating bar */}
              <div className="pb-32" />
            </div>

            {/* Bottom Sticky Action Area */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-20px_40px_-5px_rgba(0,0,0,0.05)]">
              <div className="mb-3.5 flex gap-1.5 w-full">
                <div className={`flex-1 h-1 rounded-full transition-colors ${storyboard?.image_url ? 'bg-purple-500' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded-full transition-colors ${storyboard?.voice_url || !(isDialogue ? speechLines.some(l => l.content.trim()) : !!speechPlain.trim()) ? 'bg-purple-500' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded-full transition-colors ${videoPrompt ? 'bg-purple-500' : 'bg-gray-200'}`} />
              </div>
              <Button
                size="lg"
                className="w-full h-[52px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[15px] font-black tracking-widest rounded-xl shadow-[0_8px_20px_-6px_rgba(147,51,234,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                disabled={isGeneratingVideo || !storyboard?.image_url || !videoPrompt || ((isDialogue ? speechLines.some(l => l.content.trim()) : !!speechPlain.trim()) && !storyboard?.voice_url)}
                title={((isDialogue ? speechLines.some(l => l.content.trim()) : !!speechPlain.trim()) && !storyboard?.voice_url) ? "Please Sync Audio Track first" : ""}
                onClick={() => handleGenerateVideo()}
              >
                {isGeneratingVideo ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <span className="text-xl mr-2">🎬</span>}
                GENERATE VIDEO
              </Button>
            </div>

          </div>
        </Panel>
      </PanelGroup>

      {/* ── Zoom Dialog ── */}
      <Dialog open={!!zoomImageUrl} onOpenChange={(open: boolean) => !open && setZoomImageUrl(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden border-none bg-transparent shadow-none flex items-center justify-center z-[300]">
          <div className="relative w-full h-full flex items-center justify-center p-8 shrink-0" onClick={() => setZoomImageUrl(null)}>
            <img
              src={zoomImageUrl || ''}
              alt="Zoomed View"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-md animate-in zoom-in-95 duration-500"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
