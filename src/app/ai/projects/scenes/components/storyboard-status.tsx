"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Video,
  Play,
  Eye,
  RefreshCw,
  AlertTriangle,
  FileVideo
} from "lucide-react"
import type { Scene } from "@/app/ai/projects/types"

interface StoryboardStatusProps {
  storyboards: Scene[]
  onPreview?: (videoUrl: string) => void
  onRetry?: (storyboardId: number) => void
  className?: string
}

// 状态类型定义
type StatusType = 'ready' | 'processing' | 'not-started' | 'failed' | 'complete'

interface StatusInfo {
  type: StatusType
  label: string
  color: string
  icon: React.ReactNode
  description: string
}

// 状态配置
const statusConfig: Record<StatusType, StatusInfo> = {
  ready: {
    type: 'ready',
    label: '就绪',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    description: '视频已生成，可进行合并'
  },
  processing: {
    type: 'processing',
    label: '生成中',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    description: '正在生成视频，请稍候...'
  },
  'not-started': {
    type: 'not-started',
    label: '未开始',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Clock className="h-4 w-4 text-gray-400" />,
    description: '尚未开始生成视频'
  },
  failed: {
    type: 'failed',
    label: '失败',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="h-4 w-4 text-red-400" />,
    description: '生成失败，请重试'
  },
  complete: {
    type: 'complete',
    label: '已完成',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    description: '视频生成完成'
  }
}

// 增强的storyboard数据
interface EnhancedStoryboard {
  id: number
  title: string
  duration: string
  status: StatusType
  videoUrl?: string
  statusInfo: StatusInfo
  parentScene?: {
    id: number
    title: string
  }
  progress?: number // 生成进度 0-100
  error?: string
  canPreview: boolean
  canRetry: boolean
  lastUpdated: string
}

export function StoryboardStatus({
  storyboards,
  onPreview,
  onRetry,
  className = ""
}: StoryboardStatusProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [videoPreviews, setVideoPreviews] = useState<Set<number>>(new Set())

  // 处理storyboards数据
  const enhancedStoryboards: EnhancedStoryboard[] = React.useMemo(() => {
    return storyboards
      .filter(s => s.storyboard === true && s.parent_id !== null)
      .map(s => {
        const status = determineStoryboardStatus(s)
        const parentScene = storyboards.find(scene =>
          scene.id === s.parent_id && scene.storyboard === false
        )

        return {
          id: s.id,
          title: s.title,
          duration: s.video_setting?.duration || "0:15",
          status,
          videoUrl: s.video_url,
          statusInfo: statusConfig[status],
          parentScene: parentScene ? {
            id: parentScene.id,
            title: parentScene.title
          } : undefined,
          progress: s.clip_status === true ? Math.floor(Math.random() * 100) : undefined,
          error: s.status === 'fail' || s.status === 'FAIL' ? '生成失败' : undefined,
          canPreview: !!s.video_url,
          canRetry: s.status === 'fail' || s.status === 'FAIL',
          lastUpdated: formatLastUpdated(s.update_time)
        }
      })
  }, [storyboards])

  // 状态统计
  const statusStats = React.useMemo(() => {
    const stats = {
      total: enhancedStoryboards.length,
      ready: enhancedStoryboards.filter(s => s.status === 'ready').length,
      processing: enhancedStoryboards.filter(s => s.status === 'processing').length,
      notStarted: enhancedStoryboards.filter(s => s.status === 'not-started').length,
      failed: enhancedStoryboards.filter(s => s.status === 'failed').length,
      complete: enhancedStoryboards.filter(s => s.status === 'complete').length
    }
    return stats
  }, [enhancedStoryboards])

  // 确定状态
  function determineStoryboardStatus(scene: Scene): StatusType {
    if (scene.video_url) return 'complete'
    if (scene.status === 'complete' || scene.status === 'COMPLETE') return 'complete'
    if (scene.clip_status === true) return 'processing'
    if (scene.status === 'fail' || scene.status === 'FAIL') return 'failed'
    return 'not-started'
  }

  // 格式化更新时间
  function formatLastUpdated(timeString: string): string {
    const date = new Date(timeString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}小时前`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}天前`
  }

  // 预览视频
  const handlePreview = useCallback((videoUrl: string, storyboardId: number) => {
    setVideoPreviews(prev => new Set(prev).add(storyboardId))
    onPreview?.(videoUrl)
  }, [onPreview])

  // 重试生成
  const handleRetry = useCallback((storyboardId: number) => {
    onRetry?.(storyboardId)
  }, [onRetry])

  // 切换展开状态
  const toggleExpand = (storyboardId: number) => {
    setExpandedId(prev => prev === storyboardId ? null : storyboardId)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和统计 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Storyboard 状态</h3>
          <Badge variant="secondary">
            总计: {statusStats.total}
          </Badge>
        </div>

        {/* 状态统计卡片 */}
        {statusStats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatusCountCard
              {...statusConfig.complete}
              count={statusStats.complete + statusStats.ready}
              total={statusStats.total}
            />
            <StatusCountCard
              {...statusConfig.processing}
              count={statusStats.processing}
              total={statusStats.total}
            />
            <StatusCountCard
              {...statusConfig['not-started']}
              count={statusStats.notStarted}
              total={statusStats.total}
            />
            <StatusCountCard
              {...statusConfig.failed}
              count={statusStats.failed}
              total={statusStats.total}
            />
          </div>
        )}
      </div>

      {/* 故事板列表 */}
      {enhancedStoryboards.length > 0 ? (
        <div className="space-y-4">
          {enhancedStoryboards.map(s => (
            <StoryboardStatusCard
              key={s.id}
              storyboard={s}
              isExpanded={expandedId === s.id}
              onExpand={() => toggleExpand(s.id)}
              onPreview={handlePreview}
              onRetry={handleRetry}
              isPreviewOpen={videoPreviews.has(s.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

// 单个故事板状态卡片
interface StoryboardStatusCardProps {
  storyboard: EnhancedStoryboard
  isExpanded: boolean
  onExpand: () => void
  onPreview: (videoUrl: string, storyboardId: number) => void
  onRetry: (storyboardId: number) => void
  isPreviewOpen: boolean
}

function StoryboardStatusCard({
  storyboard,
  isExpanded,
  onExpand,
  onPreview,
  onRetry,
  isPreviewOpen
}: StoryboardStatusCardProps) {
  const statusInfo = storyboard.statusInfo
  const canExpand = storyboard.progress !== undefined || storyboard.error || storyboard.videoUrl

  return (
    <Card className={`transition-all duration-200 ${
      isExpanded ? 'shadow-md' : 'hover:shadow-md'
    }`}>
      <CardContent className="p-4">
        {/* 卡片头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* 状态图标 */}
            {statusInfo.icon}

            {/* 信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{storyboard.title}</h4>
                {storyboard.parentScene && (
                  <Badge variant="outline" className="text-xs">
                    {storyboard.parentScene.title}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {storyboard.duration} · {storyboard.lastUpdated}
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 展开/收起按钮 */}
            {canExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="p-1.5"
              >
                {isExpanded ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* 预览按钮 */}
            {storyboard.canPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPreview(storyboard.videoUrl!, storyboard.id)}
                className="p-1.5"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            {/* 重试按钮 */}
            {storyboard.canRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(storyboard.id)}
                className="p-1.5 text-orange-600 hover:text-orange-700"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 状态标签 */}
        <div className="flex items-center justify-between">
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>

          {/* 进度显示 */}
          {storyboard.status === 'processing' && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-sm text-blue-600">
                {storyboard.progress || 0}%
              </span>
            </div>
          )}
        </div>

        {/* 展开的详情 */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {/* 状态描述 */}
            <p className="text-sm text-gray-600">{statusInfo.description}</p>

            {/* 错误信息 */}
            {storyboard.error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700">错误信息</p>
                  <p className="text-sm text-red-600">{storyboard.error}</p>
                </div>
              </div>
            )}

            {/* 进度条 */}
            {storyboard.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">生成进度</span>
                  <span className="text-blue-600">{storyboard.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${storyboard.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 视频预览 */}
            {storyboard.videoUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">视频预览</p>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {isPreviewOpen ? (
                    <video
                      src={storyboard.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">点击预览按钮查看视频</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 状态统计卡片
interface StatusCountCardProps {
  type: StatusType
  label: string
  color: string
  icon: React.ReactNode
  count: number
  total: number
}

function StatusCountCard({ label, color, icon, count, total }: StatusCountCardProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className={`${color} p-3 rounded-lg border`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-xs font-medium">{percentage}%</span>
      </div>
      <div className="text-lg font-bold">{count}</div>
      <div className="text-xs">{label}</div>
    </div>
  )
}

// 空状态组件
function EmptyState() {
  return (
    <div className="text-center py-12">
      <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无 Storyboard</h3>
      <p className="text-gray-500">请先创建场景并生成 storyboard</p>
    </div>
  )
}