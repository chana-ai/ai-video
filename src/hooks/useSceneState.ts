import { useState, useEffect, useCallback } from "react"
import { Scene } from "../app/ai/projects/scenes/types"

/**
 * Custom hook for managing scene state with automatic sync
 */
export function useSceneState(scene: Scene) {
  const [title, setTitle] = useState(scene.title)
  const [description, setDescription] = useState(scene.description ?? '')
  const [prompt, setPrompt] = useState(scene.prompt ?? '')

  // Sync with external scene prop
  useEffect(() => {
    setTitle(scene.title)
    setDescription(scene.description ?? '')
    setPrompt(scene.prompt ?? '')
  }, [scene])

  // Handle updates
  const handleUpdate = useCallback((key: string, value: any) => {
    // Update the key directly
    switch (key) {
      case 'title':
        setTitle(value)
        break
      case 'description':
        setDescription(value)
        break
      case 'prompt':
        setPrompt(value)
        break
      default:
        // For other keys, we need to also call the parent callback
        // but we don't have access to it here
        break
    }
  }, [])

  return { title, setTitle, description, setDescription, prompt, setPrompt, handleUpdate }
}
