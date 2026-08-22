"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageIcon, Loader2 } from "lucide-react"
import { ScenePromptSectionProps } from "@/app/ai/projects/types/scene-settings"

/**
 * Scene Prompt Section component for generating scene images from prompts
 * Compact version
 */
export function ScenePromptSection({
  prompt,
  setPrompt,
  isGeneratingImage,
  onGenerate
}: ScenePromptSectionProps) {
  return (
    <section className="space-y-2 pt-6 border-t border-gray-100">
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
        <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Scene Prompt</Label>
      </div>

      <div className="relative flex flex-col">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full min-h-[80px] pb-16 resize-none text-xs bg-gray-50/50 focus:bg-white transition-all font-mono leading-relaxed p-3 rounded-md border border-transparent focus:border-purple-100 placeholder:text-gray-300"
          placeholder="Atmosphere, lighting, framing..."
        />
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-3">
          {isGeneratingImage && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-500 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </div>
          )}
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm text-[10px] py-1.5 px-3 flex gap-2"
            onClick={onGenerate}
            disabled={isGeneratingImage || !prompt}
          >
            {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            <span>Generate</span>
          </Button>
        </div>
      </div>
    </section>
  )
}
