import { useEffect, useState } from 'react'
import { wsManager, type WsMessage } from '@/lib/websocket'
import { wsManagerEnhanced } from '@/lib/websocket-enhanced'
import { showToast } from '@/lib/toast-helpers'

interface WebSocketManagerOptions {
  projectId?: string | number
  stageId?: string | number
  userId?: string | number
}

interface VideoActionCallbacks {
  onActionStart?: (action: string, taskId?: string) => void
  onActionProgress?: (action: string, progress: number, processed: number, total: number) => void
  onActionComplete?: (action: string, result?: any) => void
  onActionError?: (action: string, error: string) => void
}

interface WebSocketState {
  isConnected: boolean
  error: string | null
}

// 统一的WebSocket管理器
export function useWebSocketManager(
  options: WebSocketManagerOptions = {},
  videoCallbacks?: VideoActionCallbacks
) {
  const [wsState, setWsState] = useState<WebSocketState>({
    isConnected: false,
    error: null
  })

  // 使用增强的WebSocket管理器
  useEffect(() => {
    const { projectId, stageId, userId } = options

    // 只有当 projectId 和 stageId 都存在时才连接
    if (!projectId || !stageId) {
      setWsState({ isConnected: false, error: null })
      return
    }

    wsManagerEnhanced.setConnectionTimeout(5000)

    console.log('Attempting to connect WebSocket:', { projectId, stageId, userId })

    // 设置增强WebSocket的回调
    if (videoCallbacks) {
      wsManagerEnhanced.setActionCallbacks(videoCallbacks)
    }

    // 设置连接状态回调
    wsManagerEnhanced.setConnectionCallbacks({
      onConnect: () => {
        console.log('WebSocket connected successfully')
        setWsState(prev => ({ ...prev, isConnected: true, error: null }))
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected')
        setWsState(prev => ({ ...prev, isConnected: false, error: null }))
      },
      onError: (error) => {
        console.error('WebSocket connection error:', error)
        setWsState(prev => ({ ...prev, isConnected: false, error: 'WebSocket connection failed' }))
      }
    })

    // 检查是否已经连接，避免重复连接
    if (!wsManagerEnhanced.isConnected) {
      console.log('Connecting WebSocket with projectId:', projectId, 'stageId:', stageId)
      wsManagerEnhanced.connect(projectId, stageId, userId)
    } else {
      console.log('WebSocket already connected')
    }

    return () => {
      console.log('Disconnecting WebSocket')
      wsManagerEnhanced.disconnect()
    }
  }, [options.projectId, options.stageId, videoCallbacks])

  // 统一的发送视频片段生成请求
  const createVideoClip = async (sceneId: number, videoPrompt: string, imageId: number) => {
    if (!options.projectId || !options.stageId) {
      throw new Error('Project ID and Stage ID are required')
    }

    try {
      await wsManagerEnhanced.sendCreateVideoClip(
        sceneId,
        videoPrompt,
        Number(options.projectId),
        Number(options.stageId),
        options.userId || 0,
        imageId
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create video clip'
      showToast(errorMessage, 'error', 5000)
      throw error
    }
  }

  // 统一的发送视频合并请求
  const createVideoCombination = async () => {
    if (!options.projectId || !options.stageId) {
      throw new Error('Project ID and Stage ID are required')
    }

    try {
      await wsManagerEnhanced.sendCreateVideoCombination(
        Number(options.projectId),
        Number(options.stageId)
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create video combination'
      showToast(errorMessage, 'error', 5000)
      throw error
    }
  }

  // 取消视频合并
  const cancelVideoCombination = () => {
    wsManagerEnhanced.cancelVideoCombination()
    showToast('已取消合并任务', 'info', 3000)
  }

  // 订阅事件（兼容原有的事件格式）
  const subscribe = (event: string, callback: (message: WsMessage) => void) => {
    return wsManager.subscribe(event, callback)
  }

  return {
    wsState,
    createVideoClip,
    createVideoCombination,
    cancelVideoCombination,
    subscribe
  }
}

// 兼容原有的wsManager，保持向后兼容
export { wsManager } from '@/lib/websocket'

// 导出增强的WebSocket管理器供独立使用
export { wsManagerEnhanced } from '@/lib/websocket-enhanced'