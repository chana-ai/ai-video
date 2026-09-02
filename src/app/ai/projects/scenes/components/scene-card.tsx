"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Trash2, Clock, MonitorPlay, ChevronDown, ChevronRight, Film, Layers, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SceneCardProps, StoryboardCardProps } from "@/app/ai/projects/types"

// ─── shared helpers ────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    INIT: "bg-gray-100 text-gray-600",
    init: "bg-gray-100 text-gray-600",
    image_generating: "bg-blue-100 text-blue-600",
    video_generating: "bg-purple-100 text-purple-600",
    voice_generating: "bg-orange-100 text-orange-600",
    PROCESSING: "bg-blue-100 text-blue-600",
    complete: "bg-green-100 text-green-600",
    COMPLETE: "bg-green-100 text-green-600",
    fail: "bg-red-100 text-red-600",
    FAIL: "bg-red-100 text-red-600",
  }
  const labels: Record<string, string> = {
    INIT: "Initial",
    init: "Initial",
    image_generating: "Generating Image",
    video_generating: "Generating Video",
    voice_generating: "Generating Voice",
    PROCESSING: "Processing",
    complete: "Complete",
    COMPLETE: "Complete",
    fail: "Failed",
    FAIL: "Failed",
  }
  return (
    <Badge variant="secondary" className={styles[status] ?? "bg-gray-100 text-gray-600"}>
      {labels[status] ?? status}
    </Badge>
  )
}

// ─── AddMenu ──────────────────────────────────────────────────────────────────

interface AddMenuProps {
  onAddStoryboard: () => void
  onGenerateStoryboard: () => void
  hasChildren?: boolean
  isGenerating?: boolean
}

function AddMenu({ onAddStoryboard, onGenerateStoryboard, hasChildren = false, isGenerating = false }: AddMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="absolute right-0 top-9 z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => { setOpen(false); onAddStoryboard() }}
          >
            <Layers className="h-4 w-4 text-blue-500" />
            Add Scene
          </button>
          {!hasChildren && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => { setOpen(false); onGenerateStoryboard() }}
              disabled={isGenerating}
            >
              <Layers className="h-4 w-4 text-blue-500" />
              Generate Storyboards
              {isGenerating && (
                <Loader2 className="h-3 w-3 ml-auto animate-spin" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SceneCard ────────────────────────────────────────────────────────────────

export function SceneCard({
  scene,
  isSelected,
  isExpanded,
  storyboardCount,
  hasChildren,
  onSelect,
  onSave,
  onAddStoryboard,
  onGenerateStoryboards,
  onDelete,
  generatingStoryboards
}: SceneCardProps) {
  return (
    <div
      className={`
        p-4 rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5
        ${isSelected
          ? "bg-purple-50 border-2 border-purple-500"
          : "bg-white border border-gray-200"}
      `}
      onClick={() => onSelect(scene.id)}
    >
      {/* Header row */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Fold/unfold chevron — only shown when there are storyboards */}
          {storyboardCount > 0 && (
            <span
              className="text-gray-400 flex-shrink-0"
              title={isExpanded ? "收起分镜" : "展开分镜"}
            >
              {isExpanded
                ? <ChevronDown className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          <h3 className="font-medium truncate">{scene.title}</h3>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          {/* Video status */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${!scene.video_url ? "text-red-400" : "text-green-500"}`}
          >
            <MonitorPlay className="h-4 w-4" />
          </Button>

          {/* Add menu */}
          <AddMenu
            onAddStoryboard={() => onAddStoryboard(scene)}
            onGenerateStoryboard={() => onGenerateStoryboards(scene)}
            hasChildren={hasChildren}
            isGenerating={generatingStoryboards?.has(scene.id) ?? false}
          />

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-500"
            onClick={(e) => { e.stopPropagation(); onDelete(scene) }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {scene.update_time}
          </div>
          {storyboardCount > 0 && (
            <span className="text-xs text-blue-500 font-medium">
              {storyboardCount} 个分镜
            </span>
          )}
        </div>
        {getStatusBadge(scene.status)}
      </div>
    </div>
  )
}

// ─── StoryboardCard ──────────────────────────────────────────────────────────

export function StoryboardCard({
  storyboard,
  isSelected,
  onSelect,
  onAddStoryboard,
  onDelete,
}: StoryboardCardProps) {
  return (
    // Indent by ml-6 (1 tab equivalent) relative to the parent scene card
    <div className="ml-6 pl-3 border-l-2 border-blue-200">
      <div
        className={`
          p-3 rounded-lg cursor-pointer transition-all duration-200
          hover:shadow-md hover:-translate-y-0.5
          ${isSelected
            ? "bg-blue-50 border-2 border-blue-400"
            : "bg-white border border-blue-100"}
        `}
        onClick={() => onSelect(storyboard.id)}
      >
        {/* Header row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            <h4 className="text-sm font-medium truncate">{storyboard.title}</h4>
          </div>

          {/* Actions */}
          <div className="flex gap-0.5 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
            {/* Video status */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${!storyboard.video_url ? "text-red-400" : "text-green-500"}`}
            >
              <MonitorPlay className="h-3.5 w-3.5" />
            </Button>

            {/* Add another storyboard below */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onAddStoryboard(storyboard)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); onDelete(storyboard) }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {storyboard.update_time}
          </div>
          {getStatusBadge(storyboard.status)}
        </div>
      </div>
    </div>
  )
}