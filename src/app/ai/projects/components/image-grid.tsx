import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Check } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ImageInfo } from '../character-setting/types'


interface ImageGridProps {
  images: ImageInfo[];
  isLoading: boolean;
  onSelect: (index: number) => void;
}

export function ImageGrid({ images, isLoading, onSelect }: ImageGridProps) {

  const handleImageClick = (index: number, id: number) => {
    if (images && images.length > 0) {
      console.log("click ", index, " images")
      onSelect(id)
    }
  }
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images?.length > 0 ? (
          // Actual images
          images.map((image, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
              onClick={() => handleImageClick(index, image.id)}
            >
              <div className={cn(
                "aspect-square rounded-lg overflow-hidden",
                "transition-transform duration-200 ease-in-out",
                "group-hover:scale-150 group-hover:z-50",
                "relative"
              )}>
                <img
                  src={image.url}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 bg-white rounded-full animate-bounce"
                          style={{
                            animationDelay: `${i * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {image.is_selected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-20">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        ) : (
          // Empty placeholders
          Array(4).fill(0).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 rounded-lg relative"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className="w-3 h-3 bg-white rounded-full animate-bounce"
                        style={{
                          animationDelay: `${j * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}