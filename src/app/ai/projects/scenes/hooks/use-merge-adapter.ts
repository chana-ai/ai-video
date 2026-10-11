import { useState, useEffect, useCallback } from 'react'
import { wsManager, type WsMessage } from '@/lib/websocket'
import { showToast } from '@/lib/toast-helpers'
import type { TaskStatusItem } from '@/app/ai/projects/types'

interface MergeAdapterOptions {
  projectId: string
  stageId: string
  onMergeStart?: () => void
  onMergeProgress?: (progress: number, processed: number, total: number) => void
  onMergeComplete?: (resultUrl: string) => void
  onMergeError?: (error: string) => void
  onMergeAccepted?: (taskId: string) => void
}

export interface MergeSelection {
  storyboardIds: number[]
  readyCount: number
  totalCount: number
}

export interface MergeTask {
  isMerging: boolean
  progress: number
  processed: number
  total: number
  status: 'idle' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  currentProcessing?: string
}

export function useMergeAdapter({
  projectId,
  stageId,
  onMergeStart,
  onMergeProgress,
  onMergeComplete,
  onMergeError,
  onMergeAccepted
}: MergeAdapterOptions) {
  const [isMergePanelOpen, setIsMergePanelOpen] = useState(false)
  const [selectedStoryboards, setSelectedStoryboards] = useState<Set<number>>(new Set())
  const [isMerging, setIsMerging] = useState(false)
  const [mergeTaskId, setMergeTaskId] = useState<string | null>(null)
  const [combineErrorMessage, setCombineErrorMessage] = useState<string>('')

  // 合并任务状态（导出给父组件使用）
  const [mergeTask, setMergeTask] = useState<MergeTask>({
    isMerging: false,
    progress: 0,
    processed: 0,
    total: Array.from(selectedStoryboards).length,
    status: 'idle' as const,
    resultUrl: undefined,
    currentProcessing: undefined
  })

  // 自动选择已就绪的storyboard
  const selectReadyStoryboards = useCallback((scenes: any[]) => {
    const readyIds = scenes
      .filter((s: any) => s.storyboard === true && s.parent_id !== null && s.video_url)
      .map((s: any) => s.id)
    setSelectedStoryboards(new Set(readyIds))
    return readyIds
  }, [])

  // 获取storyboard选择状态
  const getSelectionState = useCallback((scenes: any[]): MergeSelection => {
    const allStoryboards = scenes.filter((s: any) => s.storyboard === true && s.parent_id !== null)
    const readyStoryboards = allStoryboards.filter((s: any) => s.video_url)

    return {
      storyboardIds: Array.from(selectedStoryboards),
      readyCount: readyStoryboards.length,
      totalCount: allStoryboards.length
    }
  }, [selectedStoryboards])

  // 切换面板
  const toggleMergePanel = useCallback(() => {
    setIsMergePanelOpen(prev => !prev)
  }, [])

  // 关闭面板
  const closeMergePanel = useCallback(() => {
    setIsMergePanelOpen(false)
    setIsMerging(false)
    setMergeTaskId(null)
    setSelectedStoryboards(new Set())
    setCombineErrorMessage('')
  }, [])

  // 切换storyboard选择
  const toggleStoryboardSelection = useCallback((storyboardId: number) => {
    setSelectedStoryboards(prev => {
      const next = new Set(prev)
      if (next.has(storyboardId)) {
        next.delete(storyboardId)
      } else {
        next.add(storyboardId)
      }
      return next
    })
  }, [])

  // 选择全部就绪的
  const selectAllReady = useCallback((scenes: any[]) => {
    const readyIds = scenes
      .filter((s: any) => s.storyboard === true && s.parent_id !== null && s.video_url)
      .map((s: any) => s.id)
    setSelectedStoryboards(new Set(readyIds))
  }, [])

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedStoryboards(new Set())
  }, [])

  // 开始合并
  const startMerge = useCallback(async (scenes: any[]) => {
    // 过滤出已就绪的storyboard
    const readyToMerge = scenes.filter((s: any) =>
      selectedStoryboards.has(s.id) && s.video_url
    )

    if (readyToMerge.length === 0) {
      showToast("请至少选择1个已就绪的storyboard", "info", 3000)
      return
    }

    try {
      setMergeTask(prev => ({
        ...prev,
        isMerging: true,
        progress: 0,
        processed: 0,
        total: readyToMerge.length,
        status: 'processing'
      }))
      setCombineErrorMessage('')
      onMergeStart?.()

      // 发送合并请求（场景ID在WebSocket消息中）
      await wsManager.createVideoCombination(Array.from(selectedStoryboards))

      showToast(`已提交 ${readyToMerge.length} 个storyboard 进行合并`, "success", 3000)
    } catch (error: any) {
      const errorMessage = error.message || '合并任务启动失败'
      setMergeTask(prev => ({
        ...prev,
        isMerging: false,
        status: 'failed'
      }))
      setCombineErrorMessage(errorMessage)
      showToast(errorMessage, "error", 5000)
      onMergeError?.(errorMessage)
    }
  }, [projectId, stageId, selectedStoryboards, onMergeStart, onMergeError])

  // 取消合并
  const cancelMerge = useCallback(() => {
    try {
      wsManager.cancelVideoCombination?.()
      closeMergePanel()
      showToast("已取消合并任务", "info", 3000)
    } catch (error) {
      console.error('取消任务失败:', error)
    }
  }, [closeMergePanel])

  // WebSocket事件订阅
  useEffect(() => {
    // Early return if projectId or stageId is missing
    if (!projectId || !stageId) return

    // Check if wsManager is available
    if (!wsManager) {
      console.warn('useMergeAdapter: wsManager is not available')
      return
    }

    // Helper function to validate project/stage context
    const isContextValid = (message: WsMessage) => {
      return message.project_id != projectId || message.stage_id != stageId
    }

    console.log('useMergeAdapter: Subscribing to WebSocket events for project:', projectId, 'stage:', stageId)

    // 合并任务接受
    const unsubscribeAccepted = wsManager.subscribe('createVideoCombinationAccepted', (message: WsMessage) => {
      console.log('合并任务已接受:', message)
      if (isContextValid(message)) return

      if (message.task_id) {
        setMergeTaskId(message.task_id)
        setMergeTask(prev => ({
          ...prev,
          isMerging: true,
          status: 'processing'
        }))
        setIsMerging(true)
        onMergeAccepted?.(message.task_id)
      }
    })

    // 合并进度更新
    const unsubscribeProgress = wsManager.subscribe('createVideoCombinationProgress', (message: WsMessage) => {
      console.log('合并进度更新:', message)
      if (isContextValid(message)) return

      if (message.progress !== undefined || message.processed !== undefined) {
        setMergeTask(prev => ({
          ...prev,
          progress: message.progress || 0,
          processed: message.processed || 0,
          total: message.total || prev.total,
          currentProcessing: message.current_processing
        }))
        onMergeProgress?.(message.progress || 0, message.processed || 0, message.total || 0)
      }
    })

    // 合并完成
    const unsubscribeComplete = wsManager.subscribe('createVideoCombinationComplete', (message: WsMessage) => {
      console.log('合并完成:', message)
      if (isContextValid(message)) return

      if (message.result_url) {
        setMergeTask({
          isMerging: false,
          progress: 100,
          processed: mergeTask.total,
          total: mergeTask.total,
          status: 'completed',
          resultUrl: message.result_url
        })
        setIsMerging(false)
        setMergeTaskId(null)
        showToast('视频合并成功！', 'success', 3000)
        onMergeComplete?.(message.result_url)
        closeMergePanel()
      }
    })

    // 合并错误
    const unsubscribeError = wsManager.subscribe('createVideoCombinationError', (message: WsMessage) => {
      console.error('合并失败:', message)
      if (isContextValid(message)) return

      const errorMessage = message.message || '视频合并失败'
      setMergeTask({
        ...mergeTask,
        isMerging: false,
        status: 'failed',
        currentProcessing: undefined
      })
      setCombineErrorMessage(errorMessage)
      setIsMerging(false)
      setMergeTaskId(null)
      showToast(errorMessage, "error", 5000)
      onMergeError?.(errorMessage)
    })

    return () => {
      unsubscribeAccepted()
      unsubscribeProgress()
      unsubscribeComplete()
      unsubscribeError()
    }
  }, [projectId, stageId, mergeTask, selectedStoryboards, onMergeProgress, onMergeComplete, onMergeError, closeMergePanel])

  return {
    // 状态
    mergeTask,
    isMergePanelOpen,
    selectedStoryboards,
    isMerging,
    mergeTaskId,
    combineErrorMessage,

    // 操作
    toggleMergePanel,
    closeMergePanel,
    toggleStoryboardSelection,
    selectAllReady,
    clearSelection,
    startMerge,
    cancelMerge,
    getSelectionState,
    selectReadyStoryboards
  }
}