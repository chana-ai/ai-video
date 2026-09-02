"use client"

import React, { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Loader2, Video, Square, CheckSquare, Minus } from "lucide-react"
import type { Scene } from "@/app/ai/projects/types"

interface StoryboardSelectionProps {
  storyboards: Scene[]
  selectedIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  disabled?: boolean
  showStatusCounts?: boolean
}

// Storyboard状态类型
interface StoryboardStatus {
  id: number
  title: string
  duration: string
  status: 'ready' | 'processing' | 'not-started' | 'failed'
  videoUrl?: string
  canSelect: boolean
  parentTitle?: string
}

export function StoryboardSelection({
  storyboards,
  selectedIds,
  onSelectionChange,
  disabled = false,
  showStatusCounts = true
}: StoryboardSelectionProps) {
  // 内部状态管理
  const [localSelection, setLocalSelection] = useState<Set<number>>(new Set())

  // 当外部selection变化时更新内部状态
  React.useEffect(() => {
    setLocalSelection(new Set(selectedIds))
  }, [selectedIds])

  // 处理storyboards数据
  const processedStoryboards = useMemo(() => {
    return storyboards
      .filter(s => s.storyboard === true && s.parent_id !== null)
      .map(s => ({
        id: s.id,
        title: s.title,
        duration: s.video_setting?.duration || "0:15",
        status: determineStoryboardStatus(s),
        videoUrl: s.video_url,
        canSelect: s.video_url ? true : false,
        parentTitle: getSceneTitle(s.parent_id, storyboards)
      }))
  }, [storyboards])

  // 计算故事板状态统计
  const storyboardsByStatus = useMemo(() => {
    return {
      ready: processedStoryboards.filter(s => s.status === 'ready'),
      processing: processedStoryboards.filter(s => s.status === 'processing'),
      notStarted: processedStoryboards.filter(s => s.status === 'not-started'),
      failed: processedStoryboards.filter(s => s.status === 'failed')
    }
  }, [processedStoryboards])

  // 确定单个storyboard状态
  function determineStoryboardStatus(scene: Scene): 'ready' | 'processing' | 'not-started' | 'failed' {
    if (scene.video_url) return 'ready'
    if (scene.clip_status === true) return 'processing'
    if (scene.status === 'fail' || scene.status === 'FAIL') return 'failed'
    return 'not-started'
  }

  // 获取父场景标题
  function getSceneTitle(parentId: number | null, scenes: Scene[]): string | undefined {
    if (!parentId) return undefined
    const parent = scenes.find(s => s.id === parentId && s.storyboard === false)
    return parent?.title
  }

  // 切换单个storyboard选择
  const toggleStoryboardSelection = (storyboardId: number) => {
    if (disabled || !processedStoryboards.find(s => s.id === storyboardId)?.canSelect) return

    const newSelection = new Set(localSelection)
    if (newSelection.has(storyboardId)) {
      newSelection.delete(storyboardId)
    } else {
      newSelection.add(storyboardId)
    }

    setLocalSelection(newSelection)
    onSelectionChange(newSelection)
  }

  // 全选/全不选
  const handleSelectAll = () => {
    const allIds = processedStoryboards
      .filter(s => s.canSelect)
      .map(s => s.id)
    const newSelection = new Set(allIds)
    setLocalSelection(newSelection)
    onSelectionChange(newSelection)
  }

  const handleDeselectAll = () => {
    const newSelection = new Set()
    setLocalSelection(newSelection)
    onSelectionChange(newSelection)
  }

  const handleSelectReadyOnly = () => {
    const readyIds = storyboardsByStatus.ready.map(s => s.id)
    const newSelection = new Set(readyIds)
    setLocalSelection(newSelection)
    onSelectionChange(newSelection)
  }

  const handleSelectProcessingOnly = () => {
    const processingIds = storyboardsByStatus.processing.map(s => s.id)
    const newSelection = new Set(processingIds)
    setLocalSelection(newSelection)
    onSelectionChange(newSelection)
  }

  // 计算选择统计
  const selectionStats = useMemo(() => {
    const totalSelectables = storyboardsByStatus.ready.length + storyboardsByStatus.processing.length
    const selectedCount = localSelection.size
    const canSelectCount = processedStoryboards.filter(s => s.canSelect).length

    return {
      selectedCount,
      totalSelectables,
      canSelectCount,
      allReadySelected: storyboardsByStatus.ready.length > 0 &&
        storyboardsByStatus.ready.every(s => localSelection.has(s.id)),
      allSelectablesSelected: canSelectCount > 0 &&
        processedStoryboards.every(s => s.canSelect ? localSelection.has(s.id) : true)
    }
  }, [localSelection, processedStoryboards, storyboardsByStatus])

  return (
    <div className="space-y-4">
      {/* 标题和状态统计 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">选择要合并的storyboard</h3>
          <Badge variant="secondary">
            {selectionStats.selectedCount}/{selectionStats.totalSelectables}
          </Badge>
        </div>

        {/* 状态统计 */}
        {showStatusCounts && processedStoryboards.length > 0 && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <StatCard
              title="已就绪"
              count={storyboardsByStatus.ready.length}
              color="green"
              selected={storyboardsByStatus.ready.filter(s => localSelection.has(s.id)).length}
            />
            <StatCard
              title="生成中"
              count={storyboardsByStatus.processing.length}
              color="blue"
              selected={storyboardsByStatus.processing.filter(s => localSelection.has(s.id)).length}
            />
            <StatCard
              title="未开始"
              count={storyboardsByStatus.notStarted.length}
              color="gray"
            />
            <StatCard
              title="失败"
              count={storyboardsByStatus.failed.length}
              color="red"
            />
          </div>
        )}
      </div>

      {/* 故事板列表 */}
      {processedStoryboards.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {processedStoryboards.map(s => (
            <StoryboardItem
              key={s.id}
              storyboard={s}
              isSelected={localSelection.has(s.id)}
              onSelect={toggleStoryboardSelection}
              disabled={disabled || !s.canSelect}
            />
          ))}
        </div>
      )}

      {/* 快捷操作按钮 */}
      {processedStoryboards.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
            disabled={disabled}
            className="flex items-center gap-1"
          >
            <Square className="h-3 w-3" />
            全选
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeselectAll}
            disabled={disabled}
            className="flex items-center gap-1"
          >
            <Minus className="h-3 w-3" />
            全不选
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectReadyOnly}
            disabled={disabled || storyboardsByStatus.ready.length === 0}
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            仅就绪
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectProcessingOnly}
            disabled={disabled || storyboardsByStatus.processing.length === 0}
          >
            <Loader2 className="h-3 w-3 mr-1" />
            仅生成中
          </Button>
        </div>
      )}

      {/* 空状态 */}
      {processedStoryboards.length === 0 && (
        <div className="text-center py-8">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">暂无storyboard</p>
          <p className="text-sm text-gray-400 mt-1">请先生成storyboard</p>
        </div>
      )}

      {/* 选择摘要 */}
      {selectionStats.selectedCount > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            已选择 {selectionStats.selectedCount} 个storyboard
            {selectionStats.canSelectCount > 0 &&
              ` (${selectionStats.selectedCount}/${selectionStats.canSelectCount} 可合并)`
            }
          </p>
        </div>
      )}
    </div>
  )
}

// 单个storyboard项组件
function StoryboardItem({
  storyboard,
  isSelected,
  onSelect,
  disabled
}: {
  storyboard: StoryboardStatus
  isSelected: boolean
  onSelect: (id: number) => void
  disabled: boolean
}) {
  const statusIcon = getStatusIcon(storyboard.status)

  return (
    <div
      className={`
        p-3 rounded-lg border transition-all duration-200
        ${disabled
          ? 'cursor-not-allowed opacity-60 bg-gray-50 border-gray-200'
          : 'cursor-pointer hover:bg-gray-50 border-gray-200'
        }
        ${isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : ''}
        ${storyboard.canSelect ? '' : 'bg-gray-100 border-dashed'}
      `}
      onClick={() => !disabled && onSelect(storyboard.id)}
    >
      <div className="flex items-center gap-3">
        {/* 勾选框 */}
        {!disabled && (
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isSelected
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300 hover:border-blue-400'
            }
            ${!storyboard.canSelect ? 'opacity-50' : ''}
          `}>
            {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
          </div>
        )}

        {/* 状态图标 */}
        <div className={`
          flex-shrink-0
          ${disabled ? 'text-gray-400' : ''}
        `}>
          {statusIcon}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{storyboard.title}</p>
            {storyboard.parentTitle && (
              <Badge variant="outline" className="text-xs">
                {storyboard.parentTitle}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500">{storyboard.duration}</p>
            {!storyboard.canSelect && (
              <Badge variant="secondary" className="text-xs">
                不可选
              </Badge>
            )}
          </div>
        </div>

        {/* 状态标签 */}
        <Badge
          variant={storyboard.status === 'ready' ? 'default' : 'secondary'}
          className={`
            text-xs
            ${storyboard.status === 'ready' ? 'bg-green-100 text-green-700' : ''}
            ${storyboard.status === 'processing' ? 'bg-blue-100 text-blue-700' : ''}
            ${storyboard.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
          `}
        >
          {storyboard.status === 'ready' && '就绪'}
          {storyboard.status === 'processing' && '生成中'}
          {storyboard.status === 'not-started' && '未开始'}
          {storyboard.status === 'failed' && '失败'}
        </Badge>
      </div>
    </div>
  )
}

// 状态图标组件
function getStatusIcon(status: string) {
  const iconProps = { className: "h-4 w-4" }

  switch (status) {
    case 'ready':
      return <CheckCircle {...iconProps} className="text-green-500" />
    case 'processing':
      return <Loader2 className={`${iconProps.className} text-blue-500 animate-spin`} />
    case 'failed':
      return <XCircle {...iconProps} className="text-red-400" />
    case 'not-started':
      return <Clock {...iconProps} className="text-gray-400" />
    default:
      return <Clock {...iconProps} className="text-gray-400" />
  }
}

// 统计卡片组件
function StatCard({
  title,
  count,
  color,
  selected = 0
}: {
  title: string;
  count: number;
  color: string;
  selected?: number;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    red: 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <div className={`p-2 rounded border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-lg font-bold">
        {selected > 0 && (
          <span className="block text-xs font-normal">{selected}</span>
        )}
        {count}
      </div>
      <div className="text-xs">{title}</div>
    </div>
  )
}