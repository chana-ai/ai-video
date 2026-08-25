"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { SceneCard, StoryboardCard } from "./components/scene-card"
import { SceneSettings } from "@/components/scene-settings"
import { StoryboardSettings } from "./components/storyboard-settings"
import type { Scene, ProjectDetail, VoiceSettings, CombinedVideo } from "@/app/ai/projects/types"
import Header from "../../header"
import instance from "@/lib/axios"
import { useSearchParams } from "next/navigation"

import ExportUrlPanel from "./components/export_url_panel"
import { MultiVideoDisplayPanel } from "./components/multi-video-display-panel"
import { wsManager, type WsMessage } from "@/lib/websocket"
import { showToast } from "@/lib/toast-helpers"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SelectedItem =
  | { type: "scene"; data: Scene }
  | { type: "storyboard"; data: Scene }

// ── Helper: Sort items by linked list (pre_seq_id / next_seq_id) ────────────
function sortLinkedList<T extends { id: number; pre_seq_id: number; next_seq_id: number }>(items: T[]): T[] {
  if (items.length <= 1) return items
  const map = new Map(items.map(i => [i.id, i]))
  // Find all items that are either marked as heads (-1) or whose predecessor is missing from this list
  const heads = items.filter(i => i.pre_seq_id === -1 || !map.has(i.pre_seq_id))

  const res: T[] = []
  const seen = new Set<number>()

  heads.forEach(head => {
    let curr: T | undefined = head
    while (curr && !seen.has(curr.id)) {
      res.push(curr)
      seen.add(curr.id)
      curr = map.get(curr.next_seq_id)
      if (res.length > items.length + 10) break
    }
  })

  // Catch any remaining orphans just in case
  items.forEach(item => {
    if (!seen.has(item.id)) {
      res.push(item)
      seen.add(item.id)
    }
  })

  return res
}

export default function ScenePage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [expandedSceneIds, setExpandedSceneIds] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<SelectedItem | null>(null)

  // Memoize sorted scenes to keep linked list order across the entire project
  const sortedScenes = useMemo(() => sortLinkedList(scenes), [scenes])

  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const scenesContainerRef = useRef<HTMLDivElement>(null)

  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  const stageId = searchParams.get('stage_id')

  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null)
  const [voiceMenu, setVoiceMenu] = useState<{ [key: string]: string }>({})

  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false)
  const [subtitle, setSubtitle] = useState<string>()

  const [showExportUrlPanel, setShowExportUrlPanel] = useState(false)

  const [isPreviewingVideo, setIsPreviewingVideo] = useState(false)
  const [combinedVideos, setCombinedVideos] = useState<CombinedVideo[]>([])
  const [isCombiningTaskRunning, setIsCombiningTaskRunning] = useState(false)
  const [combine_error_message, setCombineErrorMessage] = useState<string>()

  // ─── Data loading ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId || !stageId) return

    // Connect WebSocket
    wsManager.connect(projectId, stageId, projectDetail?.user_id)

    return () => {
      wsManager.disconnect()
    }
  }, [projectId, stageId])

  useEffect(() => {
    if (!projectId || !stageId) return

    instance.get(`/api/v2/scene/list?project_id=${projectId}&stage_id=${stageId}`)
      .then((res: any) => {
        const flat_scenes: Scene[] = res || []
        // Group storyboards into children lists for scenes
        const scene_map = new Map<number, Scene>()
        const top_level: Scene[] = []

        flat_scenes.forEach(s => {
          s.children = []
          scene_map.set(s.id, s)
        })

        flat_scenes.forEach(s => {
          if (s.storyboard && s.parent_id !== null) {
            const parent = scene_map.get(s.parent_id)
            if (parent) {
              parent.children = [...(parent.children || []), s.id]
            }
          } else {
            top_level.push(s)
          }
        })

        setScenes(flat_scenes)
        if (top_level.length > 0) {
          setSelected({ type: "scene", data: top_level[0] })
          handleSceneSelect(top_level[0])
        }
      })

    instance.get(`/api/v2/project/detail?project_id=${projectId}&stage_id=${stageId}`)
      .then((res: any) => {
        setProjectDetail(res as ProjectDetail)

      })
      .catch((err) => console.error('Failed to load project detail:', err))


  }, [projectId, stageId, projectDetail?.user_id])

  // Subscribe to WebSocket events for video clip and combination generation
  useEffect(() => {
    if (!projectId || !stageId || !projectDetail?.user_id) return

    // Subscribe to createVideoClip events
    const unsubscribeClip = wsManager.subscribe('createVideoClipAccepted', (message: WsMessage) => {
      console.log('createVideoClipAccepted:', message)
      if (message.task_id && message.scene_id) {
        // Update the specific scene with the task_id
        setScenes(prev => prev.map(s => {
          if (s.id === Number(message.scene_id)) {
            return { ...s, config: { ...s.config, video_task_id: message.task_id } }
          }
          return s
        }))
      }
    })

    const unsubscribeClipComplete = wsManager.subscribe('createVideoClipComplete', async (message: WsMessage) => {
      console.log('createVideoClipComplete:', message)
      if (message.data && message.data.video_url) {
        // Fetch updated scene details
        if (!projectId || !stageId) return
        const sceneIds = [selected?.data.id].filter(Boolean) as number[]

        instance.post('/api/v2/scene/details', {
          project_id: Number(projectId),
          stage_id: Number(stageId),
          scene_ids: sceneIds
        }).then((res: any) => {
          if (!Array.isArray(res)) return

          const mergeDetail = (node: Scene): Scene => {
            const detail = res.find((d: any) => d.scene_id === node.id)
            if (!detail) return node

            return {
              ...node,
              video_url: detail.resource?.video_url ?? node.video_url,
              image_url: detail.resource?.storyboard_image_url ?? node.image_url,
            }
          }

          setScenes(prev => prev.map(s => {
            if (sceneIds.includes(s.id)) {
              return mergeDetail(s)
            }
            return s
          }))

          // Update selection if it matches
          setSelected(prev => {
            if (!prev) return prev
            if (sceneIds.includes(prev.data.id)) {
              return { ...prev, data: mergeDetail(prev.data) }
            }
            return prev
          })
        }).catch(err => console.error('Failed to fetch scene details after clip completion:', err))
      }
    })

    // Subscribe to createVideoCombination events
    const unsubscribeCombinationAccepted = wsManager.subscribe('createVideoCombinationAccepted', (message: WsMessage) => {
      console.log('createVideoCombinationAccepted:', message)
      if (message.task_id) {
        setIsCombiningTaskRunning(true)
      }
    })

    const unsubscribeCombinationComplete = wsManager.subscribe('createVideoCombinationComplete', async (message: WsMessage) => {
      console.log('createVideoCombinationComplete:', message)
      if (message.result_url) {
        // Fetch updated project combine videos
        if (!projectId || !stageId) return
        instance.get(`/api/v2/project/get_project_combine_videos?project_id=${projectId}&stage_id=${stageId}`)
          .then((res: any) => { if (res.videos.length > 0) setCombinedVideos(res.videos) })
          .catch((err) => console.error('Failed to fetch combine videos:', err))
      }
    })

    // Subscribe to error events
    const unsubscribeClipError = wsManager.subscribe('createVideoClipError', (message: WsMessage) => {
      console.error('createVideoClipError:', message)
      const errorMsg = message.message || '视频生成失败，请稍后重试'
      showToast(errorMsg, 'error')
      setIsGeneratingVideo(false)
    })

    const unsubscribeCombinationError = wsManager.subscribe('createVideoCombinationError', (message: WsMessage) => {
      console.error('createVideoCombinationError:', message)
      const errorMsg = message.message || '视频合并失败，请稍后重试'
      showToast(errorMsg, 'error')
      setIsCombiningTaskRunning(false)
      setCombineErrorMessage(errorMsg)
    })

    return () => {
      unsubscribeClip()
      unsubscribeClipComplete()
      unsubscribeCombinationAccepted()
      unsubscribeCombinationComplete()
      unsubscribeClipError()
      unsubscribeCombinationError()
    }
  }, [projectId, stageId, projectDetail?.user_id, selected?.data.id])

  // ─── Scroll ─────────────────────────────────────────────────────────────────

  const handleScroll = (direction: "up" | "down") => {
    if (scenesContainerRef.current) {
      scenesContainerRef.current.scrollBy({ top: direction === "up" ? -100 : 100, behavior: "smooth" })
    }
  }

  // ─── DnD ────────────────────────────────────────────────────────────────────

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    const items = Array.from(scenes)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setScenes(items)
  }

  // ─── selection (with expand/fold) ────────────────────────────────────

  const handleSceneSelect = (scene: Scene) => {
    const isAlreadySelected = selected?.type === "scene" && selected.data.id === scene.id
    if (isAlreadySelected) {
      setExpandedSceneIds((prev) => {
        const next = new Set(prev)
        if (next.has(scene.id)) next.delete(scene.id)
        else next.add(scene.id)
        return next
      })
    } else {
      setSelected({ type: "scene", data: scene })
      setExpandedSceneIds((prev) => new Set(prev).add(scene.id))
    }

    // ── Fetch full details for this scene + its child storyboards ────────────
    if (!projectId || !stageId) return
    const sceneIds = [scene.id, ...(scene.children || [])]
    instance.post('/api/v2/scene/details', {
      project_id: Number(projectId),
      stage_id: Number(stageId),
      scene_ids: sceneIds
    }).then((res: any) => {
      // res is expected to be an array: SceneDetails[]
      if (!Array.isArray(res)) return

      const mergeDetail = (node: Scene): Scene => {
        const detail = res.find((d: any) => d.scene_id === node.id)
        if (!detail) return node

        return {
          ...node,
          doc_id: detail.doc_id ?? node.doc_id,
          description: detail.description ?? node.description,
          config: detail.config ?? node.config,

          video_url: detail.resource?.video_url ?? node.video_url,
          voice_url: detail.resource?.voice_url ?? node.voice_url,
          image_url: detail.resource?.storyboard_image_url ?? node.image_url,
          image_urls: detail.resource?.scene_image_urls ? Object.values(detail.resource.scene_image_urls) as string[] : node.image_urls,

          prompt: detail.image_prompt ?? node.prompt,
          video_prompt: detail.video_prompt ?? node.video_prompt,
          image_prompt_history: detail.image_prompt_history ?? node.image_prompt_history,
          video_prompt_history: detail.video_prompt_history ?? node.video_prompt_history,
          extra_data: detail.extra_data,
          version: detail.version,
        }
      }

      setScenes(prev => prev.map(s => {
        if (sceneIds.includes(s.id)) {
          return mergeDetail(s)
        }
        return s
      }))

      // Update selection with newly fetched details
      setSelected(prev => {
        if (!prev) return prev
        if (sceneIds.includes(prev.data.id)) {
          return { ...prev, data: mergeDetail(prev.data) }
        }
        return prev
      })
    }).catch(err => console.error('Failed to fetch scene details:', err))
  }

  const handleStoryboardSelect = (storyboard: Scene) => {
    setSelected({ type: "storyboard", data: storyboard })
  }

  // ─── Update Handlers ────────────────────────────────────────────────────────

  const handleUpdate = async (type: "scene" | "storyboard", item: any, key: string, value: any) => {
    // 1. Update backend if it's a persistent key
    const persistentKeys = ["title", "description", "video_setting", "character_ids", "scene_image_id", "resource_id", "video_url"]
    if (persistentKeys.includes(key)) {
      const endpoint = '/api/v2/scene/update'
      const data: any = { id: item.id, project_id: projectId, stage_id: stageId }
      data[key] = value

      instance.post(endpoint, data)
        .then(() => console.log(`${type} updated.`))
        .catch(err => console.error(`Error updating ${type}:`, err))
    }

    // 2. Update local state
    const updateNode = (node: any) => {
      if (key === "video_setting") {
        return {
          ...node,
          config: {
            ...node.config,
            video_settings: {
              ...node.config?.video_settings,
              ...value
            }
          }
        }
      }
      if (key === "voice_setting") {
        return {
          ...node,
          config: {
            ...node.config,
            voice_settings: {
              ...node.config?.voice_settings,
              ...value
            }
          }
        }
      }
      if (key === "dialogue") {
        return {
          ...node,
          config: {
            ...node.config,
            dialogue: value
          }
        }
      }
      if (key === "image_prompt") {
        return { ...node, prompt: value }
      }
      if (key === "video_url") {
        return {
          ...node,
          video_url: value
        }
      }
      return { ...node, [key]: value }
    }

    setScenes(prev => prev.map(s => s.id === item.id ? updateNode(s) : s))

    // Update selection if it matches
    setSelected(prev => {
      if (!prev || prev.data.id !== item.id) return prev
      return { ...prev, data: updateNode(prev.data) }
    })
  }

  // ─── Action Handlers ────────────────────────────────────────────────────────

  const handleCombineVideo = async () => {
    try {
      await wsManager.sendCreateVideoCombination(Number(projectId), Number(stageId))
      setIsCombiningTaskRunning(true)
    } catch (error: any) {
      setIsCombiningTaskRunning(false)
      setCombineErrorMessage(error.message || '视频合并失败')
    }
  }

  const handleSceneAdd = async (scene: Scene) => {
    instance.post('/api/v2/scene/add', { project_id: projectId, stage_id: stageId, scene_id: scene.id })
      .then((res: any) => {
        const newScene: Scene = {
          id: res.id, title: res.title,
          status: "INIT",
          storyboard: false,
          parent_id: null,
          image_status: false, clip_status: false, voice_status: false,
          del: false,
          create_time: new Date().toISOString(), update_time: new Date().toISOString(),
          project_id: Number(scene.project_id) || 0,
          stage_id: Number(scene.stage_id) || 0,
          seq_id: res.seq_id, pre_seq_id: res.pre_seq_id, next_seq_id: res.next_seq_id,
          video_setting: { model: "", camera: "frame", duration: "", motion: "" },
          children: []
        }
        const index = scenes.findIndex((s) => s.id === scene.id)
        const newScenes = [...scenes]
        newScenes.splice(index + 1, 0, newScene)
        setScenes(newScenes)
      })
      .catch((error) => console.error('Add Scene Error:', error))
  }

  const handleAddStoryboard = (parentScene: Scene, afterStoryboard?: Scene) => {
    const existingBoards = parentScene.children || []
    const newBoard: Scene = {
      id: Date.now(), // temp id until backend confirms
      title: `Storyboard ${existingBoards.length + 1}`,
      status: 'INIT',
      storyboard: true,
      parent_id: parentScene.id,
      image_status: false, clip_status: false, voice_status: false,
      del: false,
      create_time: new Date().toISOString(), update_time: new Date().toISOString(),
      project_id: parentScene.project_id, stage_id: parentScene.stage_id,
      seq_id: existingBoards.length, pre_seq_id: -1, next_seq_id: -1,
      video_setting: { model: "", camera: "frame", duration: "", motion: "" },
      children: []
    }

    setScenes(prev => {
      const updated = [...prev, newBoard]
      return updated.map(s => {
        if (s.id === parentScene.id) {
          return { ...s, children: [...(s.children || []), newBoard.id] }
        }
        return s
      })
    })
    setExpandedSceneIds(prev => new Set(prev).add(parentScene.id))
    setSelected({ type: "storyboard", data: newBoard })
  }


  const handleGenerateStoryboards = (parentScene: Scene) => {
    if (!projectId || !stageId || !projectDetail?.user_id) return

    instance.post('/api/v2/scene/generate_storyboards', {
      project_id: projectId,
      stage_id: stageId,
      scene_id: parentScene.id,
      user_id: projectDetail.user_id,
      storyboard_no: 5
    }).then((res: any) => {
      if (!Array.isArray(res)) return

      const newStoryboards: Scene[] = res
        .filter((detail: any) => detail.scene_id !== parentScene.id) // Only storyboards
        .map((detail: any) => ({
          id: detail.scene_id,
          title: detail.title || `AI Storyboard ${detail.scene_id}`,
          seq_id: detail.seq_id || 0,
          pre_seq_id: detail.pre_seq_id || -1,
          next_seq_id: detail.next_seq_id || -1,
          project_id: Number(projectId),
          stage_id: Number(stageId),
          status: detail.status || "INIT",
          storyboard: true,
          parent_id: parentScene.id,
          image_status: false, clip_status: false, voice_status: false,
          del: false,
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),

          doc_id: detail.doc_id,
          description: detail.description,
          config: detail.config,

          video_url: detail.resource?.video_url,
          voice_url: detail.resource?.voice_url,
          image_url: detail.resource?.storyboard_image_url,
          image_urls: detail.resource?.scene_image_urls ? Object.values(detail.resource.scene_image_urls) as string[] : [],

          prompt: detail.image_prompt,
          video_prompt: detail.video_prompt,
          extra_data: detail.extra_data,
          version: detail.version,
          children: []
        }))

      const newIds = newStoryboards.map(s => s.id)

      setScenes(prev => {
        const nextList = [...prev, ...newStoryboards]
        return nextList.map(s => {
          if (s.id === parentScene.id) {
            return {
              ...s,
              children: Array.from(new Set([...(s.children || []), ...newIds]))
            }
          }
          return s
        })
      })

      // Expand the current scene to see the new storyboards
      setExpandedSceneIds(prev => new Set(prev).add(parentScene.id))
    }).catch(err => console.error('Failed to generate storyboards:', err))
  }

  const handleSceneDelete = async (scene: Scene) => {
    instance.post('/api/v2/scene/delete', { project_id: projectId, stage_id: stageId, scene_id: scene.id })
      .then(() => {
        setScenes(scenes.filter((s) => s.id !== scene.id))
        if (selected?.type === "scene" && selected.data.id === scene.id) setSelected(null)
      })
  }

  const handleStoryboardDelete = (storyboard: Scene) => {
    setScenes(prev => prev
      .filter(s => s.id !== storyboard.id)
      .map(s => {
        if (s.id === storyboard.parent_id) {
          return { ...s, children: (s.children || []).filter(id => id !== storyboard.id) }
        }
        return s
      })
    )
    if (selected?.type === "storyboard" && selected.data.id === storyboard.id) setSelected(null)
  }

  return (
    <>
      <Header title="Project Scenes" />
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-grow flex overflow-hidden">
          {/* ── Sidebar ── */}
          <div className="w-100 p-4 overflow-y-auto border-r bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Scenes</h2>
              <div className="flex gap-2 items-center">
                {/* <Mic className="h-4 w-4 text-gray-400 cursor-pointer" onClick={() => setIsVoiceSettingsOpen(true)} /> */}
                <Button size="sm" variant="outline" className="bg-green-600 text-white hover:bg-green-700 hover:text-white" onClick={() => setShowExportUrlPanel(true)}>Export</Button>
                <Button size="sm" variant="outline" onClick={handleCombineVideo} disabled={isCombiningTaskRunning}>
                  {isCombiningTaskRunning ? "Merging..." : "Merge"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsPreviewingVideo(true)} disabled={combinedVideos.length === 0}>
                  Preview
                </Button>
              </div>
            </div>
            {combine_error_message && <div className="text-red-500 text-xs mb-2">{combine_error_message}</div>}

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="scenes">
                {(provided) => (
                  <div
                    ref={(el) => { provided.innerRef(el); (scenesContainerRef as any).current = el }}
                    {...provided.droppableProps}
                    className="space-y-3"
                  >
                    {/* Use globally sorted scenes then filter for top-level display */}
                    {sortedScenes.filter((s: Scene) => !s.storyboard).map((scene: Scene, index: number) => (
                      <Draggable key={scene.id} draggableId={String(scene.id)} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <SceneCard
                              scene={scene}
                              isSelected={selected?.type === "scene" && selected.data.id === scene.id}
                              isExpanded={expandedSceneIds.has(scene.id)}
                              storyboardCount={scene.children?.length || 0}
                              onSelect={() => handleSceneSelect(scene)}
                              onSave={() => { }}
                              onAddScene={() => handleSceneAdd(scene)}
                              onAddStoryboard={() => handleAddStoryboard(scene)}
                              onGenerateStoryboards={() => handleGenerateStoryboards(scene)}
                              onDelete={() => handleSceneDelete(scene)}
                            />
                            {expandedSceneIds.has(scene.id) && (scene.children && scene.children.length > 0) && (
                              <div className="space-y-1 mt-1">
                                {/* Storyboards are also part of the globally sorted list */}
                                {sortedScenes.filter((s: Scene) => s.storyboard && s.parent_id === scene.id).map((board: Scene) => (
                                  <StoryboardCard
                                    key={board.id}
                                    storyboard={board}
                                    isSelected={selected?.type === "storyboard" && selected.data.id === board.id}
                                    onSelect={() => handleStoryboardSelect(board)}
                                    onAddStoryboard={() => handleAddStoryboard(scene, board)}
                                    onDelete={() => handleStoryboardDelete(board)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* ── Main Settings Area ── */}
          <div className="flex-1 bg-gray-100 overflow-y-auto">
            {selected?.type === "scene" ? (
              <SceneSettings
                scene={selected.data}
                projectDetail={projectDetail}
                onUpdate={(key, val) => handleUpdate("scene", selected.data, key, val)}
              />
            ) : selected?.type === "storyboard" ? (
              <>
                {console.log('selected.data', selected.data)}
                <StoryboardSettings
                  storyboard={selected.data}
                  projectDetail={projectDetail}
                  onUpdate={(key, val) => handleUpdate("storyboard", selected.data, key, val)}
                />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
                <p>Select a scene or storyboard to get started</p>
              </div>
            )}
          </div>

          {showExportUrlPanel && projectId && stageId && (
            <ExportUrlPanel open={showExportUrlPanel} project_id={projectId} stage_id={stageId} onClose={() => setShowExportUrlPanel(false)} />
          )}

          {isPreviewingVideo && combinedVideos.length > 0 && (
            <MultiVideoDisplayPanel combinedVideos={combinedVideos} isGenerating={isCombiningTaskRunning} onClose={() => setIsPreviewingVideo(false)} />
          )}
        </div>
      </div>
    </>
  )
}
