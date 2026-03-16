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

/** A single line of dialog (character name + their content) */
export interface DialogLine {
  character: string
  content: string
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
  voice_setting?: VoiceSettings
  voice_url?: string
  image_url?: string
  video_url?: string

  /** Speech/dialog content for the scene.
   *  - narration=1 or 2 → plain string
   *  - narration=3     → array of DialogLine
   */
  dialog?: string | DialogLine[]

  isModified?: boolean

  /** Associated assets */
  character_ids?: number[]
  /** Map of character ID to selected image ID */
  char_image_map?: Record<number, number>
  scene_image_id?: number
  resource_id?: number

  /** Storyboards that belong to this scene */
  storyboards?: Storyboard[]
}

export interface Storyboard {
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

  /** The parent scene id */
  scene_id: string

  project_id: number
  stage_id: number
  seq_id: number
  pre_seq_id: number
  next_seq_id: number

  video_setting?: VideoSettings
  voice_setting?: VoiceSettings
  voice_url?: string
  image_url?: string
  video_url?: string

  dialog?: string | DialogLine[]

  isModified?: boolean

  /** Storyboards that belong to this scene */
  storyboards?: Storyboard[]
}

export type NodeType = 'scene' | 'storyboard'

/** A flat list item in the sidebar can be either a Scene or a Storyboard */
export type SceneNode =
  | { nodeType: 'scene'; data: Scene }
  | { nodeType: 'storyboard'; data: Storyboard }

export interface VoiceSettings {
  voice_name: string
  background: string
  voice_pitch: number
  voice_speed: number
  voice_volume: number
}

export interface ProjectVoiceConfig {
  voice_name: string
  voice_speed: number
  voice_pitch: number
  voice_volume: number
  background: string | null
}

/** Full project detail returned by /api/v2/project/detail */
export interface ProjectDetail {
  id: number
  name: string
  user_id: number
  audiences: string
  /** 1 = Narration, 2 = Monologue, 3 = Dialogue */
  narration: number
  theme: string
  aspect: string
  style: string
  status: string
  config: {
    voice_setting: ProjectVoiceConfig
  }
  stage_id: number
  stage_name: string
  stage_status: string
  screen_url: string | null
  video_id: number | null
  voice_url: string | null
  subtitle_url: string | null
  purpose: string
}

export interface SceneCardProps {
  scene: Scene
  isSelected: boolean
  isExpanded: boolean
  storyboardCount: number
  onSelect: (id: string) => void
  onSave: (id: string) => void
  onAddScene: (scene: Scene) => void
  onAddStoryboard: (scene: Scene) => void
  onDelete: (scene: Scene) => void
}

export interface StoryboardCardProps {
  storyboard: Storyboard
  isSelected: boolean
  onSelect: (id: string) => void
  onAddStoryboard: (storyboard: Storyboard) => void
  onDelete: (storyboard: Storyboard) => void
}

export interface SceneSettingsProps {
  scene: Scene
  projectDetail: ProjectDetail | null
  onUpdate: (key: string, value: any) => void
}

export interface StoryboardSettingsProps {
  storyboard: Storyboard
  projectDetail: ProjectDetail | null
  onUpdate: (key: string, value: any) => void
}

export interface VideoSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings?: VideoSettings
  onSave: (settings: VideoSettings) => void
}

export interface VideoDisplayProps {
  scene: Scene | null
  onClose?: () => void
  isGeneratingVideo?: boolean
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
  settings?: VoiceSettings
  voice_menu: { [key: string]: string }
  project_id: string
  stage_id: string
  scene_id?: string
  subtitle?: string
  voice_url?: string
  onSave: (settings: VoiceSettings) => void
  onGenerate: (voice_path: string) => void
}

export interface CombinedVideo {
  version: number
  url: string
}

export interface Task {
  scene_id: number
  task_id: number
  status: string
  video_url: string
}
