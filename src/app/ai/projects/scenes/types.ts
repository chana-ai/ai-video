import internal from "stream"

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
  // model: string
  camera: CameraMovement
  duration: string
  motion: string
}

export interface Scene {
  id: string
  title: string
  description: string
  prompt: string
  update_time: string
  status: SceneStatus
  imageUrl?: string
  videoUrl?: string
  
  project_id: number
  stage_id: number

  seq_id: number
  pre_seq_id: number
  next_seq_id: number

  videoSettings?: VideoSettings
  isModified?: boolean = false
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


export interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File) => void 
  existingImage: string
}