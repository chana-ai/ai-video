"use client"

import React, { useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, Clock, ChevronRight } from "lucide-react"
import type { TaskStats } from "@/app/ai/projects/types"

interface CombineTasksQuickViewProps {
  taskStats: TaskStats
  isLoading: boolean
  onOpenPanel: () => void
}

export const CombineTasksQuickView = ({
  taskStats,
  isLoading,
  onOpenPanel
}: CombineTasksQuickViewProps) => {
  const handleOpenPanel = useCallback(() => {
    onOpenPanel()
  }, [onOpenPanel])

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
      <PlayCircle className="h-4 w-4 text-blue-600" />
      <div className="flex items-center gap-3 text-sm">
        {
          taskStats.running > 0 && (
            <span className="font-medium">
              {isLoading ? 'Loading...' : `Tasks: ${taskStats.running} running`}
            </span>
          )
        }

        {taskStats.completed > 0 && (
          <Badge variant="outline" className="text-xs">
            ✓ {taskStats.completed}
          </Badge>
        )}

      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenPanel}
        className="h-6 px-2 text-xs"
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  )
}
