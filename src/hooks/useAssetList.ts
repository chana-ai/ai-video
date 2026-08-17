import { useState, useEffect } from "react"
import { Asset } from "../app/ai/projects/value-assets/types"
import { sceneApi } from "../lib/api/scene-api"

/**
 * Custom hook for fetching and managing asset list
 */
export function useAssetList(projectId: number | undefined, stageId: number | undefined) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId || !stageId) return

    setLoading(true)
    sceneApi.listAssets(projectId, stageId, true)
      .then((res: any) => {
        setAssets(res.assets || [])
      })
      .catch((err: any) => {
        setError(err as Error)
        console.error('Failed to fetch assets:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [projectId, stageId])

  return { assets, loading, error }
}
