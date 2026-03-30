export interface ImageInfo {
    id: number;
    url: string;
    oss_path?: string;
    is_selected: boolean;
}

export type AssetType = 'character' | 'resource';

export interface Batch {
    id: number;
    timestamp: number;
    images: ImageInfo[];
    isStarred?: boolean;
    version?: number;
}

export interface SelectedAsset {
    type: AssetType;
    id: number;
    name: string;
    description: string;
    prompt: string;
    images: ImageInfo[];
    voiceConfig?: VoiceConfig;
    history?: Batch[]; // Local history for the session
}

export interface VoiceConfig {
    voice: string;
    voice_name: string;
    desc: string;
    gender: string;
    ttsEngine: string;
    emotion?: string;
    extraDesc?: string;
}

export interface Asset {
    id: number;
    name: string;
    project_id: number;
    stage_id: number;
    description: string;
    prompt: string;
    prompt_flag: boolean;
    create_time: string;
    selected_image_id: number;
    images: ImageInfo[];
    version: number;
    voiceConfig?: VoiceConfig;
    config?: string | Record<string, any>;
}

export interface ResourceAsset {
    id: number;
    name: string;
    description: string;
    images: ImageInfo[];
}

export interface SceneImage {
    id: number;
    name: string;
    description: string;
    images: ImageInfo[];
}
