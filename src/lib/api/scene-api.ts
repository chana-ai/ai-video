import { instance } from "@/lib/axios"

/**
 * Scene API utilities for reusable API calls
 */
export const sceneApi = {
  /**
   * Fetch all assets for a project/stage
   */
  listAssets(projectId: number, stageId: number, withImage: boolean = false) {
    return instance.get(`/api/v2/asset/list`, {
      params: { project_id: projectId, stage_id: stageId, with_image: withImage }
    })
  },

  /**
   * Generate scene image from prompt
   */
  generateSceneImage(sceneId: number, projectId: number, stageId: number, prompt: string) {
    return instance.post('/api/v2/scene/generateSceneImage', {
      scene_id: sceneId,
      project_id: projectId,
      stage_id: stageId,
      prompt
    })
  },

  /**
   * Update scene data
   */
  updateScene(id: number, projectId: number, stageId: number, data: any) {
    return instance.post('/api/v2/scene/update', {
      id,
      project_id: projectId,
      stage_id: stageId,
      ...data
    })
  },

  /**
   * Fetch scene details
   */
  getSceneDetails(projectId: number, stageId: number, sceneIds: number[]) {
    return instance.post('/api/v2/scene/details', {
      project_id: projectId,
      stage_id: stageId,
      scene_ids: sceneIds
    })
  },

  /**
   * Fetch project detail
   */
  getProjectDetail(projectId: number, stageId: number) {
    return instance.get(`/api/v2/project/detail`, {
      params: { project_id: projectId, stage_id: stageId }
    })
  }
}
