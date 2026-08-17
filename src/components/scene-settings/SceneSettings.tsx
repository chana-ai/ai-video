"use client"

import React, { useState } from "react"
import { SceneMetaSection } from "./SceneMetaSection"
import { AssetReferenceMap } from "./AssetReferenceMap"
import { VisualReferenceGallery } from "./VisualReferenceGallery"
import { ScenePromptSection } from "./ScenePromptSection"
import { SceneVideoPanel } from "./SceneVideoPanel"
import { ImageViewerDialog } from "./ImageViewerDialog"
import { useSceneState } from "@/hooks/useSceneState"
import { useAssetList } from "@/hooks/useAssetList"
import { useGalleryNavigation } from "@/hooks/useGalleryNavigation"
import { sceneApi } from "@/lib/api/scene-api"
import { showToast } from "@/lib/toast-helpers"
import { SceneSettingsProps } from "@/types/scene-settings"

/**
 * Main SceneSettings component - reusable for displaying and editing scene settings
 * Designed with a compact, clean layout
 */
export function SceneSettings({ scene, onUpdate }: SceneSettingsProps) {
  // Custom hooks for reusable logic
  const { title, setTitle, description, setDescription, prompt, setPrompt, handleUpdate } = useSceneState(scene)
  const { assets } = useAssetList(scene.project_id, scene.stage_id)
  const { previewIndex, setPreviewIndex } = useGalleryNavigation(scene.image_urls || [], -1)

  // Local state for dialogs and operations
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)

  // Generate scene image
  const handleGenerateSceneImage = async () => {
    if (!scene.id || !scene.project_id || !scene.stage_id) return

    setIsGeneratingImage(true)
    try {
      const res: any = await sceneApi.generateSceneImage(
        scene.id,
        scene.project_id,
        scene.stage_id,
        prompt
      )
      const newUrls: string[] = res.data?.image_url ? Object.values(res.data.image_url) as string[] : []
      onUpdate("image_urls", newUrls)
      setPreviewIndex(newUrls.length - 1)
      showToast('Scene image generated successfully!', 'success')
    } catch (error: any) {
      showToast(`生成失败: ${error.message || '未知错误'}`, 'error')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Zoom image handler
  const handleZoomImage = (url: string) => {
    setZoomImageUrl(url)
  }

  // Scene update handler (syncs with parent)
  const handleSceneUpdate = (key: string, value: any) => {
    handleUpdate(key, value)
    onUpdate(key, value)
  }

  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 overflow-y-auto">
      {/* Scene Meta Section - Compact */}
      <div className="space-y-2.5">
        <SceneMetaSection
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          onUpdate={handleSceneUpdate}
        />
      </div>

      {/* Assets & Base Reference - Compact Grid */}
      <div className="grid grid-cols-12 gap-3 min-h-[240px]">
        <div className="col-span-4 space-y-2">
          <AssetReferenceMap assets={assets} />
        </div>
        <div className="col-span-8 space-y-2">
          <VisualReferenceGallery
            imageUrls={scene.image_urls || []}
            previewIndex={previewIndex}
            setPreviewIndex={setPreviewIndex}
            onZoom={handleZoomImage}
          />
        </div>
      </div>

      {/* Scene Prompt Section - Compact */}
      <div className="space-y-2">
        <ScenePromptSection
          prompt={prompt}
          setPrompt={setPrompt}
          isGeneratingImage={isGeneratingImage}
          onGenerate={handleGenerateSceneImage}
        />
      </div>

      {/* Scene Video Panel - Compact */}
      {/* <div className="space-y-1.5">
        <SceneVideoPanel scene={scene} />
      </div> */}

      {/* Dialogs */}
      <ImageViewerDialog
        open={!!zoomImageUrl}
        imageUrl={zoomImageUrl || ''}
        onClose={() => setZoomImageUrl(null)}
      />
    </div>
  )
}
