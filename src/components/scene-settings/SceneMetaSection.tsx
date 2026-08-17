"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SceneMetaSectionProps } from "@/types/scene-settings"

/**
 * Scene Meta Section component for displaying and editing scene title and description
 * Compact version
 */
export function SceneMetaSection({
  title,
  setTitle,
  description,
  setDescription,
  onUpdate
}: SceneMetaSectionProps) {
  return (
    <section className="space-y-2">
      <div className="space-y-1">
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scene Name</Label>
        <Input
          value={title}
          className="text-sm font-bold border-none px-0 focus-visible:ring-0 placeholder:text-gray-200 py-2"
          placeholder="Scene Title..."
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[56px] text-xs bg-gray-50/50 border-gray-100 resize-none focus:bg-white transition-colors py-2 px-3 rounded border-none focus-visible:ring-1 focus-visible:ring-gray-200 w-full"
          placeholder="Brief description..."
        />
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded text-xs py-1 px-3 shadow-sm"
          onClick={() => onUpdate("description", description)}
        >
          Confirm
        </Button>
      </div>
    </section>
  )
}
