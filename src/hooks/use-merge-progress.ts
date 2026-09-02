import { useState, useEffect, useCallback, useRef } from 'react'
import { wsManager, type WsMessage } from '@/lib/websocket'

interface MergeProgress {
  taskId: string
  status: 'idle' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: number
  processed: number
  total: number
  currentProcessing?: string
  startTime?: string
  endTime?: string
  duration?: string
  error?: string
  resultUrl?: string
}

interface UseMergeProgressOptions {
  projectId: string
  stageId: string
  totalScenes?: number
  onProgress?: (progress: MergeProgress) => void
  onComplete?: (resultUrl: string) => void
  onError?: (error: string) => void
}

export function useMergeProgress({
  projectId,
  stageId,
  totalScenes = 0,
  onProgress,
  onComplete,
  onError
}: UseMergeProgressOptions) {
  const [progress, setProgress] = useState<MergeProgress>({
    taskId: '',
    status: 'idle',
    progress: 0,
    processed: 0,
    total: totalScenes
  })

  const isMounted = useRef(true)
  const eventSubscriptions = useRef<(() => void)[]>([])

  // 清理函数
  const cleanup = useCallback(() => {
    eventSubscriptions.current.forEach(unsubscribe => unsubscribe())
    eventSubscriptions.current = []
    isMounted.current = false
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // 更新进度
  const updateProgress = useCallback((newProgress: Partial<MergeProgress>) => {
    if (!isMounted.current) return

    const updated = { ...progress, ...newProgress }
    setProgress(updated)
    onProgress?.(updated)
  }, [progress, onProgress])

  // 开始合并任务
  const startMerge = useCallback(async (sceneIds: number[]) => {
    try {
      updateProgress({
        status: 'processing',
        startTime: new Date().toISOString(),
        total: sceneIds.length,
        processed: 0,
        progress: 0
      })

      // 发送合并请求
      const response = await wsManager.sendCreateVideoCombination(
        Number(projectId),
        Number(stageId)
      )

      if (response.task_id) {
        updateProgress({ taskId: response.task_id })
      }

      return response.task_id
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      updateProgress({
        status: 'failed',
        error: errorMessage
      })
      onError?.(errorMessage)
      throw error
    }
  }, [projectId, stageId, updateProgress, onError])

  // 暂停任务
  const pauseMerge = useCallback(() => {
    updateProgress({ status: 'paused' })
  }, [updateProgress])

  // 继续任务
  const resumeMerge = useCallback(() => {
    updateProgress({ status: 'processing' })
  }, [updateProgress])

  // 取消任务
  const cancelMerge = useCallback(() => {
    try {
      wsManager.cancelVideoCombination?.()
      updateProgress({
        status: 'failed',
        error: '用户取消了任务'
      })
    } catch (error) {
      console.error('取消任务失败:', error)
    }
  }, [updateProgress])

  // 重试任务
  const retryMerge = useCallback(async (sceneIds: number[]) => {
    updateProgress({
      status: 'idle',
      progress: 0,
      processed: 0,
      error: undefined,
      resultUrl: undefined
    })
    return startMerge(sceneIds)
  }, [startMerge])

  // 计算持续时间
  const calculateDuration = useCallback(() => {
    if (!progress.startTime) return '0秒'

    const start = new Date(progress.startTime).getTime()
    const end = progress.endTime ? new Date(progress.endTime).getTime() : Date.now()
    const duration = Math.floor((end - start) / 1000)

    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`
    } else {
      return `${seconds}秒`
    }
  }, [progress.startTime, progress.endTime])

  // 订阅WebSocket事件
  useEffect(() => {
    if (!projectId || !stageId) return

    // 合并任务接受
    const unsubscribeAccepted = wsManager.subscribe('createVideoCombinationAccepted', (message: WsMessage) => {
      if (message.task_id) {
        updateProgress({
          taskId: message.task_id,
          status: 'processing'
        })
      }
    })

    // 进度更新
    const unsubscribeProgress = wsManager.subscribe('createVideoCombinationProgress', (message: WsMessage) => {
      if (message.progress !== undefined || message.processed !== undefined || message.total !== undefined) {
        updateProgress({
          progress: message.progress || 0,
          processed: message.processed || 0,
          total: message.total || progress.total,
          currentProcessing: message.current_processing
        })
      }
    })

    // 合并完成
    const unsubscribeComplete = wsManager.subscribe('createVideoCombinationComplete', (message: WsMessage) => {
      if (message.result_url) {
        updateProgress({
          status: 'completed',
          progress: 100,
          processed: progress.total,
          total: progress.total,
          endTime: new Date().toISOString(),
          duration: calculateDuration(),
          resultUrl: message.result_url
        })
        onComplete?.(message.result_url)
      }
    })

    // 合并错误
    const unsubscribeError = wsManager.subscribe('createVideoCombinationError', (message: WsMessage) => {
      updateProgress({
        status: 'failed',
        endTime: new Date().toISOString(),
        duration: calculateDuration(),
        error: message.message || '合并失败'
      })
      onError?.(message.message || '合并失败')
    })

    eventSubscriptions.current = [
      unsubscribeAccepted,
      unsubscribeProgress,
      unsubscribeComplete,
      unsubscribeError
    ]

    return () => {
      cleanup()
    }
  }, [projectId, stageId, updateProgress, onComplete, onError, calculateDuration, progress.total])

  // 更新持续时间
  useEffect(() => {
    if (progress.status === 'processing' && progress.startTime) {
      const interval = setInterval(() => {
        if (!isMounted.current) return
        setProgress(prev => ({
          ...prev,
          duration: calculateDuration()
        }))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [progress.status, progress.startTime, calculateDuration])

  return {
    progress,
    startMerge,
    pauseMerge,
    resumeMerge,
    cancelMerge,
    retryMerge,
    isProcessing: progress.status === 'processing',
    isCompleted: progress.status === 'completed',
    isFailed: progress.status === 'failed',
    isPaused: progress.status === 'paused'
  }
}