"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, CheckCircle, AlertCircle } from "lucide-react"

interface VideoProgressProps {
  actionId: string
  type: "videoClip" | "videoCombination"
  title: string
  progress?: number
  processed?: number
  total?: number
  isProcessing?: boolean
  error?: string | null
  taskId?: string | null
  onCancel?: () => void
  onComplete?: () => void
}

export function VideoProgress({
  actionId,
  type,
  title,
  progress = 0,
  processed = 0,
  total = 1,
  isProcessing = false,
  error = null,
  taskId,
  onCancel,
  onComplete
}: VideoProgressProps) {
  const getProgressText = () => {
    if (error) return "处理失败"
    if (!isProcessing && progress >= 100) return "处理完成"
    if (isProcessing) return "处理中..."
    return "等待开始"
  }

  const getIcon = () => {
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (progress >= 100) return <CheckCircle className="h-4 w-4 text-green-500" />
    return null
  }

  const getStatusColor = () => {
    if (error) return "text-red-500"
    if (progress >= 100) return "text-green-500"
    return "text-blue-500"
  }

  return (
    <Card className={`w-full ${error ? 'border-red-200' : progress >= 100 ? 'border-green-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className={`text-sm font-medium ${getStatusColor()}`}>
              {title}
            </CardTitle>
          </div>
          {onCancel && isProcessing && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{getProgressText()}</span>
            {total > 1 && (
              <span>{processed}/{total}</span>
            )}
            {!error && !isProcessing && progress < 100 && (
              <span>等待中...</span>
            )}
          </div>

          {error ? (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          ) : (
            <Progress value={progress} className="h-2" />
          )}

          {taskId && isProcessing && (
            <div className="text-xs text-gray-400">
              任务ID: {taskId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface VideoProgressListProps {
  videoActions: Record<string, any>
  onCancel?: (actionId: string) => void
  onComplete?: (actionId: string) => void
}

export function VideoProgressList({ videoActions, onCancel, onComplete }: VideoProgressListProps) {
  const actionEntries = Object.entries(videoActions)

  if (actionEntries.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {actionEntries.map(([actionId, state]) => {
        const isClip = actionId.startsWith('clip_')
        const isCombine = actionId.startsWith('combine_')

        if (!isClip && !isCombine) return null

        return (
          <VideoProgress
            key={actionId}
            actionId={actionId}
            type={isClip ? 'videoClip' : 'videoCombination'}
            title={isClip ? '视频生成' : '视频合并'}
            progress={state.progress}
            processed={state.processed}
            total={state.total}
            isProcessing={state.isProcessing}
            error={state.error}
            taskId={state.taskId}
            onCancel={() => onCancel?.(actionId)}
            onComplete={() => onComplete?.(actionId)}
          />
        )
      })}
    </div>
  )
}