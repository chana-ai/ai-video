"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Check, Upload, Loader2, Mic, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import type { StoryboardSettingsProps, DialogLine, StoryDetail, AssetImage } from "@/app/ai/projects/types"
import type { AssetResponse, Character } from "@/app/ai/projects/scenes/types"

import instance from "@/lib/axios"
import { PromptChatbox } from "./PromptChatbox"
import { VoiceComponent } from "./VoiceComponent"
import { VideoComponent } from "./video-component"
import { showToast } from "@/lib/toast-helpers"


// API Response Type from /api/v2/asset/list


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

//@TODO  改进意见： 后续只有 state信息才会向上一层进行传递，其他的详情信息不再往上传送。
export function StoryboardSettings({
  storyboard,
  projectDetail,
  onUpdate,
}: StoryboardSettingsProps) {

  // ── General UI state ──

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

  // ── Audio & Voice Controls ──
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


  // Sync when storyboard prop changes
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = storyboard?.description || ''
    if (promptRef.current) promptRef.current.value = storyboard?.prompt || ''
    console.log('storyboard', storyboard)

    instance.get(`/api/v2/scene/detail?project_id=${storyboard.project_id}&stage_id=${storyboard.stage_id}&scene_id=${storyboard.id}`)
      .then((res: any) => {
        console.log('res = ', res)
        if (!res) return

        // Extract voice_url from resource.voices array if present
        let updatedResource = res.resource
        if (!updatedResource.voice_url) {
          if (res.resource?.voices && Array.isArray(res.resource.voices) && res.resource.voices.length > 0) {
            const voiceUrl = res.resource.voices[0].url || ""
            if (voiceUrl) {
              updatedResource = {
                ...res.resource,
                voice_url: voiceUrl
              }
            }
          }
        }

        if (!updatedResource.video_url) {
          if (res.resource?.videos && Array.isArray(res.resource.videos) && res.resource.videos.length > 0) {
            const video = res.resource.videos[0].url || ""
            if (video) {
              updatedResource = {
                ...res.resource,
                video_url: video
              }
            }
          }
        }

        setStoryDetail({
          ...res,
          resource: updatedResource
        })
        if (descriptionRef.current && res.description !== undefined) {
          descriptionRef.current.value = res.description || ''
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
          images: asset.images || [],  // Use the images array from API response
          config: asset.config
        }))
        setCharacters(mapped)
      })
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

  const handleConfirmAssetImage = useCallback((assetName: string, imageId: number) => {
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
        setFocusedImageIndex(prevImagesLength)
        setSelectedImageIndex(prevImagesLength)
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
      setFocusedImageIndex(images.length - 1)
      setSelectedImageIndex(images.length - 1)

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



  // ── Render ────────────────────────────────────────────────

  return (
    <div className="h-full max-w-[1500px] mx-auto relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm flex flex-col">
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
      <div className="p-4 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
        <h2 className="text-base font-black text-gray-900 tracking-tight leading-tight">{storyboard?.title}</h2>
        <p className="text-[12px] text-gray-600 mt-2 font-medium leading-relaxed">
          {storyDetail?.description || storyboard?.description || 'No scene description.'}
        </p>
      </div>

      <PanelGroup direction="horizontal" className="flex-1 h-full min-h-0">
        {/* Left Column: Image and Voice Components */}
        <Panel defaultSize={50} minSize={35}>
          <div className="h-full space-y-6 overflow-y-auto no-scrollbar pb-4 px-4 pt-4 bg-gray-50/50">
            {/* 2. Image Component */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Image Subject
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

              </div>

              {/* Image Prompt */}
              <div className="relative group rounded-xl bg-gray-50/80 border border-gray-100 p-1 h-48">
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
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 flex items-center gap-2">
                  <Mic className="w-3 h-3" /> Audio Track
                </h3>
                <div className="flex items-center gap-2">

                  {(storyDetail?.resource?.voice_url) && (
                    <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  )}
                </div>
              </div>

              <VoiceComponent
                storyboardId={storyboard.id}
                storyboardConfig={storyDetail?.config}
                projectDetail={projectDetail || null}
                characters={characters}
                voice_url={storyDetail?.resource?.voice_url || null}
                speechTypeLabel={speechTypeLabel}
                speechPlain={speechPlain}
                speechLines={speechLines}
                isDialogue={isDialogue}
                on_update_scene_voice_setting={(voice_url: string, voice_settings: any) => {
                  setStoryDetail(prev => {
                    if (!prev || !prev.config) return prev

                    // Build dialogue object based on narration type
                    let dialogue: any
                    if (isDialogue) {
                      // For dialogue mode, create array with character info
                      dialogue = [{
                        asset_id: voice_settings.selected_asset_id,
                        asset_name: voice_settings.selected_asset_name,
                        content: voice_settings.text
                      }]
                    } else {
                      // For narration/monologue mode, store as string
                      dialogue = {
                        asset_id: voice_settings.selected_asset_id,
                        asset_name: voice_settings.selected_asset_name,
                        content: voice_settings.text
                      }
                    }

                    return {
                      ...prev,
                      config: {
                        ...prev.config,
                        voice_settings: {
                          voice_name: voice_settings.voice_name,
                          voice_speed: voice_settings.speed,
                          emotion: voice_settings.emotion,
                          mode: voice_settings.mode,
                          vendor: voice_settings.vendor
                        },
                        dialogue: dialogue
                      },
                      resource: {
                        ...prev.resource,
                        voice_url: voice_url
                      }
                    }
                  })
                }}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-[1px] bg-gray-200 shadow-sm" />

        {/* Right Column: Video Component */}
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto no-scrollbar pb-4 px-4 pt-4 bg-white border-l border-gray-100">
            <VideoComponent
              storyboardId={storyboard?.id}
              storyboard={storyDetail}
              projectDetail={projectDetail}
              image_id={storyDetail?.resource?.images[selectedImageIndex]?.id}
              video_url={storyDetail?.resource?.video_url || storyDetail?.resource?.videos}
              isDialogue={isDialogue}
              onUpdateVideoPrompt={(prompt) => {
                // That's OK. 
                updateStoryDetailField(prev => ({
                  ...prev,
                  config: {
                    ...prev?.config,
                    video_prompt: prompt
                  }
                }))
              }}
              onUpdateVideoUrl={(url) => {
                updateStoryDetailField(prev => ({
                  ...prev,
                  resource: {
                    ...prev?.resource,
                    video_url: url
                  }
                }))
              }}
              onUpdateVideoTaskId={(taskId) => {
                onUpdate("video_task_id", taskId)
              }}
            />
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
    </div >
  )
}
