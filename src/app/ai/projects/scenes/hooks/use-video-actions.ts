import { wsManager } from '@/lib/websocket'
import { showToast } from '@/lib/toast-helpers'
import { useEffect, useRef } from 'react'

interface VideoActionOptions {
  projectId: string
  stageId: string
  userId?: string
  onActionStart?: (action: string, taskId?: string) => void
  onActionProgress?: (action: string, progress: number, processed: number, total: number) => void
  onActionComplete?: (action: string, result?: any) => void
  onActionError?: (action: string, error: string) => void
  // Video clip specific callbacks
  onVideoClipAccepted?: (scene_id: string) => void
  onVideoClipComplete?: (resultUrl: string) => void
  onVideoClipError?: (errorMsg: string) => void
}

/**
 * Hook for video action operations (createVideoClip and createVideoCombination)
 * Manages both action triggering AND WebSocket subscriptions for video clip events.
 * Subscriptions are scoped to the current project/stage and automatically cleaned up.
 */
export function useVideoActions(options?: VideoActionOptions) {
  // Generate scoped action ID for proper project/stage scoping
  const generateActionId = (sceneId: number, actionType: string) => {
    const projectId = options?.projectId ? Number(options.projectId) : 0
    const stageId = options?.stageId ? Number(options.stageId) : 0
    const timestamp = Date.now()
    return `${projectId}_${stageId}_${sceneId}_${actionType}_${timestamp}`
  }

  // Use ref to maintain stable reference to options for subscription closures
  const optionsRef = useRef<VideoActionOptions | undefined>(options)

  // Update ref whenever options changes
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  // Derived values that should trigger subscription changes
  const projectId = optionsRef.current?.projectId
  const stageId = optionsRef.current?.stageId
  const onVideoClipError = optionsRef.current?.onVideoClipError

  // WebSocket subscription for video clip accepted event
  useEffect(() => {
    // Check if wsManager is available and WebSocket is connected
    // Use the isConnected property that is properly exposed by wsManager
    if (!wsManager) {
      console.warn('useVideoActions: wsManager is not available')
      return
    }

    // Force subscribe even if WebSocket is not connected yet
    // This ensures callbacks are registered when page loads/refreshes
    console.log('useVideoActions: Subscribing to createVideoClipAccepted event')

    const unsubscribeAccepted = wsManager.subscribe('createVideoClipAccepted', (message: any) => {
      // Use optionsRef.current to access latest options
      const currentOptions = optionsRef.current
      if (!currentOptions?.projectId || !currentOptions?.stageId) return
      if (message.project_id != currentOptions.projectId || message.stage_id != currentOptions.stageId) return

      if (message.scene_id && currentOptions.onVideoClipAccepted) {
        currentOptions.onVideoClipAccepted(message.scene_id)
      }
    })

    return () => {
      unsubscribeAccepted()
    }
  }, []) // Only run once when wsManager is available

  // WebSocket subscription for video clip complete event
  useEffect(() => {
    // Check if wsManager is available and WebSocket is connected
    // Use the isConnected property that is properly exposed by wsManager
    if (!wsManager) {
      console.warn('useVideoActions: wsManager is not available')
      return
    }

    // Force subscribe even if WebSocket is not connected yet
    // This ensures callbacks are registered when page loads/refreshes
    console.log('useVideoActions: Subscribing to createVideoClipComplete event')

    const unsubscribeComplete = wsManager.subscribe('createVideoClipComplete', (message: any) => {
      // Use optionsRef.current to access latest options
      const currentOptions = optionsRef.current
      console.log("---->", currentOptions)
      if (!currentOptions?.projectId || !currentOptions?.stageId) return
      if (message.project_id != currentOptions.projectId || message.stage_id != currentOptions.stageId) return

      currentOptions.onVideoClipComplete?.(message)
    })

    return () => {
      unsubscribeComplete()
    }
  }, []) // Only run once when wsManager is available

  // WebSocket subscription for video clip error event
  useEffect(() => {
    // Check if wsManager is available and WebSocket is connected
    // Use the isConnected property that is properly exposed by wsManager
    if (!wsManager) {
      console.warn('useVideoActions: wsManager is not available')
      return
    }

    // Force subscribe even if WebSocket is not connected yet
    // This ensures callbacks are registered when page loads/refreshes
    console.log('useVideoActions: Subscribing to createVideoClipError event')

    const unsubscribeError = wsManager.subscribe('createVideoClipError', (message: any) => {
      // Verify message belongs to current project/stage
      const currentOptions = optionsRef.current
      if (!currentOptions?.projectId || !currentOptions?.stageId) return
      if (message.project_id != currentOptions.projectId || message.stage_id != currentOptions.stageId) return

      const errorMsg = message.message || '视频生成失败'
      currentOptions.onVideoClipError?.(errorMsg)
    })

    return () => {
      unsubscribeError()
    }
  }, [projectId, stageId, onVideoClipError]) // Re-run when projectId/stageId/onVideoClipError changes

  const createVideoClip = async (sceneId: number, videoPrompt: string, imageId: number) => {
    const actionId = generateActionId(sceneId, 'clip')
    try {
      options?.onActionStart?.('videoClip', actionId)

      await wsManager.executeAction('videoClip', {
        scene_id: sceneId,
        video_prompt: videoPrompt,
        image_id: imageId,
        project_id: Number(options?.projectId || 0),
        stage_id: Number(options?.stageId || 0),
        user_id: options?.userId ? Number(options.userId) : undefined
      }, {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000
      })

      showToast('视频生成任务已提交', 'success', 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '视频生成失败'
      options?.onActionError?.('videoClip', errorMessage)
      showToast(errorMessage, 'error', 5000)
      throw error
    }
  }

  const createVideoCombination = async (selectedSceneIds: number[]) => {
    const actionId = generateActionId(0, 'combine')
    try {
      options?.onActionStart?.('videoCombination', actionId)

      await wsManager.executeAction('videoCombination', {
        project_id: Number(options?.projectId || 0),
        stage_id: Number(options?.stageId || 0),
        user_id: options?.userId ? Number(options.userId) : undefined,
        scene_ids: selectedSceneIds
      }, {
        timeout: 60000,
        retryCount: 2,
        retryDelay: 2000
      })

      showToast(`已提交 ${selectedSceneIds.length} 个storyboard 进行合并`, 'success', 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '视频合并失败'
      options?.onActionError?.('videoCombination', errorMessage)
      showToast(errorMessage, 'error', 5000)
      throw error
    }
  }

  const cancelVideoCombination = () => {
    wsManager.cancelVideoCombination()
    showToast('已取消合并任务', 'info', 3000)
  }

  return {
    createVideoClip,
    createVideoCombination,
    cancelVideoCombination
  }
}
