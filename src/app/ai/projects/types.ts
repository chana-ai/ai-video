export interface ProjectFormData {
    name: string;
    aspectRatio: string;
    theme: string;
    style: string;
    audience: string;
    narration: boolean;
    purpose: string;
  }
  
  export interface ScriptGenerationData {
    type: 'subject' | 'script';
    content: string;
    characters: string;
    scenes: string;
  }
  
  