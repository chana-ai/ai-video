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
  model: string
  camera: CameraMovement
  duration: string
  motion: string
}

export interface Scene {
  id: string
  title: string
  description: string
  prompt: string
  video_prompt: string
  video_prompt_cn: string
  update_time: string
  status: SceneStatus
  task_id?: number
  task_status?: string
  
  project_id: number
  stage_id: number
  seq_id: number
  pre_seq_id: number
  next_seq_id: number

  video_setting?: VideoSettings
  voice_setting?: VoiceSettings,
  voice_url?:string
  image_url?: string
  video_url?: string

  

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
  onUpdate: (key: string, value: any) => void
  onVideoPreviewToggle: () => void
  isVideoPreviewOpen: boolean
  isVideoTaskInProgress: boolean
}

export interface VideoSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings?: VideoSettings
  onSave: (settings: VideoSettings) => void
}

export interface VideoDisplayProps {
  videoUrl?: string
  isGenerating?: boolean,
  isVideoTaskInProgress?: boolean
}


export interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File) => void 
  existingImage: string
}


export interface VoiceSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings?: VoiceSettings,
  voice_menu: { [key: string]: string }
  project_id: string
  stage_id: string
  scene_id?: string
  subtitle?: string
  voice_url?: string
  onSave: (settings: VoiceSettings) => void
  onGenerate: (voice_path: string) => void
}

export interface VoiceSettings {
  voice_name: string
  background: string
  voice_pitch: number
  voice_speed: number
  voice_volume: number
}

export interface Task {
  scene_id: number
  task_id: number
  status: string
  video_url: string
}
