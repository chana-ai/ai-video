# Scene-Settings Component Refactoring Plan

## Objective
Transform the `SceneSettings` component into a reusable, shared component that can be used across the entire project, not just in `/ai/projects/scenes`.

---

## Current State Analysis

### Location
- **Current Path**: `src/app/ai/projects/scenes/components/scene-settings.tsx` (325 lines)
- **Usage**: Only in `/ai/projects/scenes/page.tsx` (lines 643-647)

### Dependencies
- UI Components: Button, Textarea, Input, Label, Dialog
- Icons: lucide-react
- Types: Scene, ProjectDetail, Asset (from `../types` and `../../value-assets/types`)
- Internal: VideoDisplayPanel
- Utilities: axios instance

### Issues Identified
1. **Monolithic structure** - 325 lines makes it hard to maintain
2. **Hard-coded API endpoints** - No abstraction layer
3. **Mixed concerns** - UI, data fetching, business logic all together
4. **Local state duplication** - title, description, prompt duplicated from props
5. **No custom hooks** - Data fetching logic not reusable
6. **Styling hardcoded** - Tailwind classes scattered throughout
7. **Dialogs embedded** - Two dialogs tightly coupled
8. **Asset fetching inefficient** - Fetches ALL assets every time
9. **Error handling inconsistent** - Uses native alert() instead of toast

---

## Refactoring Strategy

### Phase 1: Create Shared Component Structure
**Goal**: Extract common types and utilities that can be used by multiple components

#### 1.1 Create Shared Types File
**File**: `src/types/scene-settings.ts`
```typescript
// Shared types for scene settings component
export interface SceneSettingsProps {
  scene: Scene
  projectDetail: ProjectDetail | null
  onUpdate: (key: string, value: any) => void
}

export interface Asset {
  id: number
  name: string
  images?: ImageInfo[]
  // ... other asset fields
}

export interface ImageInfo {
  id: number
  url: string
  // ... other image fields
}
```

**Rationale**: Centralize type definitions to avoid circular dependencies

#### 1.2 Create Shared API Utility
**File**: `src/lib/api/scene-api.ts`
```typescript
import instance from '@/lib/axios'

export const sceneApi = {
  // Fetch all assets for a project/stage
  listAssets(projectId: number, stageId: number, withImage: boolean = false) {
    return instance.get(`/api/v2/asset/list`, {
      params: { project_id: projectId, stage_id: stageId, with_image: withImage }
    })
  },

  // Generate scene image
  generateSceneImage(sceneId: number, projectId: number, stageId: number, prompt: string) {
    return instance.post('/api/v2/scene/generateSceneImage', {
      scene_id: sceneId,
      project_id: projectId,
      stage_id: stageId,
      prompt
    })
  },

  // Update scene data
  updateScene(id: number, projectId: number, stageId: number, data: Partial<Scene>) {
    return instance.post('/api/v2/scene/update', { id, project_id: projectId, stage_id: stageId, ...data })
  }
}
```

**Rationale**: Centralize API calls, make them reusable and testable

#### 1.3 Create Custom Hooks
**File**: `src/hooks/useSceneState.ts`
```typescript
export function useSceneState(scene: Scene) {
  const [title, setTitle] = useState(scene.title)
  const [description, setDescription] = useState(scene.description ?? '')
  const [prompt, setPrompt] = useState(scene.prompt ?? '')

  // Sync with external scene prop
  useEffect(() => {
    setTitle(scene.title)
    setDescription(scene.description ?? '')
    setPrompt(scene.prompt ?? '')
  }, [scene])

  const handleUpdate = useCallback((key: string, value: any) => {
    // Update both local state and callback
    setTitle(title) // triggers effect
    // Also call parent callback via useEffect
  }, [title])

  return { title, setTitle, description, setDescription, prompt, setPrompt, handleUpdate }
}
```

**File**: `src/hooks/useAssetList.ts`
```typescript
export function useAssetList(projectId: number | undefined, stageId: number | undefined) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId || !stageId) return

    setLoading(true)
    sceneApi.listAssets(projectId, stageId, true)
      .then(res => setAssets(res.assets || []))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [projectId, stageId])

  return { assets, loading, error }
}
```

**File**: `src/hooks/useGalleryNavigation.ts`
```typescript
export function useGalleryNavigation(imageUrls: string[], initialIndex: number = -1) {
  const [previewIndex, setPreviewIndex] = useState(initialIndex)

  // Auto-select last image if no selection
  useEffect(() => {
    if (previewIndex === -1 && imageUrls.length > 0) {
      setPreviewIndex(imageUrls.length - 1)
    }
  }, [imageUrls, previewIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imageUrls.length <= 1) return

      const currentIndex = previewIndex === -1 ? imageUrls.length - 1 : previewIndex

      if (e.key === "ArrowLeft") {
        setPreviewIndex(Math.max(0, currentIndex - 1))
      } else if (e.key === "ArrowRight") {
        setPreviewIndex(Math.min(imageUrls.length - 1, currentIndex + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewIndex, imageUrls.length])

  return { previewIndex, setPreviewIndex }
}
```

**Rationale**: Extract reusable logic into custom hooks

---

### Phase 2: Break Down into Subcomponents

**Goal**: Create modular, reusable subcomponents

#### 2.1 Extract Scene Meta Section
**File**: `src/components/scene-settings/SceneMetaSection.tsx`
```typescript
export function SceneMetaSection({
  title,
  setTitle,
  description,
  setDescription,
  onUpdate
}: SceneMetaSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scene Name</Label>
        <Input
          value={title}
          className="text-xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-gray-200"
          placeholder="Scene Title..."
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[72px] text-sm bg-gray-50/50 border-gray-100 resize-none focus:bg-white transition-colors p-3 rounded-lg border-none focus-visible:ring-1 focus-visible:ring-gray-200"
          placeholder="Brief description of the context..."
        />
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm"
          onClick={() => onUpdate("description", description)}
        >
          Confirm Update
        </Button>
      </div>
    </section>
  )
}
```

#### 2.2 Extract Asset Reference Map
**File**: `src/components/scene-settings/AssetReferenceMap.tsx`
```typescript
export function AssetReferenceMap({ assets, onSelectAsset }: AssetReferenceMapProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between h-10">
        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
          <Users className="w-3.5 h-3.5" /> Asset Reference Map
        </Label>
      </div>

      <div className="border rounded-xl divide-y divide-gray-100 bg-gray-50/20 max-h-[420px] overflow-y-auto">
        {assets.map((asset) => (
          <div key={asset.id} className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-white transition-colors relative z-0 hover:z-20">
            <div className="col-span-1 text-[10px] font-mono text-gray-300">#{asset.id}</div>
            <div className="col-span-3 text-[11px] font-bold text-gray-600 truncate">{asset.name}</div>
            <div className="col-span-8 flex gap-2 overflow-visible py-1">
              {asset?.images?.map((img) => (
                <div key={img.id} className="relative">
                  <div
                    className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white bg-white shadow-sm transition-all duration-300 hover:scale-[3.5] hover:z-[50] hover:shadow-2xl active:scale-95 cursor-zoom-in relative"
                    onClick={() => onSelectAsset?.(asset.id, img.id)}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-400 italic">No assets assigned</div>
        )}
      </div>
    </section>
  )
}
```

#### 2.3 Extract Visual Reference Gallery
**File**: `src/components/scene-settings/VisualReferenceGallery.tsx`
```typescript
export function VisualReferenceGallery({
  imageUrls,
  previewIndex,
  setPreviewIndex,
  onZoom
}: VisualReferenceGalleryProps) {
  const activeIdx = previewIndex === -1 ? imageUrls.length - 1 : previewIndex
  const displayUrl = imageUrls[activeIdx]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between h-10">
        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
          <ImageIcon className="w-3.5 h-3.5" /> Base Reference
        </Label>
      </div>

      <div className="flex gap-4 items-start">
        {/* History Thumbnails */}
        {imageUrls.length > 1 && (
          <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar max-h-[320px] w-14 flex-shrink-0 pt-1">
            {imageUrls.map((url, idx) => {
              const isActive = activeIdx === idx
              return (
                <div
                  key={idx}
                  className={`relative flex-shrink-0 w-full aspect-[2/1] rounded-sm border-2 transition-all cursor-pointer ${isActive ? 'border-purple-600 scale-105 shadow-sm z-10' : 'border-transparent hover:border-purple-100 opacity-40 hover:opacity-100'}`}
                  onClick={() => setPreviewIndex(idx)}
                >
                  <img src={url} alt={`v${idx + 1}`} className="h-full object-cover rounded-[1px]" />
                  {isActive && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-purple-600 rounded-full" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Main Visual Frame */}
        <div className="flex-1 min-w-0 max-w-[80%]">
          {imageUrls.length === 0 ? (
            <EmptyGallery onGenerateImage={null} />
          ) : (
            <div
              className="w-full aspect-[2/1] max-h-[320px] rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-purple-900/5 cursor-zoom-in group/mainimg relative"
              onClick={() => onZoom?.(displayUrl)}
            >
              <img src={displayUrl} alt="Active reference" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/mainimg:opacity-100 transition-all flex justify-between items-end transform translate-y-2 group-hover/mainimg:translate-y-0">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-white/20 backdrop-blur-md rounded border border-white/20 text-[9px] text-white font-mono leading-none">←</kbd>
                  <kbd className="px-2 py-1 bg-white/20 backdrop-blur-md rounded border border-white/20 text-[9px] text-white font-mono leading-none">→</kbd>
                </div>
                <span className="text-[10px] text-white font-bold bg-purple-600/80 px-3 py-1 rounded-full backdrop-blur-md border border-purple-400/30">v{activeIdx + 1} / {imageUrls.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

#### 2.4 Extract Scene Prompt Section
**File**: `src/components/scene-settings/ScenePromptSection.tsx`
```typescript
export function ScenePromptSection({
  prompt,
  setPrompt,
  isGeneratingImage,
  onGenerate
}: ScenePromptSectionProps) {
  return (
    <section className="pt-16 border-t border-gray-100 space-y-5">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
        <Label className="text-[11px] font-heavy text-gray-400 uppercase tracking-widest">Global Scene Prompt</Label>
      </div>

      <div className="relative flex flex-col group/prompt">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full min-h-[180px] pb-24 resize-none text-[14px] bg-gray-50/30 focus:bg-white transition-all font-mono leading-relaxed p-8 rounded-[3rem] border-2 border-transparent focus:border-purple-100 shadow-inner placeholder:text-gray-200"
          placeholder="Atmosphere, cinematic lighting, framing, emotional tone..."
        />
        <div className="absolute bottom-6 right-6 flex items-center gap-5">
          {isGeneratingImage && (
            <div className="flex items-center gap-2.5 text-[11px] font-bold text-purple-500 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Masterpiece...
            </div>
          )}
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-[1.5rem] shadow-2xl shadow-purple-600/20 px-10 font-bold transition-all hover:scale-105 active:scale-95 flex gap-3 h-14 border-b-4 border-purple-800"
            onClick={onGenerate}
            disabled={isGeneratingImage || !prompt}
          >
            {isGeneratingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
            <span className="text-lg tracking-tight">Generate Scene Image</span>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

#### 2.5 Extract Scene Video Panel
**File**: `src/components/scene-settings/SceneVideoPanel.tsx`
```typescript
export function SceneVideoPanel({ scene }: SceneVideoPanelProps) {
  return (
    <section className="pt-6 border-t border-gray-50 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
            <Play className="w-3 h-3 text-green-600 fill-current" />
          </div>
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Scene Layout Preview</Label>
        </div>
        <div className="aspect-video rounded-3xl overflow-hidden bg-black border-4 border-gray-900 shadow-2xl relative shadow-gray-200">
          <VideoDisplayPanel scene={scene as any} />
          {!scene.video_url && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <span className="text-xs font-bold text-white/40 tracking-[0.2em] px-5 py-2 border border-white/10 rounded-full uppercase">Pre-vis Unavailable</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

#### 2.6 Extract Dialogs
**File**: `src/components/scene-settings/ImageViewerDialog.tsx`
```typescript
export function ImageViewerDialog({ open, imageUrl, onClose }: ImageViewerDialogProps) {
  if (!open || !imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <div className="relative w-full h-full flex items-center justify-center p-4" onClick={() => onClose?.()}>
          <img
            src={imageUrl}
            alt="Zoomed View"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-md animate-in zoom-in-95 duration-300"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Phase 3: Create Main Reusable Component

**File**: `src/components/scene-settings/SceneSettings.tsx`
```typescript
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
import { useSearchParams } from "next/navigation"

export function SceneSettings({ scene, projectDetail, onUpdate }: SceneSettingsProps) {
  // Custom hooks for reusable logic
  const { title, setTitle, description, setDescription, prompt, setPrompt, handleUpdate } = useSceneState(scene)
  const { assets } = useAssetList(scene.project_id, scene.stage_id)
  const { previewIndex, setPreviewIndex } = useGalleryNavigation(scene.image_urls || [], -1)

  // Local state for dialogs
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  const [charToPickImageFor, setCharToPickImageFor] = useState<Asset | null>(null)

  // Generate scene image
  const handleGenerateSceneImage = async () => {
    if (!scene.id || !scene.project_id || !scene.stage_id) return

    setIsGeneratingImage(true)
    try {
      const res = await sceneApi.generateSceneImage(
        scene.id,
        scene.project_id,
        scene.stage_id,
        prompt
      )
      const newUrls: string[] = res.image_url ? Object.values(res.image_url) as string[] : []
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
    <div className="h-full flex flex-col space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
      {/* Scene Meta Section */}
      <SceneMetaSection
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        onUpdate={handleSceneUpdate}
      />

      {/* Assets & Base Reference */}
      <div className="grid grid-cols-[4fr_6fr] gap-8 min-h-[300px] mb-12">
        <AssetReferenceMap assets={assets} />
        <VisualReferenceGallery
          imageUrls={scene.image_urls || []}
          previewIndex={previewIndex}
          setPreviewIndex={setPreviewIndex}
          onZoom={handleZoomImage}
        />
      </div>

      {/* Scene Prompt Section */}
      <ScenePromptSection
        prompt={prompt}
        setPrompt={setPrompt}
        isGeneratingImage={isGeneratingImage}
        onGenerate={handleGenerateSceneImage}
      />

      {/* Scene Video Panel */}
      <SceneVideoPanel scene={scene} />

      {/* Dialogs */}
      <ImageViewerDialog
        open={!!zoomImageUrl}
        imageUrl={zoomImageUrl || ''}
        onClose={() => setZoomImageUrl(null)}
      />
    </div>
  )
}
```

---

### Phase 4: Update Component Location & Export

**File**: `src/components/scene-settings/index.ts`
```typescript
// Reusable scene settings component
export { SceneSettings } from './SceneSettings'
export { SceneSettingsProps } from './types'

// Export subcomponents for advanced customization
export { SceneMetaSection } from './SceneMetaSection'
export { AssetReferenceMap } from './AssetReferenceMap'
export { VisualReferenceGallery } from './VisualReferenceGallery'
export { ScenePromptSection } from './ScenePromptSection'
export { SceneVideoPanel } from './SceneVideoPanel'
export { ImageViewerDialog } from './ImageViewerDialog'
```

**File**: `src/app/ai/projects/scenes/components/scene-settings.tsx`
```typescript
// Legacy path - will be deprecated after migration
export { SceneSettings } from '@/components/scene-settings'
```

---

### Phase 5: Create Documentation

**File**: `src/components/scene-settings/README.md`
```markdown
# SceneSettings Component

A reusable component for displaying and editing scene settings with:
- Scene metadata (title, description)
- Asset reference map
- Visual reference gallery with keyboard navigation
- Scene prompt generation
- Scene pre-vis video display

## Usage

### Basic Usage
```tsx
import { SceneSettings } from '@/components/scene-settings'

<SceneSettings
  scene={selectedScene}
  projectDetail={projectDetail}
  onUpdate={(key, value) => handleSceneUpdate(key, value)}
/>
```

### Advanced Usage (Customize Subcomponents)
```tsx
import {
  SceneSettings,
  SceneMetaSection,
  VisualReferenceGallery
} from '@/components/scene-settings'

<SceneSettings>
  <SceneMetaSection customProps={value} />
  <VisualReferenceGallery customProps={value} />
</SceneSettings>
```

## Props

### SceneSettingsProps
- `scene: Scene` - Scene data object
- `projectDetail: ProjectDetail | null` - Project metadata
- `onUpdate: (key: string, value: any) => void` - Callback for updates

## Features

- ✅ Keyboard navigation for image gallery (← →)
- ✅ Zoom images in dialog
- ✅ Generate scene images from prompts
- ✅ Asset reference map with clickable images
- ✅ Visual reference gallery with history thumbnails
- ✅ Scene pre-vis video display

## Dependencies

- React 18+
- Tailwind CSS
- Radix UI components
- lucide-react icons
- Custom hooks (useSceneState, useAssetList, useGalleryNavigation)
```

---

## Implementation Steps

### Step 1: Create Shared Types
- [ ] Create `src/types/scene-settings.ts`
- [ ] Move SceneSettingsProps, Asset, ImageInfo types here
- [ ] Export from shared location

### Step 2: Create API Utility
- [ ] Create `src/lib/api/scene-api.ts`
- [ ] Implement sceneApi methods
- [ ] Add error handling

### Step 3: Create Custom Hooks
- [ ] Create `src/hooks/useSceneState.ts`
- [ ] Create `src/hooks/useAssetList.ts`
- [ ] Create `src/hooks/useGalleryNavigation.ts`
- [ ] Add TypeScript types

### Step 4: Extract Subcomponents
- [ ] Create `src/components/scene-settings/SceneMetaSection.tsx`
- [ ] Create `src/components/scene-settings/AssetReferenceMap.tsx`
- [ ] Create `src/components/scene-settings/VisualReferenceGallery.tsx`
- [ ] Create `src/components/scene-settings/ScenePromptSection.tsx`
- [ ] Create `src/components/scene-settings/SceneVideoPanel.tsx`
- [ ] Create `src/components/scene-settings/ImageViewerDialog.tsx`

### Step 5: Create Main Component
- [ ] Create `src/components/scene-settings/SceneSettings.tsx`
- [ ] Integrate all subcomponents
- [ ] Use custom hooks
- [ ] Replace native alert with toast
- [ ] Add loading states

### Step 6: Update Exports
- [ ] Create `src/components/scene-settings/index.ts`
- [ ] Update legacy path to use new location
- [ ] Ensure backward compatibility

### Step 7: Create Documentation
- [ ] Create README.md with usage examples
- [ ] Add JSDoc comments
- [ ] Document props and features

### Step 8: Testing
- [ ] Test basic functionality in scenes page
- [ ] Test keyboard navigation
- [ ] Test image generation
- [ ] Test asset loading
- [ ] Test dialog interactions

### Step 9: Migration (Future)
- [ ] Migrate storyboard-settings to use same structure
- [ ] Consider using SceneSettings in other pages
- [ ] Deprecate legacy path (after confirming all uses migrated)

---

## Benefits

1. **Reusability**: Can now be used in any page with minimal changes
2. **Maintainability**: Modular structure makes it easier to update
3. **Testability**: Subcomponents can be tested independently
4. **Customization**: Users can override or compose subcomponents
5. **Consistency**: Same component structure across the app
6. **Documentation**: Clear documentation and usage examples

---

## Migration Path for Existing Code

### For scenes/page.tsx
```typescript
// Old
import { SceneSettings } from "./components/scene-settings"

// New
import { SceneSettings } from "@/components/scene-settings"
```

### No other changes needed - props interface is identical
---

## Notes

- The legacy path `src/app/ai/projects/scenes/components/scene-settings.tsx` will continue to work by re-exporting the new component
- All existing functionality is preserved
- Error handling is improved with toast notifications
- Loading states are added for better UX
- TypeScript types are shared across components
