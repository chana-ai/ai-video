"use client"

import React from "react"
import { Play } from "lucide-react"
import { Label } from "@/components/ui/label"
import { SceneVideoPanelProps } from "@/app/ai/projects/types/scene-settings"
import { VideoDisplayPanel } from "@/app/ai/projects/scenes/components/video-display-panel"

/**
 * Scene Video Panel component for displaying pre-vis video
 * Compact version
 */
export function SceneVideoPanel({ scene }: SceneVideoPanelProps) {
  return (
    <section className="pt-5 border-t border-gray-100 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
          <Play className="w-2.5 h-2.5 text-green-600 fill-current" />
        </div>
        <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Scene Preview</Label>
      </div>
      <div className="aspect-video rounded-lg overflow-hidden bg-black border-2 border-gray-900 shadow-md relative">
        <VideoDisplayPanel scene={scene as any} />
        {!scene.video_url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <span className="text-[9px] font-bold text-white/50 tracking-wider px-3 py-1.5 border border-white/10 rounded-full uppercase">No Preview</span>
          </div>
        )}
      </div>
    </section>
  )
}
