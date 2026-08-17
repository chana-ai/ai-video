/**
 * SceneSettings Component - Reusable Scene Settings Component
 *
 * A comprehensive component for displaying and editing scene settings with:
 * - Scene metadata (title, description)
 * - Asset reference map
 * - Visual reference gallery with keyboard navigation
 * - Scene prompt generation
 * - Scene pre-vis video display
 */

// Main component
export { SceneSettings } from './SceneSettings'
export type { SceneSettingsProps } from '@/types/scene-settings'

// Subcomponents for advanced customization
export { SceneMetaSection } from './SceneMetaSection'
export type { SceneMetaSectionProps } from '@/types/scene-settings'

export { AssetReferenceMap } from './AssetReferenceMap'
export type { AssetReferenceMapProps } from '@/types/scene-settings'

export { VisualReferenceGallery } from './VisualReferenceGallery'
export type { VisualReferenceGalleryProps } from '@/types/scene-settings'

export { ScenePromptSection } from './ScenePromptSection'
export type { ScenePromptSectionProps } from '@/types/scene-settings'

export { SceneVideoPanel } from './SceneVideoPanel'
export type { SceneVideoPanelProps } from '@/types/scene-settings'

export { ImageViewerDialog } from './ImageViewerDialog'
export type { ImageViewerDialogProps } from '@/types/scene-settings'
