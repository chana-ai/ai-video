"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Video,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  FileVideo
} from "lucide-react"
import type { Scene } from "@/app/ai/projects/types"

interface MergeProgressProps {
  taskId?: string
  projectId: string
  stageId: string
  totalScenes: number
  className?: string
}

// 合并任务状态
interface MergeTask {
  id: string
  status: 'idle' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: number // 0-100
  processedScenes: number
  totalScenes: number
  currentScene?: string
  startTime?: string
  endTime?: string
  duration?: string
  error?: string
  resultUrl?: string
  pauseReason?: string
}

// 场景处理状态
interface SceneProcessStatus {
  id: number
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
  progress?: number
  startTime?: string
  endTime?: string
  duration?: string
  error?: string
  videoUrl?: string
}

// 默认任务状态
const defaultTask: MergeTask = {
  id: '',
  status: 'idle',
  progress: 0,
  processedScenes: 0,
  totalScenes: 0
}

export function MergeProgress({
  taskId,
  projectId,
  stageId,
  totalScenes,
  className = ""
}: MergeProgressProps) {
  const [task, setTask] = useState<MergeTask>(defaultTask)
  const [sceneStatuses, setSceneStatuses] = useState<SceneProcessStatus[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // 模拟数据 - 在实际使用中应该从WebSocket获取
  const mockData = useMemo(() => {
    return generateMockSceneStatuses(totalScenes)
  }, [totalScenes])

  // 初始化场景状态
  useEffect(() => {
    setSceneStatuses(mockData)
    setTask(prev => ({
      ...prev,
      totalScenes,
      id: taskId || `task_${Date.now()}`
    }))
  }, [totalScenes, taskId, mockData])

  // 计算已完成的场景
  const completedScenes = useMemo(() => {
    return sceneStatuses.filter(s => s.status === 'completed').length
  }, [sceneStatuses])

  // 更新任务进度
  useEffect(() => {
    if (task.status === 'processing' && !isPaused) {
      const progress = Math.round((completedScenes / totalScenes) * 100)
      setTask(prev => ({
        ...prev,
        progress,
        processedScenes: completedScenes
      }))
    }
  }, [completedScenes, totalScenes, task.status, isPaused])

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (task.status === 'processing' && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [task.status, isPaused])

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // 暂停/继续任务
  const togglePause = () => {
    const newPausedState = !isPaused
    setIsPaused(newPausedState)
    setTask(prev => ({
      ...prev,
      status: newPausedState ? 'paused' : 'processing',
      pauseReason: newPausedState ? '用户暂停' : undefined
    }))
  }

  // 取消任务
  const cancelTask = () => {
    setTask(prev => ({
      ...prev,
      status: 'failed',
      error: '用户取消了任务'
    }))
    setIsPaused(false)
  }

  // 重试任务
  const retryTask = () => {
    setTask(defaultTask)
    setIsPaused(false)
    setSceneStatuses(mockData)
    setElapsedTime(0)
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'skipped':
        return <Clock className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'skipped':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 任务概览卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              合并任务进度
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  task.status === 'processing' ? 'default' :
                  task.status === 'completed' ? 'secondary' :
                  task.status === 'failed' ? 'destructive' : 'outline'
                }
              >
                {task.status === 'processing' && '处理中'}
                {task.status === 'completed' && '已完成'}
                {task.status === 'failed' && '失败'}
                {task.status === 'paused' && '已暂停'}
                {task.status === 'idle' && '等待中'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">总进度</span>
                <span className="font-medium">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>已处理: {task.processedScenes}/{task.totalScenes}</span>
                <span>用时: {formatTime(elapsedTime)}</span>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-700">
                  {sceneStatuses.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-xs text-green-600">已完成</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-700">
                  {sceneStatuses.filter(s => s.status === 'processing').length}
                </div>
                <div className="text-xs text-blue-600">处理中</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-gray-700">
                  {sceneStatuses.filter(s => s.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-600">待处理</div>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <div className="text-lg font-bold text-red-700">
                  {sceneStatuses.filter(s => s.status === 'failed').length}
                </div>
                <div className="text-xs text-red-600">失败</div>
              </div>
            </div>

            {/* 控制按钮 */}
            {task.status !== 'completed' && task.status !== 'failed' && (
              <div className="flex gap-2">
                {task.status === 'processing' ? (
                  <Button onClick={togglePause} variant="outline" className="flex-1">
                    {isPaused ? (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        继续处理
                      </>
                    ) : (
                      <>
                        <PauseCircle className="h-4 w-4 mr-2" />
                        暂停任务
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => setTask(prev => ({ ...prev, status: 'processing' }))} className="flex-1">
                    开始合并
                  </Button>
                )}
                <Button onClick={cancelTask} variant="destructive" size="icon">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}

            {task.status === 'failed' && (
              <div className="flex gap-2">
                <Button onClick={retryTask} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重试任务
                </Button>
              </div>
            )}

            {/* 错误信息 */}
            {task.error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">错误信息</p>
                  <p className="text-sm text-red-600">{task.error}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 场景处理详情 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">场景处理详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sceneStatuses.map(scene => (
              <div key={scene.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(scene.status)}
                  <div>
                    <p className="font-medium text-sm">{scene.title}</p>
                    {scene.status === 'processing' && scene.progress !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={scene.progress} className="w-24 h-1.5" />
                        <span className="text-xs text-gray-500">{scene.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(scene.status)} variant="secondary">
                    {scene.status === 'pending' && '等待中'}
                    {scene.status === 'processing' && '处理中'}
                    {scene.status === 'completed' && '已完成'}
                    {scene.status === 'failed' && '失败'}
                    {scene.status === 'skipped' && '已跳过'}
                  </Badge>
                  {scene.videoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(scene.videoUrl, '_blank')}
                    >
                      <PlayCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 完成状态 */}
      {task.status === 'completed' && task.resultUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              合并完成！
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">视频生成成功</p>
                <p className="text-sm text-gray-500">总用时: {formatTime(elapsedTime)}</p>
              </div>

              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  src={task.resultUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                />
              </div>

              <div className="flex justify-center gap-2">
                <a
                  href={task.resultUrl}
                  download={`merged-video-${Date.now()}.mp4`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <FileVideo className="h-4 w-4 mr-2 inline" />
                  下载视频
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 生成模拟场景状态数据
function generateMockSceneStatuses(count: number): SceneProcessStatus[] {
  const statuses: SceneProcessStatus[] = []
  const titles = ['场景1', '场景2', '场景3', '场景4', '场景5', '场景6', '场景7', '场景8']

  for (let i = 0; i < Math.min(count, titles.length); i++) {
    const status: SceneProcessStatus = {
      id: i + 1,
      title: titles[i],
      status: Math.random() > 0.2 ? 'completed' : Math.random() > 0.5 ? 'processing' : 'failed',
      progress: Math.random() > 0.2 ? Math.floor(Math.random() * 100) : undefined,
      startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      duration: `${Math.floor(Math.random() * 5) + 1}分钟`,
      videoUrl: Math.random() > 0.5 ? `https://example.com/video${i + 1}.mp4` : undefined
    }
    statuses.push(status)
  }

  // 如果需要更多场景，复制现有模式
  while (statuses.length < count) {
    const baseIndex = (statuses.length - 1) % titles.length
    statuses.push({
      ...statuses[baseIndex],
      id: statuses.length + 1,
      title: `${titles[baseIndex]} ${Math.floor(statuses.length / titles.length) + 1}`
    })
  }

  return statuses
}