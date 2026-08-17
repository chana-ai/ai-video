// Shared types for scene settings component
import { Scene, ProjectDetail } from "../app/ai/projects/scenes/types"
import { Asset, ImageInfo } from "../app/ai/projects/value-assets/types"

export interface SceneSettingsProps {
  scene: Scene
  projectDetail: ProjectDetail | null
  onUpdate: (key: string, value: any) => void
}

export interface AssetReferenceMapProps {
  assets: Asset[]
  onSelectAsset?: (assetId: number, imageId: number) => void
}

export interface VisualReferenceGalleryProps {
  imageUrls: string[]
  previewIndex: number
  setPreviewIndex: (index: number) => void
  onZoom?: (url: string) => void
}

export interface SceneMetaSectionProps {
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (description: string) => void
  onUpdate: (key: string, value: any) => void
}

export interface ScenePromptSectionProps {
  prompt: string
  setPrompt: (prompt: string) => void
  isGeneratingImage: boolean
  onGenerate: () => void
}

export interface SceneVideoPanelProps {
  scene: Scene
}

export interface ImageViewerDialogProps {
  open: boolean
  imageUrl: string
  onClose?: () => void
}
