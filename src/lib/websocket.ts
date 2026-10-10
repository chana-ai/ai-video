import { useEffect } from 'react'
import config from '@/app/settings/config'

export interface WsMessage {
  event: string
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
  message?: string
  code?: number
  data?: any
  user_id?: string | number
}

export interface WsCallback {
  (message: WsMessage): void
}

// Connection callbacks
export interface ConnectionCallbacks {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

// Unified WebSocket client
class UnifiedWebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private shouldReconnect: boolean = false
  private connectionTimer: NodeJS.Timeout | null = null
  private connectionTimeout = 10000 // 10秒连接超时

  private callbacks: Map<string, Set<WsCallback>> = new Map()
  private connectionCallbacks: ConnectionCallbacks = {}

  private appHost = config.host
  private wsUrl = `${this.appHost.replace('http://', 'ws://')}/api/v2/video/ws_connect`

  // Connection status
  private isConnectedRef = { current: false }

  // Current connection context
  private currentProjectId?: string | number
  private currentStageId?: string | number
  private currentUserId?: string | number

  /**
   * Connect to WebSocket server
   */
  connect(projectId?: string | number, stageId?: string | number, userId?: string | number) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    this.shouldReconnect = true
    this.currentProjectId = projectId
    this.currentStageId = stageId
    this.currentUserId = userId

    console.log('Connecting to WebSocket server...', { projectId, stageId, userId })

    const ws = new WebSocket(this.wsUrl)

    // Connection timeout
    this.connectionTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        // console.error('WebSocket connection timeout')
        if (this.connectionCallbacks.onError) {
          this.connectionCallbacks.onError(new Event('timeout'))
        }
      }
    }, this.connectionTimeout)

    ws.onopen = () => {
      console.log('WebSocket connected successfully')
      const initMessage = {
        user_id: userId,
        project_id: projectId,
        stage_id: stageId,
      }
      ws.send(JSON.stringify(initMessage))
      this.isConnectedRef.current = true

      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer)
        this.connectionTimer = null
      }

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
        const message: any = JSON.parse(event.data)

        const eventType = message.eventtype || message.event

        if (eventType == "ping") {
          return
        }
        console.log('WebSocket message received:', message.eventtype || message.event, message)

        // For non-ping messages, validate that project_id, stage_id, user_id match current connection
        if (message.project_id !== undefined &&
          message.project_id !== this.currentProjectId) {
          console.log('Discarding WebSocket message for different project:',
            'message.project_id:', message.project_id,
            'currentProjectId:', this.currentProjectId)
          return
        }

        if (
          message.stage_id !== undefined &&
          message.stage_id !== this.currentStageId) {
          console.log('Discarding WebSocket message for different stage:',
            'message.stage_id:', message.stage_id,
            'currentStageId:', this.currentStageId)
          return
        }

        if (message.user_id !== undefined &&
          message.user_id !== this.currentUserId) {
          console.log('Discarding WebSocket message for different user:',
            'message.user_id:', message.user_id,
            'currentUserId:', this.currentUserId)
          return
        }

        // Call all callbacks for this event type
        const eventCallbacks = this.callbacks.get(eventType) || new Set()
        eventCallbacks.forEach(callback => callback(message))
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnectedRef.current = false

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
        wasClean: event.wasClean
      })
      this.isConnectedRef.current = false

      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer)
        this.connectionTimer = null
      }

      if (this.connectionCallbacks.onDisconnect) {
        this.connectionCallbacks.onDisconnect()
      }

      // Auto reconnect if enabled
      if (this.shouldReconnect) {
        console.log('Scheduling reconnection in 5 seconds...')
        this.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          this.connect(projectId, stageId, userId)
        }, 5000)
      }
    }

    this.ws = ws
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.shouldReconnect = false

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // Clear connection timer
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    // Close WebSocket connection
    if (this.ws) {
      try {
        this.ws.close()
      } catch (error) {
        console.warn('Error closing WebSocket:', error)
      }
      this.ws = null
    }

    this.isConnectedRef.current = false
    console.log('WebSocket disconnected')
  }

  /**
   * Subscribe to WebSocket events
   * @returns Unsubscribe function
   */
  subscribe(event: string, callback: WsCallback): () => void {
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

  /**
   * Set connection callbacks
   */
  setConnectionCallbacks(callbacks: ConnectionCallbacks) {
    this.connectionCallbacks = { ...this.connectionCallbacks, ...callbacks }
  }

  /**
   * Send createVideoClip request
   * @deprecated Use createVideoClip instead (keep for backward compatibility)
   */
  sendCreateVideoClip(sceneId: number, videoPrompt: string, imageId: number): Promise<WsMessage> {
    return this.createVideoClip(sceneId, videoPrompt, imageId)
  }

  /**
   * Send createVideoClip request
   */
  createVideoClip(sceneId: number, videoPrompt: string, imageId: number, projectId?: string | number, stageId?: string | number, userId?: string | number): Promise<WsMessage> {
    return new Promise((_resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      const payload: any = {
        request_type: 'createVideoClip',
        scene_id: sceneId,
        video_prompt: videoPrompt,
        image_id: imageId,
        project_id: projectId ? Number(projectId) : undefined,
        stage_id: stageId ? Number(stageId) : undefined,
        user_id: userId ? Number(userId) : undefined,
      }

      console.log('Sending createVideoClip request:', payload)

      this.ws.send(JSON.stringify(payload))
    })
  }

  /**
   * Send createVideoCombination request
   * @param sceneIds - Array of scene IDs to combine
   * @param projectId - Project ID
   * @param stageId - Stage ID
   * @param userId - User ID
   */
  createVideoCombination(sceneIds: number[], projectId?: string | number, stageId?: string | number, userId?: string | number): Promise<WsMessage> {
    return new Promise((_resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      const payload = {
        request_type: 'createVideoCombination',
        scene_ids: sceneIds,
        project_id: projectId ? Number(projectId) : this.currentProjectId,
        stage_id: stageId ? Number(stageId) : this.currentStageId,
        user_id: userId ? Number(userId) : this.currentUserId
      }

      console.log('Sending createVideoCombination request:', payload)

      this.ws.send(JSON.stringify(payload))
    })
  }

  /**
   * Execute action with retry logic
   * @param actionType - Type of action ('videoClip' or 'videoCombination')
   * @param payload - Request payload
   * @param options - Retry options
   */
  async executeAction(
    actionType: 'videoClip' | 'videoCombination',
    payload: any,
    options?: { timeout?: number; retryCount?: number; retryDelay?: number }
  ): Promise<WsMessage> {
    const finalOptions = {
      timeout: 30000,
      retryCount: 1,
      retryDelay: 1000,
      ...options
    }

    const executeWithRetry = async (retryCount = 0): Promise<WsMessage> => {
      try {
        if (actionType === 'videoClip') {
          return await this.createVideoClip(
            payload.scene_id,
            payload.video_prompt,
            payload.image_id,
            payload.project_id,
            payload.stage_id,
            payload.user_id
          )
        } else {
          return await this.createVideoCombination(
            payload.scene_ids || [],
            payload.project_id,
            payload.stage_id,
            payload.user_id
          )
        }
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

  /**
   * Cancel video combination
   */
  cancelVideoCombination(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Cancelling video combination')
      this.ws.send(JSON.stringify({
        request_type: 'cancelVideoCombination'
      }))
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.isConnectedRef.current && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get WebSocket state info (for debugging)
   */
  getConnectionInfo() {
    return {
      url: this.wsUrl,
      readyState: this.ws?.readyState,
      isConnected: this.isConnected,
      hasConnectionTimer: !!this.connectionTimer,
      hasReconnectTimer: !!this.reconnectTimer
    }
  }

  /**
   * Get current connection context for validation
   */
  getConnectionContext() {
    return {
      projectId: this.currentProjectId,
      stageId: this.currentStageId,
      userId: this.currentUserId
    }
  }
}

// Singleton instance
export const wsManager = new UnifiedWebSocketManager()

/**
 * Hook for WebSocket connection management
 * @param projectId - Project ID
 * @param stageId - Stage ID
 * @param userId - User ID
 */
export function useWebSocket(projectId?: string | number, stageId?: string | number, userId?: string | number) {
  useEffect(() => {
    wsManager.connect(projectId, stageId, userId)

    return () => {
      wsManager.disconnect()
    }
  }, [projectId, stageId, userId])
}
