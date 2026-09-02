import { useEffect } from 'react'
import config from '@/app/settings/config'

export interface WsMessage {
  event: string
  request_id?: string
  data?: any
  message?: string
  code?: number
  task_id?: string
  result_url?: string
  result?: any
  project_id?: string | number
  stage_id?: string | number
  scene_id?: string | number
  progress?: number
  processed?: number
  total?: number
  current_processing?: string
}

export interface WsCallback {
  (message: WsMessage): void
}

interface ActionCallbacks {
  onActionStart?: (action: string, taskId?: string) => void
  onActionProgress?: (action: string, progress: number, processed: number, total: number) => void
  onActionComplete?: (action: string, result?: any) => void
  onActionError?: (action: string, error: string) => void
}

interface ConnectionCallbacks {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

interface ActionOptions {
  timeout?: number
  retryCount?: number
  retryDelay?: number
}

class EnhancedWebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private connectionTimer: NodeJS.Timeout | null = null
  private shouldReconnect: boolean = false
  private callbacks: Map<string, Set<WsCallback>> = new Map()
  private requestMap: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map()
  private actionCallbacks: ActionCallbacks = {}
  private actionOptions: ActionOptions = {}
  private connectionCallbacks: ConnectionCallbacks = {}

  private appHost = config.host
  private wsUrl = `${this.appHost.replace('http://', 'ws://')}/api/v2/video/ws_connect`
  private connectionTimeout = 10000 // 10秒连接超时

  setConnectionCallbacks(callbacks: ConnectionCallbacks) {
    this.connectionCallbacks = callbacks
  }

  // 设置连接超时时间
  setConnectionTimeout(timeout: number) {
    this.connectionTimeout = timeout
  }

  connect(projectId?: string | number, stageId?: string | number, userId?: string | number) {
    console.log('WebSocket connect called with:', { projectId, stageId, userId })
    console.log('Current WebSocket state:', this.getConnectionInfo())

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping')
      return
    }

    // 清理旧的连接
    if (this.ws) {
      try {
        console.log('Closing existing WebSocket connection')
        this.ws.close()
      } catch (error) {
        console.warn('Error closing old WebSocket:', error)
      }
      this.ws = null
    }

    // 清理旧的定时器
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    this.shouldReconnect = true
    console.log('Creating new WebSocket connection to:', this.wsUrl)
    console.log('Connection timeout set to:', this.connectionTimeout, 'ms')

    try {
      const ws = new WebSocket(this.wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        // 清理连接超时定时器
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer)
          this.connectionTimer = null
        }
        // 清理重连定时器
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
        if (this.connectionCallbacks.onConnect) {
          this.connectionCallbacks.onConnect()
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data)

          // Call all callbacks for this event type
          const eventCallbacks = this.callbacks.get(message.event) || new Set()
          eventCallbacks.forEach(callback => callback(message))

          // Handle request responses
          if (message.request_id && this.requestMap.has(message.request_id)) {
            const { resolve, reject } = this.requestMap.get(message.request_id)!
            if (message.code === 0 && message.event?.endsWith('Complete')) {
              resolve(message)
            } else {
              reject(message)
            }
            this.requestMap.delete(message.request_id)
          }

          // Handle action callbacks
          this.handleActionCallback(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error event:', {
          type: 'error',
          readyState: ws.readyState,
          url: ws.url
        })
        // 清理连接超时定时器
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer)
          this.connectionTimer = null
        }
        if (this.connectionCallbacks.onError) {
          this.connectionCallbacks.onError(error)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          readyState: ws.readyState
        })
        // 清理连接超时定时器
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer)
          this.connectionTimer = null
        }
        if (this.connectionCallbacks.onDisconnect) {
          this.connectionCallbacks.onDisconnect()
        }
        if (this.shouldReconnect) {
          console.log('Scheduling reconnect in 5 seconds...')
          this.reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...')
            this.connect(projectId, stageId, userId)
          }, 5000)
        }
      }

      this.ws = ws

      // 设置连接超时
      this.connectionTimer = setTimeout(() => {
        console.error('WebSocket connection timeout after', this.connectionTimeout, 'ms')
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('Closing WebSocket due to connection timeout')
          try {
            ws.close()
          } catch (error) {
            console.warn('Error closing WebSocket on timeout:', error)
          }
          if (this.connectionCallbacks.onError) {
            this.connectionCallbacks.onError(new Event('timeout'))
          }
        }
      }, this.connectionTimeout)

    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      if (this.connectionCallbacks.onError) {
        this.connectionCallbacks.onError(error as Event)
      }
    }
  }

  disconnect() {
    this.shouldReconnect = false

    // 清理所有定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    // 关闭WebSocket连接
    if (this.ws) {
      try {
        this.ws.close()
      } catch (error) {
        console.warn('Error closing WebSocket:', error)
      }
      this.ws = null
    }
  }

  subscribe(event: string, callback: WsCallback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set())
    }
    this.callbacks.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(event)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.callbacks.delete(event)
        }
      }
    }
  }

  sendRequest(
    request_type: 'createVideoClip' | 'createVideoCombination',
    payload: any,
    timeout = 30000
  ): Promise<WsMessage> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      const request_id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      const requestPayload = {
        request_type,
        request_id,
        ...payload
      }

      this.requestMap.set(request_id, { resolve, reject })

      this.ws.send(JSON.stringify(requestPayload))

      // Set timeout
      setTimeout(() => {
        if (this.requestMap.has(request_id)) {
          this.requestMap.delete(request_id)
          reject(new Error('Request timeout'))
        }
      }, timeout)
    })
  }

  sendCreateVideoClip(scene_id: string | number, video_prompt: string, project_id: string | number, stage_id: string | number, _user_id: string | number, image_id: number) {
    return this.sendRequest('createVideoClip', {
      scene_id,
      video_prompt,
      project_id,
      stage_id,
      image_id
    })
  }

  sendCreateVideoCombination(project_id: string | number, stage_id: string | number) {
    return this.sendRequest('createVideoCombination', {
      project_id,
      stage_id
    })
  }

  cancelVideoCombination() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        request_type: 'cancelVideoCombination'
      }))
    }
  }

  // 设置action回调
  setActionCallbacks(callbacks: ActionCallbacks) {
    this.actionCallbacks = { ...this.actionCallbacks, ...callbacks }
  }

  // 设置action选项
  setActionOptions(options: ActionOptions) {
    this.actionOptions = { ...this.actionOptions, ...options }
  }

  // 获取连接状态
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // 获取appHost（用于测试连接）
  get host(): string {
    return this.appHost
  }

  // 获取WebSocket状态信息
  getConnectionInfo() {
    return {
      url: this.wsUrl,
      readyState: this.ws?.readyState,
      isConnected: this.isConnected,
      hasConnectionTimer: !!this.connectionTimer,
      hasReconnectTimer: !!this.reconnectTimer
    }
  }

  // 处理action回调
  private handleActionCallback(message: WsMessage) {
    const { event } = message

    // Determine action type from event
    let actionType = ''
    if (event.startsWith('createVideoClip')) {
      actionType = 'videoClip'
    } else if (event.startsWith('createVideoCombination')) {
      actionType = 'videoCombination'
    }

    if (!actionType) return

    // Call appropriate callback
    switch (event) {
      case 'createVideoClipAccepted':
      case 'createVideoCombinationAccepted':
        this.actionCallbacks.onActionStart?.(actionType, message.task_id)
        break

      case 'createVideoClipProgress':
      case 'createVideoCombinationProgress':
        this.actionCallbacks.onActionProgress?.(
          actionType,
          message.progress || 0,
          message.processed || 0,
          message.total || 0
        )
        break

      case 'createVideoClipComplete':
      case 'createVideoCombinationComplete':
        this.actionCallbacks.onActionComplete?.(actionType, message)
        break

      case 'createVideoClipError':
      case 'createVideoCombinationError':
        this.actionCallbacks.onActionError?.(actionType, message.message || 'Unknown error')
        break
    }
  }

  // 执行action的统一方法
  async executeAction(
    actionType: 'videoClip' | 'videoCombination',
    payload: any,
    options?: ActionOptions
  ): Promise<WsMessage> {
    const finalOptions = { ...this.actionOptions, ...options }

    // 模拟重试逻辑
    const executeWithRetry = async (retryCount = 0): Promise<WsMessage> => {
      try {
        let result: WsMessage
        if (actionType === 'videoClip') {
          result = await this.sendCreateVideoClip(
            payload.scene_id,
            payload.video_prompt,
            payload.project_id,
            payload.stage_id,
            payload.user_id,
            payload.image_id
          )
        } else {
          result = await this.sendCreateVideoCombination(
            payload.project_id,
            payload.stage_id
          )
        }
        return result
      } catch (error) {
        if (retryCount < (finalOptions.retryCount || 3)) {
          await new Promise(resolve => setTimeout(resolve, finalOptions.retryDelay || 1000))
          return executeWithRetry(retryCount + 1)
        }
        throw error
      }
    }

    return executeWithRetry()
  }
}

// 创建增强的WebSocket管理器实例
export const wsManagerEnhanced = new EnhancedWebSocketManager()

// 创建统一的WebSocket Hook
export function useEnhancedWebSocket(
  projectId?: string | number,
  stageId?: string | number,
  userId?: string | number,
  actionCallbacks?: ActionCallbacks,
  actionOptions?: ActionOptions
) {
  useEffect(() => {
    if (projectId && stageId) {
      wsManagerEnhanced.connect(projectId, stageId, userId)
      wsManagerEnhanced.setActionCallbacks(actionCallbacks || {})
      wsManagerEnhanced.setActionOptions(actionOptions || {})
    }

    return () => {
      wsManagerEnhanced.disconnect()
    }
  }, [projectId, stageId, userId, actionCallbacks, actionOptions])

  return wsManagerEnhanced
}