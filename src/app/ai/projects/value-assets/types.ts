export interface ImageInfo {
    id: number;
    url: string;
    oss_path?: string;
    is_selected: boolean;
}

// export type AssetType = 'character' | 'resource';

export interface VoiceSetting {
    gender: string;
    emotion: string;
    vendor: string;
    is_master: boolean;
    mode?: string; // tts | clone
    tts?: {
        url: string;
        desc: string;
        voice: string;
        voice_name: string;
    };
    clone?: {
        url: string;
        desc: string;
        voice: string;
        voice_name: string;
    };
}


export interface Batch {
    id: number;
    timestamp: number;
    images: ImageInfo[];
    isStarred?: boolean;
    version?: number;
}

export interface SelectedAsset extends Asset {
    // type: AssetType;
    // asset: Asset | ResourceAsset; // Full asset object
    // name?: string; // For display in AssetDetail
    // description?: string; // For display in AssetDetail and prompt editing
    // prompt?: string; // For prompt editing
    voice_setting?: VoiceSetting; // Voice setting for current mode
    history?: Batch[]; // Local history for the session

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
    images: ImageInfo[] | null;
    version: number;
    gender: string;
    timbre: string;
    type: number;
    config?: string | Record<string, any> & {
        voice_setting?: VoiceSetting;
    };
}

export interface SceneImage {
    id: number;
    name: string;
    description: string;
    images: ImageInfo[];
}
