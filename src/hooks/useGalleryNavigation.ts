import { useState, useEffect } from "react"

/**
 * Custom hook for managing gallery navigation with keyboard support
 */
export function useGalleryNavigation(imageUrls: string[], initialIndex: number = -1) {
  const [previewIndex, setPreviewIndex] = useState(initialIndex)

  // Auto-select last image if no selection
  useEffect(() => {
    if (previewIndex === -1 && imageUrls.length > 0) {
      setPreviewIndex(imageUrls.length - 1)
    }
  }, [imageUrls, previewIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imageUrls.length <= 1) return

      const currentIndex = previewIndex === -1 ? imageUrls.length - 1 : previewIndex

      if (e.key === "ArrowLeft") {
        setPreviewIndex(Math.max(0, currentIndex - 1))
      } else if (e.key === "ArrowRight") {
        setPreviewIndex(Math.min(imageUrls.length - 1, currentIndex + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewIndex, imageUrls.length])

  return { previewIndex, setPreviewIndex }
}
