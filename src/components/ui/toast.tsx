"use client"

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

export function Toast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'add-toast' && data.toast) {
          setToasts(prev => [...prev, data.toast])
        } else if (data.type === 'remove-toast' && data.toastId) {
          setToasts(prev => prev.filter(t => t.id !== data.toastId))
        }
      } catch (e) {
        console.error('Failed to parse toast event:', e)
      }
    }

    window.addEventListener('message', handleToast)
    return () => window.removeEventListener('message', handleToast)
  }, [])

  useEffect(() => {
    toasts.forEach(toast => {
      setTimeout(() => {
        window.postMessage({ type: 'remove-toast', toastId: toast.id }, '*')
      }, 5000)
    })
  }, [toasts])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto max-w-sm bg-white border-l-4 shadow-lg rounded-r-lg overflow-hidden"
          style={{
            borderLeftColor: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#22c55e' : '#3b82f6'
          }}
        >
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900">{toast.message}</p>
          </div>
          <button
            onClick={() => window.postMessage({ type: 'remove-toast', toastId: toast.id }, '*')}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'error') {
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  window.postMessage(
    {
      type: 'add-toast',
      toast: { id: toastId, message, type }
    },
    '*'
  )

  // Auto-remove after 5 seconds
  setTimeout(() => {
    window.postMessage({ type: 'remove-toast', toastId: toastId }, '*')
  }, 5000)
}
