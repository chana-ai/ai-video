import { useState } from 'react'
import { Check } from 'lucide-react'

interface ImageControlProps {
  images: string[];
  isLoading: boolean;
  onSelect: (index: number) => void;
  selectedIndex: number | null;
}

export function ImageControl({ images, isLoading, onSelect, selectedIndex }: ImageControlProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => !isLoading && onSelect(index)}
        >
          <div className={`w-full h-full transition-transform duration-200 ${
            hoveredIndex === index ? 'scale-150' : 'scale-100'
          }`}>
            {isLoading ? (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : images[index] ? (
              <img
                src={images[index] || "/placeholder.svg"}
                alt={`Generated image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                Image {index + 1}
              </div>
            )}
          </div>
          {selectedIndex === index && !isLoading && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Check className="w-4 w-4 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

