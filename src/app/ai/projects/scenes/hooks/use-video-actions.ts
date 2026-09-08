import { useState } from 'react'
import { wsManager, type WsMessage } from '@/lib/websocket'
import { showToast } from '@/lib/toast-helpers'

interface VideoActionOptions {
  projectId: string
  stageId: string
  userId?: string
  onActionStart?: (action: string, taskId?: string) => void
  onActionProgress?: (action: string, progress: number, processed: number, total: number) => void
  onActionComplete?: (action: string, result?: any) => void
  onActionError?: (action: string, error: string) => void
}

interface VideoActionState {
  isProcessing: boolean
  taskId: string | null
  progress: number
  processed: number
  total: number
  error: string | null
}

export function useVideoActions(options: VideoActionOptions) {
  const [videoActions, setVideoActions] = useState<Record<string, VideoActionState>>({})

  const createVideoClip = async (sceneId: number, videoPrompt: string, imageId: number) => {
    const actionId = `clip_${sceneId}_${Date.now()}`

    try {
      setVideoActions(prev => ({
        ...prev,
        [actionId]: {
          isProcessing: true,
          taskId: null,
          progress: 0,
          processed: 0,
          total: 1,
          error: null
        }
      }))

      options.onActionStart?.('videoClip', sceneId.toString())

      await wsManager.executeAction('videoClip', {
        scene_id: sceneId,
        video_prompt: videoPrompt,
        project_id: Number(options.projectId),
        stage_id: Number(options.stageId),
        user_id: options.userId,
        image_id: imageId
      }, {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000
      })

      showToast('视频生成任务已提交', 'success', 3000)
      return actionId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '视频生成失败'
      setVideoActions(prev => ({
        ...prev,
        [actionId]: {
          ...prev[actionId],
          isProcessing: false,
          error: errorMessage
        }
      }))
      options.onActionError?.('videoClip', errorMessage)
      showToast(errorMessage, 'error', 5000)
      throw error
    }
  }

  const createVideoCombination = async (selectedSceneIds: number[]) => {
    const actionId = `combine_${Date.now()}`

    try {
      setVideoActions(prev => ({
        ...prev,
        [actionId]: {
          isProcessing: true,
          taskId: null,
          progress: 0,
          processed: 0,
          total: selectedSceneIds.length,
          error: null
        }
      }))

      options.onActionStart?.('videoCombination')

      await wsManager.executeAction('videoCombination', {
        project_id: Number(options.projectId),
        stage_id: Number(options.stageId),
        scene_ids: selectedSceneIds
      }, {
        timeout: 60000,
        retryCount: 2,
        retryDelay: 2000
      })

      showToast(`已提交 ${selectedSceneIds.length} 个storyboard 进行合并`, 'success', 3000)
      return actionId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '视频合并失败'
      setVideoActions(prev => ({
        ...prev,
        [actionId]: {
          ...prev[actionId],
          isProcessing: false,
          error: errorMessage
        }
      }))
      options.onActionError?.('videoCombination', errorMessage)
      showToast(errorMessage, 'error', 5000)
      throw error
    }
  }

  const cancelVideoCombination = () => {
    wsManager.cancelVideoCombination()
    showToast('已取消合并任务', 'info', 3000)
  }

  // 更新处理
  const updateActionState = (actionId: string, updates: Partial<VideoActionState>) => {
    setVideoActions(prev => ({
      ...prev,
      [actionId]: {
        ...prev[actionId],
        ...updates
      }
    }))
  }

  // 获取单个action的状态
  const getActionState = (actionId: string) => {
    return videoActions[actionId]
  }

  // 清除action状态
  const clearActionState = (actionId: string) => {
    setVideoActions(prev => {
      const next = { ...prev }
      delete next[actionId]
      return next
    })
  }

  // WebSocket订阅设置
  const setupSubscriptions = () => {
    // 视频片段生成订阅
    const unsubscribeClipAccepted = wsManager.subscribe('createVideoClipAccepted', (message: WsMessage) => {
      const actionId = `clip_${message.scene_id}_${Date.now()}`
      updateActionState(actionId, {
        taskId: message.task_id
      })
      options.onActionStart?.('videoClip', message.task_id)
    })

    const unsubscribeClipProgress = wsManager.subscribe('createVideoClipProgress', (message: WsMessage) => {
      const actionId = Object.keys(videoActions).find(id => id.startsWith('clip_'))
      if (actionId) {
        updateActionState(actionId, {
          progress: message.progress || 0,
          processed: message.processed || 0,
          total: message.total || 1
        })
        options.onActionProgress?.('videoClip', message.progress || 0, message.processed || 0, message.total || 1)
      }
    })

    const unsubscribeClipComplete = wsManager.subscribe('createVideoClipComplete', (message: WsMessage) => {
      const actionId = Object.keys(videoActions).find(id => id.startsWith('clip_'))
      if (actionId) {
        updateActionState(actionId, {
          isProcessing: false,
          progress: 100,
          processed: 1,
          total: 1
        })
        options.onActionComplete?.('videoClip', message)
        setTimeout(() => clearActionState(actionId), 3000)
      }
    })

    const unsubscribeClipError = wsManager.subscribe('createVideoClipError', (message: WsMessage) => {
      const actionId = Object.keys(videoActions).find(id => id.startsWith('clip_'))
      if (actionId) {
        updateActionState(actionId, {
          isProcessing: false,
          error: message.message || '视频生成失败'
        })
        options.onActionError?.('videoClip', message.message || '视频生成失败')
        setTimeout(() => clearActionState(actionId), 5000)
      }
    })

    // 视频合并订阅
    const unsubscribeCombinationAccepted = wsManager.subscribe('createVideoCombinationAccepted', (message: WsMessage) => {
      const actionId = Object.keys(videoActions).find(id => id.startsWith('combine_'))
      if (actionId) {
        updateActionState(actionId, {
          taskId: message.task_id
        })
        options.onActionStart?.('videoCombination', message.task_id)
      }
    })

    const unsubscribeCombinationProgress = wsManager.subscribe('createVideoCombinationProgress', (message: WsMessage) => {
      const actionId = Object.keys(videoActions).find(id => id.startsWith('combine_'))
      if (actionId) {
        updateActionState(actionId, {
          progress: message.progress || 0,
          processed: message.processed || 0,
          total: message.total || 1
        })
        options.onActionProgress?.('videoCombination', message.progress || 0, message.processed || 0, message.total || 1)
      }
    })

    const unsubscribeCombinationComplete = wsManager.subscribe('createVideoCombinationComplete', (message: WsMessage) => {
      const actionId = Object.keys(videoActions).find(id => id.startsWith('combine_'))
      if (actionId) {
        updateActionState(actionId, {
          isProcessing: false,
          progress: 100,
          processed: 1,
          total: 1
        })
        options.onActionComplete?.('videoCombination', message)
        setTimeout(() => clearActionState(actionId), 3000)
      }
    })

    const unsubscribeCombinationError = wsManager.subscribe('createVideoCombinationError', (message: WsMessage) => {
      const actionId = Object.keys(videoActions).find(id => id.startsWith('combine_'))
      if (actionId) {
        updateActionState(actionId, {
          isProcessing: false,
          error: message.message || '视频合并失败'
        })
        options.onActionError?.('videoCombination', message.message || '视频合并失败')
        setTimeout(() => clearActionState(actionId), 5000)
      }
    })

    return () => {
      unsubscribeClipAccepted()
      unsubscribeClipProgress()
      unsubscribeClipComplete()
      unsubscribeClipError()
      unsubscribeCombinationAccepted()
      unsubscribeCombinationProgress()
      unsubscribeCombinationComplete()
      unsubscribeCombinationError()
    }
  }

  return {
    videoActions,
    createVideoClip,
    createVideoCombination,
    cancelVideoCombination,
    getActionState,
    clearActionState,
    setupSubscriptions
  }
}