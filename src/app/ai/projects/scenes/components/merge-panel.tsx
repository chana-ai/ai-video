"use client"

import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Loader2, Video, Download } from "lucide-react"
import type { Scene } from "@/app/ai/projects/types"
import { wsManager, type WsMessage } from "@/lib/websocket"
import { showToast } from "@/lib/toast-helpers"

// Storyboard状态类型
interface StoryboardStatus {
  id: number
  title: string
  duration: string
  status: 'INIT' | 'PROCESSING' | 'COMPLETE' | 'FAIL'
  videoUrl?: string
  canSelect: boolean
}

// 合并任务状态
interface MergeTask {
  isMerging: boolean
  progress: number // 0-100
  processed: number // 已处理数量
  total: number // 总数量
  status: 'idle' | 'processing' | 'completed' | 'failed'
  resultUrl?: string // 合并完成的视频URL
  currentProcessing?: string // 当前处理的场景标题
}

interface MergePanelProps {
  isOpen: boolean
  projectId: string
  stageId: string
  scenes: Scene[]
  onMergeComplete?: (resultUrl: string) => void
  onClose?: () => void
}

export interface MergePanelRef {
  closePanel: () => void
}

export const MergePanel = forwardRef<MergePanelRef, MergePanelProps>(({
  isOpen,
  projectId,
  stageId,
  scenes,
  onMergeComplete,
  onClose
}, ref) => {
  // 面板状态
  const [selectedStoryboards, setSelectedStoryboards] = useState<Set<number>>(new Set())

  // 合并任务状态
  const [mergeTask, setMergeTask] = useState<MergeTask>({
    isMerging: false,
    progress: 0,
    processed: 0,
    total: 0,
    status: 'idle'
  })

  // 处理storyboards数据
  const storyboards = useMemo(() => {
    return scenes
      .filter((s: Scene) => s.storyboard === true && s.parent_id !== null)
      .map((s: Scene) => ({
        id: s.id,
        title: s.title,
        duration: s.video_setting?.duration || "0:15",
        status: determineStoryboardStatus(s),
        videoUrl: s.video_url,
        canSelect: isStoryboardReady(s)
      }))
  }, [scenes])

  // 计算故事板状态
  const storyboardsByStatus = useMemo(() => {
    return {
      complete: storyboards.filter(s => s.status === 'COMPLETE'),
      processing: storyboards.filter(s => s.status === 'PROCESSING'),
      init: storyboards.filter(s => s.status === 'INIT'),
      fail: storyboards.filter(s => s.status === 'FAIL')
    }
  }, [storyboards])

  // Scene 状态类型定义
  type SceneStatus = 'INIT' | 'PROCESSING' | 'COMPLETE' | 'FAIL'

  // 确定单个storyboard状态
  function determineStoryboardStatus(scene: Scene): SceneStatus {
    if (scene.status === 'COMPLETE') return 'COMPLETE'
    if (scene.status === 'PROCESSING') return 'PROCESSING'
    if (scene.status === 'FAIL') return 'FAIL'
    return 'INIT'
  }

  // 判断storyboard是否已就绪可以合并
  function isStoryboardReady(scene: Scene): boolean {
    return scene.status === 'COMPLETE' || scene.video_url !== undefined
  }

  // 打开面板时的初始化
  useEffect(() => {
    if (isOpen && mergeTask.status === 'idle') {
      // 自动选择所有已就绪的storyboard
      const readyIds = storyboardsByStatus.complete.map(s => s.id)
      setSelectedStoryboards(new Set(readyIds))
    }
  }, [isOpen, mergeTask.status, storyboardsByStatus.complete, storyboards.length])

  // 订阅WebSocket事件
  useEffect(() => {
    if (!isOpen || !projectId || !stageId) return

    // 订阅合并任务相关事件
    const unsubscribeAccepted = wsManager.subscribe('createVideoCombinationAccepted', (message: WsMessage) => {
      console.log('合并任务已接受:', message)
      if (message.task_id) {
        setMergeTask(prev => ({
          ...prev,
          isMerging: true,
          progress: 0,
          processed: 0,
          total: selectedStoryboards.size,
          status: 'processing'
        }))
      }
    })

    const unsubscribeProgress = wsManager.subscribe('createVideoCombinationProgress', (message: WsMessage) => {
      console.log('合并进度更新:', message)
      if (mergeTask.status === 'processing') {
        setMergeTask((prev: MergeTask) => ({
          ...prev!,
          progress: message.progress || 0,
          processed: message.processed || 0,
          total: message.total || prev.total,
          currentProcessing: message.current_processing
        }))
      }
    })

    const unsubscribeComplete = wsManager.subscribe('createVideoCombinationComplete', (message: WsMessage) => {
      console.log('合并完成:', message)
      if (message.result_url) {
        setMergeTask({
          isMerging: false,
          progress: 100,
          processed: mergeTask.total,
          total: mergeTask.total,
          status: 'completed',
          resultUrl: message.result_url
        })

        // 通知父组件合并完成
        onMergeComplete?.(message.result_url)

        // 显示成功提示
        showToast('视频合并成功！', 'success')
      }
    })

    const unsubscribeError = wsManager.subscribe('createVideoCombinationError', (message: WsMessage) => {
      console.error('合并失败:', message)
      setMergeTask(prev => ({
        ...prev!,
        status: 'failed'
      }))
      showToast(`视频合并失败: ${message.message || '未知错误'}`, 'error')
    })

    return () => {
      unsubscribeAccepted()
      unsubscribeProgress()
      unsubscribeComplete()
      unsubscribeError()
    }
  }, [isOpen, projectId, stageId, selectedStoryboards.size, mergeTask.status, onMergeComplete])

  // 切换单个storyboard选择
  const toggleStoryboardSelection = (storyboardId: number) => {
    if (!storyboards.find(s => s.id === storyboardId)?.canSelect) return

    setSelectedStoryboards((prev: Set<number>) => {
      const next = new Set(prev)
      if (next.has(storyboardId)) {
        next.delete(storyboardId)
      } else {
        next.add(storyboardId)
      }
      return next
    })
  }

  // 全选/全不选
  // const handleSelectAll = () => {
  //   const allIds = storyboards.map(s => s.id)
  //   setSelectedStoryboards(new Set(allIds))
  // }

  const handleDeselectAll = () => {
    setSelectedStoryboards(new Set())
  }

  const handleSelectReadyOnly = () => {
    const readyIds = storyboardsByStatus.complete.map(s => s.id)
    setSelectedStoryboards(new Set(readyIds))
  }

  // 开始合并
  const handleStartMerge = async () => {
    if (selectedStoryboards.size === 0) {
      showToast("请至少选择1个storyboard", "error")
      return
    }

    // 过滤出已就绪的storyboard
    const readyToMerge = storyboards.filter(s =>
      selectedStoryboards.has(s.id) && s.canSelect
    )

    if (readyToMerge.length === 0) {
      showToast("选中的storyboard尚未准备好", "info")
      return
    }

    try {
      // 提交合并任务
      await wsManager.sendCreateVideoCombination(
        Number(projectId),
        Number(stageId),
        readyToMerge.map(s => s.id)
      )
    } catch (error: any) {
      showToast(`合并任务启动失败: ${error.message || '未知错误'}`, 'error', 5000)
    }
  }

  // 取消合并任务
  const handleCancelMerge = () => {
    wsManager.cancelVideoCombination?.()
    setMergeTask({
      isMerging: false,
      progress: 0,
      processed: 0,
      total: 0,
      status: 'idle'
    })
  }

  // 渲染内容
  const renderContent = () => {
    if (mergeTask.status === 'processing') {
      return (
        <div className="space-y-6">
          {/* 进度区域 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">合并任务进行中...</h3>
              <span className="text-sm text-gray-500">
                {mergeTask.progress}% ({mergeTask.processed}/{mergeTask.total})
              </span>
            </div>
            <Progress value={mergeTask.progress} className="w-full" />
            {mergeTask.currentProcessing && (
              <p className="text-sm text-blue-600">
                正在处理: {mergeTask.currentProcessing}
              </p>
            )}
          </div>

          {/* 状态列表 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">处理状态:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {storyboards.map(s => {
                const isSelected = selectedStoryboards.has(s.id)
                const statusIcon = getStatusIcon(s.status, isSelected)
                return (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    {statusIcon}
                    <span className={`${isSelected ? 'font-medium' : 'text-gray-500'}`}>
                      {s.title}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {s.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 取消按钮 */}
          <Button
            variant="destructive"
            onClick={handleCancelMerge}
            className="w-full"
          >
            取消任务
          </Button>
        </div>
      )
    }

    if (mergeTask.status === 'completed' && mergeTask.resultUrl) {
      return (
        <div className="space-y-6">
          {/* 完成状态 */}
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium text-green-700">合并完成</h3>
            <p className="text-sm text-gray-500">
              总时长: {storyboardsByStatus.complete.reduce((sum: number, s: StoryboardStatus) => sum + parseDuration(s.duration), 0)}秒
            </p>
          </div>

          {/* 视频预览 */}
          <div className="space-y-3">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                src={mergeTask.resultUrl}
                className="w-full h-full object-cover"
                controls
                autoPlay
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <a
                href={mergeTask.resultUrl}
                download={`merged-video-${Date.now()}.mp4`}
                className="flex-1"
              >
                <Button className="w-full" variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  下载视频
                </Button>
              </a>
              <Button variant="outline" onClick={onClose}>
                关闭面板
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // 默认的选择视图
    return (
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">选择要合并的storyboard</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* 空状态 */}
        {storyboards.length === 0 && (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">暂无storyboard</p>
            <p className="text-sm text-gray-400 mt-1">请先生成storyboard</p>
          </div>
        )}

        {/* 状态统计 */}
        {storyboards.length > 0 && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <StatCard title="已完成" count={storyboardsByStatus.complete.length} color="green" />
            <StatCard title="处理中" count={storyboardsByStatus.processing.length} color="blue" />
            <StatCard title="未开始" count={storyboardsByStatus.init.length} color="gray" />
            <StatCard title="失败" count={storyboardsByStatus.fail.length} color="red" />
          </div>
        )}

        {/* 故事板列表 */}
        {storyboards.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {storyboards.map(s => (
              <StoryboardItem
                key={s.id}
                storyboard={s}
                isSelected={selectedStoryboards.has(s.id)}
                onSelect={toggleStoryboardSelection}
                canSelect={s.canSelect}
              />
            ))}
          </div>
        )}

        {/* 快捷操作按钮 */}
        {storyboards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* <Button size="sm" variant="outline" onClick={handleSelectAll}>
              全选
            </Button> */}
            <Button size="sm" variant="outline" onClick={handleDeselectAll}>
              全不选
            </Button>
            <Button size="sm" variant="outline" onClick={handleSelectReadyOnly}>
              全选择已就绪
            </Button>
          </div>
        )}

        {/* 开始合并按钮 */}
        <Button
          onClick={handleStartMerge}
          disabled={selectedStoryboards.size === 0}
          className="w-full"
        >
          开始合并
        </Button>
      </div>
    )
  }

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    closePanel: () => {
      setMergeTask(prev => ({
        ...prev,
        isMerging: false,
        progress: 0,
        processed: 0,
        total: 0,
        status: 'idle'
      }))
      setSelectedStoryboards(new Set())
      onClose?.()
    }
  }))

  return (
    <div
      className={`
        merge-panel
        fixed top-16 left-1/2 -translate-x-1/2 w-[720px] max-h-[117vh]
        bg-white rounded-xl shadow-2xl border border-gray-200
        transition-all duration-300 ease-in-out
        z-50
        ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
      style={{ maxHeight: '117vh' }}
    >
      <div className="p-6 overflow-hidden flex flex-col" style={{ maxHeight: '117vh' }}>
        {renderContent()}
      </div>
    </div>
  )
})

MergePanel.displayName = 'MergePanel'

MergePanel.displayName = 'MergePanel'

// 单个storyboard项组件
function StoryboardItem({
  storyboard,
  isSelected,
  onSelect,
  canSelect
}: {
  storyboard: StoryboardStatus
  isSelected: boolean
  onSelect: (id: number) => void
  canSelect: boolean
}) {
  const statusIcon = getStatusIcon(storyboard.status, isSelected)

  return (
    <div
      className={`
        p-3 rounded-lg border transition-colors
        ${canSelect
          ? 'cursor-pointer hover:bg-gray-50 border-gray-200'
          : 'cursor-not-allowed opacity-60 border-gray-100'
        }
        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
      `}
      onClick={() => canSelect && onSelect(storyboard.id)}
    >
      <div className="flex items-center gap-3">
        {/* 勾选框 */}
        {canSelect && (
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center
            ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
          `}>
            {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
          </div>
        )}

        {/* 状态图标 */}
        {statusIcon}

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{storyboard.title}</p>
          <p className="text-xs text-gray-500">{storyboard.duration}</p>
        </div>

        {/* 状态标签 */}
        <Badge variant="secondary" className="text-xs">
          {storyboard.status}
        </Badge>
      </div>
    </div>
  )
}

// 状态图标组件
function getStatusIcon(status: string, isSelected: boolean) {
  const iconProps = { className: "h-4 w-4" }

  switch (status) {
    case 'COMPLETE':
      return <CheckCircle {...iconProps} className={`${isSelected ? 'text-green-500' : 'text-gray-400'}`} />
    case 'PROCESSING':
      return <Loader2 className={`${iconProps.className} text-blue-500 animate-spin`} />
    case 'FAIL':
      return <XCircle {...iconProps} className="text-red-400" />
    case 'INIT':
      return <Clock {...iconProps} className="text-gray-400" />
    default:
      return <Clock {...iconProps} className="text-gray-400" />
  }
}

// 统计卡片组件
function StatCard({ title, count, color }: { title: string; count: number; color: string }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className={`p-2 rounded border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-lg font-bold">{count}</div>
      <div className="text-xs">{title}</div>
    </div>
  )
}

// 解析时长字符串
function parseDuration(duration: string): number {
  const parts = duration.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }
  return parseInt(duration) || 0
}