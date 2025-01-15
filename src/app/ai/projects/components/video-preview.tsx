import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface VideoPreviewProps {
  videos: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  isLoading?: boolean
}

export function VideoPreview({ videos, currentIndex, onIndexChange, isLoading }: VideoPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-md">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-md">
        <span className="text-gray-500">No videos generated yet</span>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-48 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        src={videos[currentIndex]}
        className="w-full h-full object-cover rounded-md"
        controls
      />
      {isHovered && videos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onIndexChange((currentIndex - 1 + videos.length) % videos.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onIndexChange((currentIndex + 1) % videos.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}

