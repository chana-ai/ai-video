"use client"

import React, { useState, useEffect } from "react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Image {
    id: number
    url: string
}

interface ImageControlProps {
    images: Image[]
    selectedImageId: number
    onImageSelect: (imageId: number) => void
    focusedIndex?: number
    onPrevious?: (e: React.MouseEvent | React.KeyboardEvent) => void
    onNext?: (e: React.MouseEvent | React.KeyboardEvent) => void
    showArrows?: boolean
    className?: string
}

export function ImageControl({
    images,
    selectedImageId,
    onImageSelect,
    focusedIndex = 0,
    showArrows = true
}: ImageControlProps) {
    const [zoomImageIndex, setZoomImageIndex] = useState<number>(0)
    const [isZoomed, setIsZoomed] = useState<boolean>(false)

    // Sync focused index with parent
    useEffect(() => {
        setZoomImageIndex(focusedIndex)
        setIsZoomed(false)
    }, [focusedIndex])

    const handleImageClick = (index: number) => {
        setZoomImageIndex(index)
        // If clicking the same image and it's zoomed in, zoom out; otherwise zoom in
        setIsZoomed(!isZoomed)
    }

    const handlePreviousImage = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation()
        if (images.length === 0) return
        const newIndex = zoomImageIndex === 0 ? images.length - 1 : zoomImageIndex - 1
        setZoomImageIndex(newIndex)
        setZoomImageUrl(images[newIndex]?.url || null)
    }

    const handleNextImage = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation()
        if (images.length === 0) return
        const newIndex = zoomImageIndex === images.length - 1 ? 0 : zoomImageIndex + 1
        setZoomImageIndex(newIndex)
        setZoomImageUrl(images[newIndex]?.url || null)
    }

    return (
        <>
            {/* Main Image Display */}
            <div className="group/preview relative h-[350px] w-full rounded-xl bg-black flex items-center justify-center border border-gray-100">
                {images.length > 0 ? (
                    <>
                        {/* Zoom Container - allows image to overflow outside the box */}
                        <div className={cn(
                            "transition-all duration-700",
                            isZoomed ? "scale-[1.25]" : "hover:scale-[1.02]"
                        )}>
                            <img
                                src={images[zoomImageIndex]?.url}
                                alt={`Selected image ${zoomImageIndex + 1}`}
                                className={cn(
                                    "object-contain transition-all duration-700 cursor-zoom-in",
                                    isZoomed ? "cursor-zoom-out" : ""
                                )}
                                onClick={() => handleImageClick(zoomImageIndex)}
                            />
                        </div>

                        {/* Selection Circle */}
                        <button
                            className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 transition-all z-30 flex items-center justify-center"
                            onClick={(e) => {
                                e.stopPropagation()
                                onImageSelect(selectedImageId)
                            }}
                            style={{
                                borderColor: selectedImageId === images[zoomImageIndex]?.id ? '#22c55e' : '#9ca3af',
                                backgroundColor: selectedImageId === images[zoomImageIndex]?.id ? '#22c55e' : '#f3f4f6',
                            }}
                        >
                            {selectedImageId === images[zoomImageIndex]?.id && (
                                <Check className="w-5 h-5 text-white" />
                            )}
                        </button>

                        {/* Navigation Arrows */}
                        {showArrows && images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-0 top-0 bottom-0 w-24 -translate-x-1/2 bg-gradient-to-r from-black/30 to-transparent hover:from-black/50 hover:to-black/30 flex items-center justify-start pl-8 opacity-0 group-hover/preview:opacity-100 transition-opacity z-20"
                                    onClick={handlePreviousImage}
                                >
                                    <ChevronLeft className="w-12 h-12 text-white/90" />
                                </button>
                                <button
                                    className="absolute right-0 top-0 bottom-0 w-24 translate-x-1/2 bg-gradient-to-l from-black/30 to-transparent hover:from-black/50 hover:to-black/30 flex items-center justify-end pr-8 opacity-0 group-hover/preview:opacity-100 transition-opacity z-20"
                                    onClick={handleNextImage}
                                >
                                    <ChevronRight className="w-12 h-12 text-white/90" />
                                </button>
                            </>
                        )}

                        {/* Image Counter */}
                        {images.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-20">
                                {zoomImageIndex + 1} / {images.length}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600 gap-3">
                        <p className="text-xs font-semibold tracking-widest uppercase text-gray-700">No images available</p>
                    </div>
                )}
            </div>

            {/* Preview Section */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                    <div
                        key={img.id}
                        className={cn(
                            "relative flex-shrink-0 w-[100px] h-[100px] rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                            selectedImageId === img.id
                                ? "border-green-500 ring-2 ring-green-100"
                                : "border-transparent hover:border-gray-300"
                        )}
                        onClick={() => handleImageClick(idx)}
                    >
                        <img
                            src={img.url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {selectedImageId === img.id && (
                            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                                <div className="bg-green-500 text-white p-1 rounded-full shadow-sm">
                                    <Check className="h-3 w-3" />
                                </div>
                            </div>
                        )}
                        {/* Selection Indicator Circle */}
                        <button
                            className="absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10"
                            onClick={(e) => {
                                e.stopPropagation()
                                onImageSelect(img.id)
                            }}
                            style={{
                                borderColor: selectedImageId === img.id ? '#22c55e' : '#9ca3af',
                                backgroundColor: selectedImageId === img.id ? '#22c55e' : '#f3f4f6',
                            }}
                        >
                            {selectedImageId === img.id && (
                                <Check className="w-3 h-3 text-white" />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </>
    )
}

export function PreviewImageList({
    images,
    selectedImageId,
    onImageSelect,
    className
}: {
    images: Image[]
    selectedImageId: number
    onImageSelect: (imageId: number) => void
    className?: string
}) {
    return (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {images.map((img, idx) => (
                <div
                    key={img.id}
                    className={cn(
                        "relative flex-shrink-0 w-[100px] h-[100px] rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                        selectedImageId === img.id
                            ? "border-green-500 ring-2 ring-green-100"
                            : "border-transparent hover:border-gray-300"
                    )}
                    onClick={() => onImageSelect(img.id)}
                >
                    <img
                        src={img.url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                    />
                    {selectedImageId === img.id && (
                        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                            <div className="bg-green-500 text-white p-1 rounded-full shadow-sm">
                                <Check className="h-3 w-3" />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
