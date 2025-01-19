export interface ImageInfo{
  id: number,
  url: string;
  is_selected: boolean;

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
}

// export interface CharacterPrompt {
//   id: number; 

//   character_id: number; 
