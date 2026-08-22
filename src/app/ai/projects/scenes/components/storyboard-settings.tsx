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
} from "@/components/ui/alert-dialog"
import { Users, Check, Upload, Play, Pause, Loader2, Mic, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import type { StoryboardSettingsProps, DialogLine, StoryDetail, AssetImage } from "@/app/ai/projects/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import instance from "@/lib/axios"
import { PromptChatbox } from "./PromptChatbox"
import { wsManager, type WsMessage } from "@/lib/websocket"
import { showToast } from "@/lib/toast-helpers"
// import { url } from "inspector"

type VideoModel = 'MINMAX' | 'WAN'

// API Response Type from /api/v2/asset/list
interface AssetResponse {
  id: number;
  name: string;
  url: string;
  version?: number;
}

interface Character {
  id: number;
  name: string;
  images: AssetResponse[];  // Changed to required array, not optional
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

  // ── Video prompt meta & detail ──
  const [isLoading, setIsLoading] = useState(false)
  const [storyDetail, setStoryDetail] = useState<StoryDetail | null>(null)

  // ── Ref characters ──
  const [isRefCharsOpen, setIsRefCharsOpen] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharIds, setSelectedCharIds] = useState<Set<number | 'NONE'>>(new Set<number | 'NONE'>(['NONE']))
  const [pendingCharIds, setPendingCharIds] = useState<Set<number | 'NONE'>>(new Set<number | 'NONE'>(['NONE']))

  // ── Audio & Speech ──
  const [emotions, setEmotions] = useState<{ en: string, zh: string }[]>([])
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  const [zoomImageIndex, setZoomImageIndex] = useState<number>(0)
  const imageUploadRef = useRef<HTMLInputElement>(null)
  const refCharsDialogRef = useRef<HTMLDivElement>(null)

  // Image component state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [focusedImageIndex, setFocusedImageIndex] = useState<number>(0)
  const images = storyDetail?.resource?.images || []

  const narration = storyboard?.config?.narration ?? projectDetail?.narration ?? 1
  const speechTypeLabel = narrationLabel(narration)
  const isDialogue = narration === 3

  const updateStoryDetailField = useCallback((updater: (prev: StoryDetail) => StoryDetail) => {
    setStoryDetail(prev => prev ? updater(prev) : null)
  }, [])

  const parsedDialogue = useMemo(() => {
    return parseDialog(storyDetail?.config?.dialogue, narration)
  }, [storyDetail?.config?.dialogue, narration])

  const speechPlain = parsedDialogue.plain
  const speechLines = parsedDialogue.lines

  const currentVoiceSpeed = String(
    storyDetail?.config?.voice_settings?.speech_rate ??
    projectDetail?.config?.voice_setting?.voice_speed ??
    '1.0'
  )
  const currentVoiceEmotion = storyDetail?.config?.voice_settings?.emotion || 'neutral'
  const currentVideoModel = (storyDetail?.config?.video_settings?.model || 'MINMAX') as VideoModel

  // Sync when storyboard prop changes
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = storyboard?.description || ''
    if (promptRef.current) promptRef.current.value = storyboard?.prompt || ''
    console.log('storyboard', storyboard)

    instance.get(`/api/v2/scene/detail?project_id=${storyboard.project_id}&stage_id=${storyboard.stage_id}&scene_id=${storyboard.id}`)
      .then((res: any) => {
        console.log('res = ', res)
        if (res) {
          setStoryDetail(res)
          if (descriptionRef.current && res.description !== undefined) {
            descriptionRef.current.value = res.description || ''
          }
        }
      })
      .catch((err) => console.error("Failed to fetch scene detail:", err))

  }, [storyboard.id, narration])


  // Fetch characters
  useEffect(() => {
    if (!storyboard?.project_id || !storyboard?.stage_id) return
    instance.get(`/api/v2/asset/list?project_id=${storyboard.project_id}&stage_id=${storyboard.stage_id}`)
      .then((res: any) => {
        // Map assets to Character interface using the new API response structure
        const mapped = (res.assets || []).map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          images: asset.images || []  // Use the images array from API response
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
          setStoryDetail(prev => {
            if (!prev) return null
            return {
              ...prev,
              config: {
                ...prev.config,
                voice_settings: {
                  ...prev.config?.voice_settings,
                  emotion: fetchedEmotions[0].en
                }
              }
            }
          })
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

  // Track asset image mapping for initial image generation
  const [assetImageMap, setAssetImageMap] = useState<Record<string, AssetImage>>({})

  // Initialize assetImageMap from scene detail and assets list
  useEffect(() => {
    if (!storyboard?.project_id || !storyboard?.stage_id || !storyDetail?.config?.assets) {
      return
    }

    // Create a map of asset_name -> config from scene detail
    const configAssetsMap = new Map<string, any>()
    storyDetail.config.assets.forEach((asset: any) => {
      configAssetsMap.set(asset.asset_name, asset)
    })

    // Initialize assetImageMap with all assets from /asset/list
    const newAssetImageMap: Record<string, AssetImage> = {}

    characters.forEach(char => {
      const configAsset = configAssetsMap.get(char.name)

      if (configAsset && configAsset.image_id) {
        // If asset is configured with resource_id, add with the image_id
        newAssetImageMap[char.name] = {
          asset_name: char.name,
          asset_id: char.id,
          image_id: configAsset.image_id
        }
      }
    })

    setAssetImageMap(newAssetImageMap)
    console.log('Initialized assetImageMap:', newAssetImageMap)
  }, [characters, storyDetail?.config?.assets])

  const handleImagePromptChange = useCallback((prompt: string) => {
    if (prompt) {
      onUpdate("image_prompt", prompt)
      console.log("Image prompt updated:", prompt)
    }
  }, [onUpdate])

  const handleConfirmAssetImage = useCallback((assetName: string, imageId: number, prompt: string) => {
    // Find the asset to get its ID
    const asset = characters.find(c => c.name === assetName)

    // Update the asset image map with new structure
    setAssetImageMap(prev => ({
      ...prev,
      [assetName]: {
        asset_name: assetName,
        asset_id: asset?.id || 0,
        image_id: imageId
      }
    }))

    // Also update resolvedAssets for backward compatibility
    // setResolvedAssets(prev => ({
    //   ...prev,
    //   [assetName]: imageId
    // }))

    console.log(`Confirmed asset image: ${assetName} with id ${imageId}`)
    console.log("Asset image map:", assetImageMap)
  }, [characters])

  const handleGenerateImage = async (prompt: string, resolvedAssets?: Record<string, AssetImage>) => {
    setIsGeneratingImage(true)

    // Convert resolvedAssets to AssetImage format for the request
    const assetImageMap = resolvedAssets
      ? Object.entries(resolvedAssets).map(([asset_name, { asset_id, image_id }]) => ({
        asset_name,
        asset_id,
        image_id
      }))
      : []

    try {
      const res: any = await instance.post('/api/v2/scene/generateSceneImage', {
        scene_id: storyboard?.id,
        project_id: storyboard?.project_id,
        stage_id: storyboard?.stage_id,
        prompt: prompt,
        asset_image_map: assetImageMap // New field for asset-image mapping
      })

      console.log('Image generation response:', res)

      // Process response: update image list and image URL
      onUpdate("image_prompt", prompt)

      // Handle response with data.images structure
      if (res && res.data && res.data.images && Array.isArray(res.data.images)) {
        const newImages = res.data.images.map((item: any) => ({
          id: item.id,
          url: item.signed_url
        }))

        // Get the previous images length
        const prevImagesLength = images.length

        // Append to existing images
        setStoryDetail(prev => {
          if (!prev || !prev.resource) return prev
          return {
            ...prev,
            resource: {
              ...prev.resource,
              images: [...(prev.resource.images || []), ...newImages]
            }
          }
        })

        // Focus on the newly added image (last image)
        setFocusedImageIndex(prev => prevImagesLength)
      }

      // Also check for image_url in root level
      if (res.image_url) {
        onUpdate("image_url", res.image_url)
      }

      setIsGeneratingImage(false)
    } catch (error: any) {
      console.error("Failed to generate image:", error)
      console.error("Error details:", error.response?.data)
      setIsGeneratingImage(false)
    }
  }

  const handleGenerateVideoPrompt = async () => {
    setIsLoading(true)
    instance.post('/api/v2/scene/generateVideoPrompt', {
      scene_id: storyboard?.id, stage_id: storyboard?.stage_id, project_id: storyboard?.project_id, video_model: currentVideoModel,
    }).then((res: any) => { onUpdate("video_prompt", res.video_prompt); setIsLoading(false) })
      .catch((error: any) => { console.error(error.message); setIsLoading(false) })
  }

  const handleGenerateVideo = useCallback(async (regenerate_prompt = false) => {
    if (!storyboard?.id || !storyboard?.project_id || !storyboard?.stage_id) return

    setIsGeneratingVideo(true)

    try {
      // Subscribe to WebSocket events for this generation
      const unsubscribeAccepted = wsManager.subscribe('createVideoClipAccepted', (message: WsMessage) => {
        console.log('createVideoClipAccepted:', message)
        // Store task_id in the scene config
        if (message.task_id) {
          onUpdate("video_task_id", message.task_id)
        }
      })

      const unsubscribeComplete = wsManager.subscribe('createVideoClipComplete', async (message: WsMessage) => {
        console.log('createVideoClipComplete:', message)

        if (message.data && message.data.video_url) {
          // Update the storyboard with the video URL
          onUpdate("video_url", message.data.video_url)

          // Also update the parent scene's video_url
          if (storyboard.parent_id) {
            onUpdate("video_url", message.data.video_url)
          }

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
          storyboard.id,
          storyDetail?.video_prompt || "",
          storyboard.project_id,
          storyboard.stage_id,
          projectDetail?.user_id || 0
        )

        onUpdate("video_prompt", storyDetail?.video_prompt || "")

      } finally {
        // Cleanup subscriptions
        unsubscribeAccepted()
        unsubscribeComplete()
        unsubscribeError()
      }
    } catch (error: any) {
      setIsGeneratingVideo(false)
    }
  }, [onUpdate, storyboard?.id, storyboard?.project_id, storyboard?.stage_id, storyDetail?.video_prompt, currentVideoModel, projectDetail?.user_id])

  const handleOpenRefChars = () => { setPendingCharIds(new Set(selectedCharIds)); setIsRefCharsOpen(true) }
  const handleConfirmRefChars = () => { setSelectedCharIds(new Set(pendingCharIds)); setIsRefCharsOpen(false) }

  // Image component handlers
  const handleImageClick = (index: number) => {
    setZoomImageIndex(index)
    setZoomImageUrl(images[index]?.url || null)
  }

  const handlePreviousImage = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (images.length === 0) return
    const newIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1
    setSelectedImageIndex(newIndex)
    setZoomImageIndex(newIndex)
    // If zoom is open, also update zoomImageUrl to show the previous image
    if (zoomImageUrl) {
      setZoomImageUrl(images[newIndex]?.url || null)
    }
  }

  const handleNextImage = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (images.length === 0) return
    const newIndex = selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1
    setSelectedImageIndex(newIndex)
    setZoomImageIndex(newIndex)
    // If zoom is open, also update zoomImageUrl to show the next image
    if (zoomImageUrl) {
      setZoomImageUrl(images[newIndex]?.url || null)
    }
  }

  const handleSelectImage = async (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!storyboard?.id) return

    // Set the selected index (exclusive selection)
    setSelectedImageIndex(index)
    setFocusedImageIndex(index)

    // try {
    //   const res = await instance.post('/api/v2/scene/selectReferenceImage', {
    //     image_id: images[index].id,
    //     type: 'VIDEO_GENERATION'
    //   })
    //   console.log('Selected image:', res)
    //   showToast('Reference image selected successfully', 'success')
    // } catch (error: any) {
    //   console.error('Failed to select image:', error)
    //   showToast('Failed to select reference image', 'error')
    // }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storyboard) return

    try {
      const formData = new FormData()
      formData.append('project_id', String(storyboard.project_id))
      formData.append('stage_id', String(storyboard.stage_id))
      formData.append('scene_id', String(storyboard.id))
      formData.append('user_id', String(projectDetail?.user_id || 0))
      formData.append('image', file)

      const res: any = await instance.post('/api/v2/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('Upload response:', res)

      // Extract required fields from response matching AssetResponse interface
      const newImage: AssetResponse = {
        id: res.id,
        name: res.name,
        url: res.signed_url || res.url
      }

      // Add to images array
      setStoryDetail(prev => {
        if (!prev || !prev.resource) return prev
        return {
          ...prev,
          resource: {
            ...prev.resource,
            images: [...(prev.resource.images || []), newImage]
          }
        }
      })

      // Focus on the newly added image (the last one in the array)
      setFocusedImageIndex(prev => Math.max(0, images.length))
      showToast('Image uploaded successfully', 'success')
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      showToast('Failed to upload image', 'error')
    }
  }

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (e.key === 'ArrowLeft') handlePreviousImage(e as any)
        if (e.key === 'ArrowRight') handleNextImage(e as any)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomImageIndex, images, selectedImageIndex])

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
        speed: currentVoiceSpeed,
        emotion: currentVoiceEmotion
      })
      if (res.voice_path) {
        onUpdate("voice_url", res.voice_path)
        onUpdate("voice_setting", { speech_rate: currentVoiceSpeed, emotion: currentVoiceEmotion })
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

      {/* 1. Storyboard Description */}
      <div className="p-6 pb-4 bg-white border-b border-gray-100 flex-shrink-0">
        <h2 className="text-base font-black text-gray-900 tracking-tight leading-tight">{storyboard?.title}</h2>
        <p className="text-[12px] text-gray-600 mt-2 font-medium leading-relaxed">
          {storyDetail?.description || storyboard?.description || 'No scene description.'}
        </p>
      </div>

      <PanelGroup direction="horizontal" className="flex-1 h-full min-h-0">
        {/* Left Column: Image and Voice Components */}
        <Panel defaultSize={50} minSize={35}>
          <div className="h-full space-y-6 overflow-y-auto no-scrollbar pb-6 px-6 pt-6 bg-gray-50/50">
            {/* 2. Image Component */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" /> Image Subject
                </h3>
                {images.length > 0 && (
                  <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>

              {/* Image Show Box */}
              <div className="group/preview relative h-[350px] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-100">
                {images.length > 0 ? (
                  <>
                    {/* Main Image Display */}
                    <img
                      src={images[selectedImageIndex]?.url}
                      alt={`Storyboard image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-contain transition-all duration-700 hover:scale-[1.02] cursor-zoom-in"
                      onClick={() => handleImageClick(selectedImageIndex)}
                    />

                    {/* Selection Circle */}
                    <button
                      className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 transition-all z-30 flex items-center justify-center"
                      onClick={(e) => {
                        // e.stopPropagation()
                        // e.preventDefault()
                        handleSelectImage(selectedImageIndex, e)
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                      }}
                      type="button"
                      style={{
                        borderColor: selectedImageIndex === focusedImageIndex ? '#22c55e' : '#9ca3af',
                        backgroundColor: selectedImageIndex === focusedImageIndex ? '#22c55e' : '#f3f4f6',
                      }}
                    >
                      {selectedImageIndex === focusedImageIndex && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </button>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          className="absolute left-0 top-0 bottom-0 w-24 -translate-x-1/2 bg-gradient-to-r from-black/30 to-transparent hover:from-black/50 hover:to-black/30 flex items-center justify-start pl-8 opacity-0 group-hover/preview:opacity-100 transition-opacity z-20"
                          onClick={handlePreviousImage}
                        >
                          <ChevronLeft className="w-12 h-12 text-white/90" />
                        </button>
                        <button
                          className="absolute right-0 top-0 bottom-0 w-24 translate-x-1/2 bg-gradient-to-l from-black/30 to-transparent hover:from-black/50 hover:to-black/30 flex items-center justify-end pr-8 opacity-0 group-hover/preview:opacity-100 transition-opacity z-20"
                          onClick={handleNextImage}
                        >
                          <ChevronRight className="w-12 h-12 text-white/90" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-20">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-600 gap-3">
                    <ImageIcon className="w-12 h-12 opacity-80 mix-blend-screen" />
                    <p className="text-xs font-semibold tracking-widest uppercase text-gray-700">No Image Reference</p>
                  </div>
                )}

                {isGeneratingImage && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white z-30">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    <span className="text-xs font-bold tracking-widest uppercase">Rendering Visuals...</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-[34px] text-[11px] font-bold flex-1 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
                  onClick={() => imageUploadRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1.5" /> Upload Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-[34px] text-[11px] font-bold flex-1 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
                  onClick={handleOpenRefChars}
                >
                  <Users className="h-3 w-3 mr-1.5" /> Choose Actors
                </Button>
              </div>

              {/* Image Prompt */}
              <div className="relative group rounded-xl bg-gray-50/80 border border-gray-100 p-1">
                <PromptChatbox
                  prompt={storyDetail?.image_prompt || storyboard?.prompt || ''}
                  assets={characters}
                  onGenerate={handleGenerateImage}
                  isGenerating={isGeneratingImage}
                  onImagePromptChange={handleImagePromptChange}
                  onConfirmAssetImage={handleConfirmAssetImage}
                  asset_image_map={assetImageMap}
                />
              </div>
            </div>

            {/* 3. Voice Component */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5" /> Audio Track
                </h3>
                {(storyDetail?.resource?.voice_url || storyboard?.voice_url) && (
                  <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col relative focus-within:ring-1 focus-within:ring-purple-200 transition-all">
                <div className="flex justify-between items-center bg-gray-50/80 border-b border-gray-100 px-3 py-2">
                  <span className="text-[10px] font-bold text-gray-700 tracking-widest uppercase">{speechTypeLabel} SCRIPT</span>
                </div>
                {!isDialogue ? (
                  <Textarea
                    value={speechPlain}
                    className="min-h-[100px] border-0 text-[12px] resize-none focus-visible:ring-0 rounded-none shadow-none"
                    placeholder="Enter narration script to voiceover..."
                    onChange={(e) => {
                      const val = e.target.value
                      updateStoryDetailField(prev => {
                        let newDialogue: any
                        if (typeof prev.config?.dialogue === 'string') {
                          newDialogue = val
                        } else {
                          newDialogue = {
                            ...prev.config?.dialogue,
                            content: val
                          }
                        }
                        return {
                          ...prev,
                          config: {
                            ...prev.config,
                            dialogue: newDialogue
                          }
                        }
                      })
                    }}
                  />
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar p-2 bg-gray-50/30">
                    {speechLines.map((line, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start bg-white rounded flex-col border border-gray-100 overflow-hidden group">
                        <div className="flex w-full items-center border-b border-gray-50">
                          <span className="w-5 flex items-center justify-center text-xs text-gray-600 font-bold bg-gray-50 h-full">{idx + 1}</span>
                          <input
                            value={line.character}
                            className="w-20 font-bold text-indigo-700 bg-transparent text-xs p-1.5 outline-none placeholder:text-gray-500 transition-colors"
                            placeholder="Actor"
                            onChange={(e) => {
                              const name = e.target.value
                              updateStoryDetailField(prev => {
                                let currentDialogue = Array.isArray(prev.config?.dialogue) ? [...prev.config.dialogue] : []
                                if (currentDialogue[idx]) {
                                  currentDialogue[idx] = {
                                    ...currentDialogue[idx],
                                    asset_name: name,
                                    character: name
                                  }
                                }
                                return {
                                  ...prev,
                                  config: {
                                    ...prev.config,
                                    dialogue: currentDialogue
                                  }
                                }
                              })
                            }}
                          />
                          <div className="flex-1 flex justify-end px-1">
                            <button
                              className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                updateStoryDetailField(prev => {
                                  let currentDialogue = Array.isArray(prev.config?.dialogue) ? [...prev.config.dialogue] : []
                                  const updatedLines = currentDialogue.filter((_, i) => i !== idx)
                                  return {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      dialogue: updatedLines
                                    }
                                  }
                                })
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
                            const content = e.target.value
                            updateStoryDetailField(prev => {
                              let currentDialogue = Array.isArray(prev.config?.dialogue) ? [...prev.config.dialogue] : []
                              if (currentDialogue[idx]) {
                                currentDialogue[idx] = {
                                  ...currentDialogue[idx],
                                  content
                                }
                              }
                              return {
                                ...prev,
                                config: {
                                  ...prev.config,
                                  dialogue: currentDialogue
                                }
                              }
                            })
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7 font-bold text-gray-600 hover:text-gray-700 mt-2"
                      onClick={() => {
                        updateStoryDetailField(prev => {
                          let currentDialogue = Array.isArray(prev.config?.dialogue) ? [...prev.config.dialogue] : []
                          const updatedLines = [...currentDialogue, { asset_name: '', character: '', content: '' }]
                          return {
                            ...prev,
                            config: {
                              ...prev.config,
                              dialogue: updatedLines
                            }
                          }
                        })
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
                        updateStoryDetailField(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            voice_settings: {
                              ...prev.config?.voice_settings,
                              speech_rate: Number(v)
                            }
                          }
                        }))
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
                        updateStoryDetailField(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            voice_settings: {
                              ...prev.config?.voice_settings,
                              emotion: v
                            }
                          }
                        }))
                      }}
                    >
                      <SelectTrigger className="w-[85px] h-7 text-xs bg-white border-gray-200 rounded shadow-sm font-medium focus:ring-0">
                        <SelectValue placeholder="Emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        {emotions.length > 0 ? (
                          emotions.map((emo) => (
                            <SelectItem key={emo.zh} value={emo.en} className="text-xs font-medium">
                              {emo.en}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="neutral" className="text-xs font-medium">Neutral</SelectItem>
                            <SelectItem value="happy" className="text-xs font-medium">Emotion</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(storyDetail?.resource?.voice_url || storyboard?.voice_url) && (
                      <button
                        onClick={toggleAudioPlay}
                        className="h-7 w-7 rounded bg-indigo-600 shadow-sm shadow-indigo-200 text-white flex items-center justify-center hover:bg-indigo-700 transition active:scale-95"
                      >
                        {isPlayingAudio ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
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
              <audio
                ref={audioRef}
                src={storyDetail?.resource?.voice_url || storyboard?.voice_url || undefined}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-[1px] bg-gray-200 shadow-sm" />

        {/* Right Column: Video Component */}
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto no-scrollbar pb-6 px-6 pt-6 bg-white border-l border-gray-100">
            {/* 4. Video Component */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-purple-500 fill-current" /> Video Settings
                  </h3>
                  {(storyDetail?.resource?.video_url || storyboard?.video_url) && (
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
                  ) : (storyDetail?.resource?.video_url || storyboard?.video_url) ? (
                    <video
                      src={storyDetail?.resource?.video_url || storyboard?.video_url}
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
                  <Select
                    value={currentVideoModel}
                    onValueChange={(v: string) => {
                      updateStoryDetailField(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          video_settings: {
                            ...prev.config?.video_settings,
                            model: v
                          }
                        }
                      }))
                    }}
                  >
                    <SelectTrigger className="w-32 h-9 text-xs font-bold rounded-xl bg-gray-50 border-gray-100 focus:ring-purple-200">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINMAX" className="text-xs font-bold">MINMAX-3.0</SelectItem>
                      <SelectItem value="WAN" className="text-xs font-bold">WAN-2.1-PRO</SelectItem>
                    </SelectContent>
                  </Select>

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
                    value={storyDetail?.video_prompt || ""}
                    className="min-h-[140px] text-sm bg-gray-50/50 border-none resize-none focus:bg-white transition-colors p-4 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-200 leading-relaxed font-mono shadow-inner"
                    onChange={(e) => { const val = e.target.value; updateStoryDetailField(prev => ({ ...prev, video_prompt: val })) }}
                    placeholder="Describe precise camera movements, cinematic effects, and atmosphere..."
                  />
                </div>
              </div>

              {/* Generate Video Action Button */}
              <div className="pt-4 border-t border-gray-100 mt-auto">
                <Button
                  size="lg"
                  className="w-full h-[52px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-base font-black tracking-widest rounded-xl shadow-[0_8px_20px_-6px_rgba(147,51,234,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                  disabled={isGeneratingVideo || images.length === 0 || !storyDetail?.video_prompt || ((isDialogue ? speechLines.some(l => l.content.trim()) : !!speechPlain.trim()) && !(storyDetail?.resource?.voice_url || storyboard?.voice_url))}
                  title={((isDialogue ? speechLines.some(l => l.content.trim()) : !!speechPlain.trim()) && !(storyDetail?.resource?.voice_url || storyboard?.voice_url)) ? "Please Sync Audio Track first" : ""}
                  onClick={() => handleGenerateVideo()}
                >
                  {isGeneratingVideo ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <span className="text-xl mr-2">🎬</span>}
                  GENERATE VIDEO
                </Button>
              </div>
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
