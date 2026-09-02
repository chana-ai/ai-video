import { useEffect } from 'react'
import config from '@/app/settings/config'
import { getUserId } from '@/lib/localcache'


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

class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private shouldReconnect: boolean = false
  private callbacks: Map<string, Set<WsCallback>> = new Map()
  private requestMap: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map()

  private appHost = config.host
  private wsUrl = `${this.appHost.replace('http://', 'ws://')}/api/v2/video/ws_connect`

  connect(projectId?: string | number, stageId?: string | number, userId?: string | number) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.shouldReconnect = true
    const ws = new WebSocket(this.wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
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
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          this.connect(projectId, stageId, userId)
        }, 5000)
      }
    }

    this.ws = ws
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
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

      const request_id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const requestPayload = {
        request_type,
        request_id,
        // project_id: payload.project_id,
        // stage_id: payload.stage_id,
        user_id: getUserId(),
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

  sendCreateVideoClip(scene_id: string | number, video_prompt: string, project_id: string | number, stage_id: string | number, user_id: string | number, image_id: number) {
    return this.sendRequest('createVideoClip', {
      scene_id,
      video_prompt,
      project_id,
      stage_id,
      image_id
    })
  }

  sendCreateVideoCombination(project_id: string | number, stage_id: string | number, scene_ids: number[]) {
    return this.sendRequest('createVideoCombination', {
      project_id,
      stage_id,
      scene_ids
    })
  }

  cancelVideoCombination() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        request_type: 'cancelVideoCombination'
      }))
    }
  }
}

export const wsManager = new WebSocketManager()

export function useWebSocket(projectId?: string | number, stageId?: string | number) {
  useEffect(() => {
    wsManager.connect(projectId, stageId)

    return () => {
      wsManager.disconnect()
    }
  }, [projectId, stageId])
}
