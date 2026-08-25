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

  voice_url?: string
  image_url?: string
  image_urls?: string[]
  video_url?: string

  /** Associated assets */
  character_ids?: number[]
  /** Map of character ID to selected image ID */
  char_image_map?: Record<number, number>
  scene_image_id?: number
  resource_id?: number

  /** Config returned from /api/v2/scene/detail */
  config?: Record<string, any> & {
    video_task_id?: string
  }

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
  is_master?: boolean
  vendor?: string
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
  narration?: number
  // onSave: (settings: VoiceSettings) => void
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



export interface StoryDetail {
  scene_id: number
  doc_id?: string
  description?: string
  config?: {
    assets?: any[]
    voice_settings?: {
      voice?: string
      speech_rate?: number
      mode?: string
      emotion?: string
      vendor?: string
      background?: string | null
      gender?: string
    }
    image_settings?: Record<string, any>
    video_settings?: {
      duration?: number
      motion?: number
      camera?: string
      model?: string
    }
    dialogue?: any
    narration?: number | null
  }
  resource?: {
    scene_image_urls?: Record<string, any>
    storyboard_image_url?: string
    voice_url?: string
    video_url?: string
    subtitle_url?: string
  }
  image_prompt?: string
  video_prompt?: string
  image_prompt_history?: any[]
  video_prompt_history?: any[]
  extra_data?: Record<string, any>
  version?: string | null
}



export interface AssetResponse {
  id: number;
  name: string;
  url: string;
  version?: number;
}

export interface VoiceSetting {
  mode?: 'tts' | 'clone';
  tts?: {
    voice?: string;
  };
  clone?: {
    voice?: string;
  };
  speech_rate?: number;
  emotion?: string;
}

export interface Character {
  id: number;
  name: string;
  images: AssetResponse[];
  config?: {
    voice_setting?: VoiceSetting;
  };
}