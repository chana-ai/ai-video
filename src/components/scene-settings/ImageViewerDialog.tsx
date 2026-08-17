"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ImageViewerDialogProps } from "@/types/scene-settings"

/**
 * Image Viewer Dialog component for zooming in on images
 */
export function ImageViewerDialog({ open, imageUrl, onClose }: ImageViewerDialogProps) {
  if (!open || !imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={(o: any) => !o && onClose?.()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <div className="relative w-full h-full flex items-center justify-center p-4" onClick={() => onClose?.()}>
          <img
            src={imageUrl}
            alt="Zoomed View"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-md animate-in zoom-in-95 duration-300"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
