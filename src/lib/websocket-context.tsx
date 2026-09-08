'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getUserId } from '@/lib/localcache'
import { wsManager } from './websocket'

type WebSocketContextValue = {
  projectId?: string | number
  stageId?: string | number
  userId?: string | number
  wsManager: typeof wsManager
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

/**
 * WebSocket connection context provider for Scenes page
 * Manages WebSocket connection lifecycle ONLY for scenes page and its children
 */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined
  const stageId = searchParams.get('stage_id') ? Number(searchParams.get('stage_id')) : undefined
  const userId = getUserId() ? Number(getUserId()) : undefined

  // Use ref to prevent repeated connection attempts within this page
  const hasConnectedRef = useRef(false)

  useEffect(() => {
    // Only connect if we have valid project/stage info AND this is the scenes page
    if (!projectId || !stageId) {
      console.log('Skipping WebSocket connection - missing project_id or stage_id')
      return
    }

    // Only connect once per page load
    if (hasConnectedRef.current) {
      console.log('WebSocket already connected, skipping')
      return
    }

    hasConnectedRef.current = true

    console.log('Initializing WebSocket connection for Scenes page...', { projectId, stageId, userId })

    // Set connection callbacks
    wsManager.setConnectionCallbacks({
      onConnect: () => {
        console.log('WebSocket connected for Scenes page')
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected for Scenes page')
      },
      onError: (error) => {
        console.error('WebSocket error for Scenes page:', error)
      }
    })

    // Connect to WebSocket server
    wsManager.connect(Number(projectId), Number(stageId), userId ? Number(userId) : undefined)

    return () => {
      console.log('Cleaning up WebSocket connection for Scenes page...')
      wsManager.disconnect()
    }
  }, [projectId, stageId, userId])

  return (
    <WebSocketContext.Provider value={{ projectId, stageId, userId, wsManager }}>
      {children}
    </WebSocketContext.Provider>
  )
}

/**
 * Hook to access WebSocket client
 * Returns the wsManager instance and project/stage info
 * @throws Error if not used within WebSocketProvider
 */
export function useWebSocketManager(): WebSocketContextValue {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketManager must be used within WebSocketProvider')
  }

  return context
}

/**
 * Hook for component-level WebSocket access
 * @deprecated Use useWebSocketManager instead for better context management
 */
export function useWebSocket() {
  const { wsManager } = useWebSocketManager()
  return wsManager
}
