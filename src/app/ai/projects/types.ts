export interface ProjectFormData {
    name: string;
    aspect: string;
    theme: string;
    style: string;
    audiences: string;
    narration: boolean;
    purpose: string;
  }
  
  export interface ScriptGenerationData {
    type: 'subject' | 'script';
    content: string;
    characters: string;
    scenes: string;
  }
  
  