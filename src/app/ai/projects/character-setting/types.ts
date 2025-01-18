export interface Character {
    id: number;
    name: string;
    project_id: number;
    stage_id: number;
    description: string;
    prompt: string;
    prompt_flag: boolean;
    create_time: string;
    //image_urls: string[];
    version: number;
}

// export interface CharacterPrompt {
//   id: number; 

//   character_id: number; 
