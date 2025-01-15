export interface ScenePanel {
    id: string;
    title: string;
    information: string;
    imagePrompt?: string;
    images: string[];
    currentImageIndex: number;
    videos: string[];
    currentVideoIndex: number;
  }
  
  export interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onSave: (value: string) => void;
    title: string;
  }
  
  