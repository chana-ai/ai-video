export interface ImageInfo {
    id: number;
    url: string;
    is_selected: boolean;
}

export interface VoiceConfig {
    gender: '男' | '女' | '中性';
    voiceCharacteristic: '温柔' | '沙哑' | '清脆' | '浑厚' | '甜美' | '稚嫩';
    voiceDescription: string;
    ttsEngine: string;
    voiceModel: string;
}

export interface Character {
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
}

export interface ResourceAsset {
    id: number;
    name: string;
    description: string;
    images: ImageInfo[];
}
