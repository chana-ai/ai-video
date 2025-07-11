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
  
export interface ProjectMetaInfo {
  name?: string;
  audience?: string;
  theme?: string;
  style?: string;
  purpose?: string;
  aspect?: string;
  narration?: boolean;
}