/**
 * Toast helper functions using postMessage
 * This allows triggering toasts from any context (iframe, popup, etc.)
 */

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'error', duration: number = 5000) {
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Send to main window (for iframes)
  window.parent.postMessage(
    {
      type: 'add-toast',
      toast: { id: toastId, message, type }
    },
    '*'
  )

  // Also send to current window (for inline usage)
  window.postMessage(
    {
      type: 'add-toast',
      toast: { id: toastId, message, type }
    },
    '*'
  )

  // Auto-remove after duration
  setTimeout(() => {
    window.postMessage(
      {
        type: 'remove-toast',
        toastId: toastId
      },
      '*'
    )
  }, duration)
}
