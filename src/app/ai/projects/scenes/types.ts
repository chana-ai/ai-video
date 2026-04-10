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

/**
 * A single entry in the prompt generation history.
 */
export interface PromptHistoryItem {
  timestamp: number
  prompt: string
  error_message: string | null
}

/**
 * A single line of dialog (character name + their content)
 */
export interface DialogLine {
  character: string
  content: string
}

/**
 * A single scene or storyboard node returned by the backend.
 *
 * - `storyboard === false` → this is a top-level scene
 * - `storyboard === true`  → this is a storyboard; `parent_id` points to its parent scene's id
 *
 * The API returns a flat list. After fetching, items are grouped by `parent_id`
 * and the tree is built client-side via the `children` field.
 */
export interface Scene {
  /** Numeric scene / storyboard ID from the backend */
  id: number
  title: string
  seq_id: number
  pre_seq_id: number
  next_seq_id: number
  project_id: number
  stage_id: number

  /** MongoDB document ID for the scene document */
  doc_id?: string

  /** Raw backend status string, e.g. "INIT" */
  status: string

  /** Individual generation status flags */
  image_status: boolean
  clip_status: boolean
  voice_status: boolean

  /**
   * When true this node is a storyboard (child of a scene).
   * When false this node is a top-level scene.
   */
  storyboard: boolean

  /** 
   * For storyboard nodes: the numeric ID of the parent scene.
   * Null for top-level scenes.
   */
  parent_id: number | null

  del: boolean
  create_time: string
  update_time: string

  // ── Fields populated from the scene document (doc_id) ─────────────────────
  description?: string
  prompt?: string
  video_prompt?: string
  video_prompt_cn?: string

  video_setting?: VideoSettings
  voice_setting?: VoiceSettings
  voice_url?: string
  image_url?: string
  image_urls?: string[]
  video_url?: string

  /** Speech/dialog content.
   *  - narration=1 or 2 → plain string
   *  - narration=3     → array of DialogLine
   */
  dialog?: string | DialogLine[]

  /** Associated assets */
  character_ids?: number[]
  /** Map of character ID to selected image ID */
  char_image_map?: Record<number, number>
  scene_image_id?: number
  resource_id?: number

  /** Config returned from /api/v2/scene/detail */
  config?: Record<string, any>

  /** Extra arbitrary data returned from /api/v2/scene/details */
  extra_data?: Record<string, any>

  /** Document version returned from /api/v2/scene/details */
  version?: string

  /** Prompt generation history */
  image_prompt_history?: PromptHistoryItem[]
  video_prompt_history?: PromptHistoryItem[]

  // ── UI-only fields ─────────────────────────────────────────────────────────

  /** Front-end dirty flag */
  isModified?: boolean

  /**
   * Storyboard children IDs, grouped client-side from the flat API list.
   * Only present on top-level scenes (storyboard === false).
   */
  children?: number[]
}

export type NodeType = 'scene' | 'storyboard'

/** A flat list item in the sidebar is either a top-level scene or a storyboard,
 *  both represented by the unified `Scene` type. */
export type SceneNode =
  | { nodeType: 'scene'; data: Scene }
  | { nodeType: 'storyboard'; data: Scene }

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
  onSelect: (id: number) => void
  onSave: (id: number) => void
  onAddScene: (scene: Scene) => void
  onAddStoryboard: (scene: Scene) => void
  onGenerateStoryboards: (scene: Scene) => void
  onDelete: (scene: Scene) => void
}

export interface StoryboardCardProps {
  storyboard: Scene
  isSelected: boolean
  onSelect: (id: number) => void
  onAddStoryboard: (storyboard: Scene) => void
  onDelete: (storyboard: Scene) => void
}

export interface SceneSettingsProps {
  scene: Scene
  projectDetail: ProjectDetail | null
  onUpdate: (key: string, value: any) => void
}

export interface StoryboardSettingsProps {
  storyboard: Scene
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
