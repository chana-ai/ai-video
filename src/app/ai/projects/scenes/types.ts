export type SceneStatus = "init" | "image_generating" | "video_generating" | "voice_generating" | "complete" | "fail"

export type CameraMovement =
  | "frame"
  | "left"
  | "right"
  | "up"
  | "down"
  | "expand"
  | "minimize"
  | "rotate-ccw"
  | "rotate-cw"

export interface VideoSettings {
  model: string
  camera: CameraMovement
  duration: string
  motion: string
}

export interface Scene {
  id: string
  title: string
  description: string
  timestamp: string
  status: SceneStatus
  imageUrl?: string
  videoUrl?: string
  videoSettings?: VideoSettings
  isModified?: boolean
}

export interface SceneCardProps {
  scene: Scene
  isSelected: boolean
  onSelect: (id: string) => void
  onSave: (id: string) => void
  onAdd: (id: string) => void
  onDelete: (id: string) => void
}

export interface SceneSettingsProps {
  scene: Scene | null
  onUpdate: (scene: Scene) => void
  onVideoPreviewToggle: () => void
  isVideoPreviewOpen: boolean
}

export interface VideoSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings?: VideoSettings
  onSave: (settings: VideoSettings) => void
}

export interface VideoDisplayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoUrl?: string
  isGenerating: boolean
  onDownload: () => void
  onConfirm: () => void
}

