'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface GeneratedImage {
  url: string;
  isSelected: boolean;
}

interface ImageGridProps {
  images: GeneratedImage[];
  onSelect: (index: number) => void;
  isLoading: boolean;
}

export function ImageGrid({ images, onSelect, isLoading }: ImageGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (isLoading || !images || images.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div 
            key={index}
            className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => onSelect(index)}
        >
          <img
            src={image.url}
            alt={`Generated image ${index + 1}`}
            className={`w-full h-full object-cover transition-transform duration-200 ${
              hoveredIndex === index ? 'scale-110' : 'scale-100'
            }`}
          />
          {image.isSelected && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

