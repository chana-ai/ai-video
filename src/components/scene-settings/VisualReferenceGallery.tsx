"use client"

import React from "react"
import { ImageIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { VisualReferenceGalleryProps } from "@/types/scene-settings"

/**
 * Visual Reference Gallery component with keyboard navigation
 * Compact version
 */
export function VisualReferenceGallery({
  imageUrls,
  previewIndex,
  setPreviewIndex,
  onZoom
}: VisualReferenceGalleryProps) {
  const activeIdx = previewIndex === -1 ? imageUrls.length - 1 : previewIndex
  const displayUrl = imageUrls[activeIdx]

  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between h-8">
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3" /> Base Reference
        </Label>
      </div>

      <div className="flex gap-3 items-start">
        {/* History Thumbnails */}
        {imageUrls.length > 1 && (
          <div className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar max-h-[140px] w-12 flex-shrink-0">
            {imageUrls.slice(-5).map((url, idx) => {
              const actualIdx = previewIndex === -1 ? imageUrls.length - 1 : previewIndex
              const galleryIdx = imageUrls.length - 5 + idx
              const isActive = actualIdx === galleryIdx
              return (
                <div
                  key={galleryIdx}
                  className={`relative flex-shrink-0 w-full aspect-[2/1] rounded-sm border-2 transition-all cursor-pointer ${isActive ? 'border-purple-600 scale-105 shadow-sm z-10' : 'border-transparent hover:border-purple-100 opacity-40 hover:opacity-100'}`}
                  onClick={() => setPreviewIndex(galleryIdx)}
                >
                  <img src={url} alt={`v${galleryIdx + 1}`} className="h-full object-cover rounded-[1px]" />
                  {isActive && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-purple-600 rounded-full" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Main Visual Frame */}
        <div className="flex-1 min-w-0">
          {imageUrls.length === 0 ? (
            <div className="aspect-[2/1] rounded-lg bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
              <ImageIcon className="w-5 h-5 opacity-20" />
              No image
            </div>
          ) : (
            <div
              className="aspect-[2/1] rounded-lg overflow-hidden border-3 border-white shadow-md cursor-zoom-in group/main relative"
              onClick={() => onZoom?.(displayUrl)}
            >
              <img src={displayUrl} alt="Active reference" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/main:opacity-100 transition-all flex justify-between items-end">
                <div className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/20 backdrop-blur rounded text-[8px] text-white font-mono">←</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white/20 backdrop-blur rounded text-[8px] text-white font-mono">→</kbd>
                </div>
                <span className="text-[9px] text-white font-bold bg-purple-600/80 px-2 py-0.5 rounded-full">v{activeIdx + 1}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
