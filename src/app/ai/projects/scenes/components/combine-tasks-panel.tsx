"use client"

import React, { useState, useEffect, useCallback } from 'react'
import instance from '@/lib/axios'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, PlayCircle, CheckCircle, XCircle, Clock, Video, Loader2, X } from "lucide-react"
import type { TaskStatusItem, TaskStats } from "@/app/ai/projects/types"

interface CombineTasksPanelProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  stageId: string
  userId: number
}

export const CombineTasksPanel = ({
  isOpen,
  onClose,
  projectId,
  stageId,
  userId
}: CombineTasksPanelProps) => {
  const [tasks, setTasks] = useState<TaskStatusItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    running: 0,
    failed: 0
  })

  // Create a stable fetchTasks function using useCallback
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch task list
      const taskResponse = await instance.get('/api/v2/task/list', {
        params: {
          project_id: Number(projectId),
          stage_id: Number(stageId),
          user_id: userId,
          only_combination: true,
          start: 0,
          page_size: 100
        }
      })

      const data = taskResponse.tasks || {}
      setTasks(data || [])

      // Calculate stats
      const stats: TaskStats = {
        total: data.length || 0,
        completed: data.filter((t: TaskStatusItem) => t.status === 'COMPLETED').length || 0,
        running: data.filter((t: TaskStatusItem) => t.status === 'RUNNING').length || 0,
        failed: data.filter((t: TaskStatusItem) => t.status === 'FAILED').length || 0
      }
      setTaskStats(stats)
    } catch (error) {
      console.error('Failed to fetch combine task list:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, stageId, userId])

  // Fetch tasks
  useEffect(() => {
    if (!isOpen || !projectId || !stageId || !userId) return

    fetchTasks()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 w-[840px] max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Combine Tasks</h3>
          <p className="text-sm text-gray-500">
            {tasks.length} tasks • {taskStats.running} running • {taskStats.completed} completed • {taskStats.failed} failed
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
            <p className="text-gray-500 mt-2">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No combine tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Start a combine task to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <CombineTaskCard
                key={task.task_id}
                task={task}
                isExpanded={expandedTaskId === task.task_id}
                onToggleExpand={() => setExpandedTaskId(
                  expandedTaskId === task.task_id ? null : task.task_id
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Individual Task Card
interface CombineTaskCardProps {
  task: TaskStatusItem
  isExpanded: boolean
  onToggleExpand: () => void
}

function CombineTaskCard({ task, isExpanded, onToggleExpand }: CombineTaskCardProps) {
  const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING: { color: "bg-gray-100 text-gray-700", icon: Clock },
    RUNNING: { color: "bg-blue-100 text-blue-700", icon: PlayCircle },
    COMPLETED: { color: "bg-green-100 text-green-700", icon: CheckCircle },
    FAILED: { color: "bg-red-100 text-red-700", icon: XCircle },
    CANCELLED: { color: "bg-gray-100 text-gray-700", icon: Clock }
  }

  const config = statusConfig[task.status] || statusConfig.PENDING
  const Icon = config.icon

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Task Header */}
      <div
        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${config.color.split(' ')[1]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">Task {task.task_id.slice(-6)}</span>
                <Badge className={config.color} variant="secondary">
                  {task.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>ID: {task.task_id}</span>
                {task.message && (
                  <span>• {task.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono">{task.progress}%</span>
              <Progress value={task.progress} className="w-16 h-1.5" />
            </div>

            {/* Expand/Collapse */}
            <button
              className={`p-1 hover:bg-gray-200 rounded transition-colors ${isExpanded ? 'bg-gray-200' : ''}`}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-3">
          {/* Progress Details */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-mono">
                {task.progress}%
              </span>
            </div>
            <Progress value={task.progress} className="w-full h-2" />
          </div>

          {/* Time Info */}
          {task.create_time && (
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="text-gray-500">Created</span>
                <p className="font-medium">
                  {new Date(task.create_time).toLocaleString()}
                </p>
              </div>
              {task.update_time && (
                <div>
                  <span className="text-gray-500">Updated</span>
                  <p className="font-medium">
                    {new Date(task.update_time).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Video Preview */}
          {task.video_url && task.status === 'COMPLETED' && (
            <div className="mb-3">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                <video
                  src={task.video_url}
                  className="w-full h-full object-cover"
                  controls
                />
              </div>
              <div className="flex items-center justify-between">
                <a
                  href={task.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Video className="h-4 w-4" />
                  <span>Preview</span>
                </a>
                <Button variant="outline" size="sm" asChild>
                  <a href={task.video_url} download>
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {task.status === 'FAILED' && task.message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">
                Error: {task.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
