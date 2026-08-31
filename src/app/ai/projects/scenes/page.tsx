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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import ExportUrlPanel from "./components/export_url_panel"
import { MultiVideoDisplayPanel } from "./components/multi-video-display-panel"
import { wsManager, type WsMessage } from "@/lib/websocket"
import { showToast } from "@/lib/toast-helpers"
import internal from "node:stream"
import { spaceChildren } from "antd/es/button"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SelectedItem =
  | { type: "scene"; data: Scene }
  | { type: "storyboard"; data: Scene }

// ── Helper: Sort items by linked list (pre_seq_id / next_seq_id) ────────────
function sortLinkedList(items: Scene[]): Scene[] {
  if (items.length <= 1) return items

  // 1. Construct subSceneMap: storyboard=1, parent_id!=null, grouped by parent_id
  const subSceneMap = new Map<number, Scene[]>()
  items.forEach(s => {
    if (s.storyboard === true && s.parent_id !== null) {
      if (!subSceneMap.has(s.parent_id)) {
        subSceneMap.set(s.parent_id, [])
      }
      subSceneMap.get(s.parent_id)?.push(s)
    }
  })

  // 2. Create sortBySeqId helper function
  const sortBySeqId = (sceneList: Scene[]): Scene[] => {

    if (sceneList.length <= 1) return sceneList

    // Find head nodes (pre_seq_id = -1 or null)
    const headNodes = sceneList.filter(i => i.pre_seq_id === -1 || i.pre_seq_id === null)

    const result: Scene[] = []
    const seen = new Set<number>()

    // Traverse from each head node
    headNodes.forEach(head => {
      let curr = head
      while (curr && curr.seq_id !== -1 && !seen.has(curr.id)) {
        result.push(curr)
        seen.add(curr.id)

        // Find next node by next_seq_id (which is a seq_id)
        const nextSeqId = curr.next_seq_id
        curr = sceneList.find(s => s.seq_id === nextSeqId)
      }
    })

    // Add any orphan nodes
    sceneList.forEach(item => {
      if (!seen.has(item.id)) {
        result.push(item)
        seen.add(item.id)
      }
    })

    return result
  }

  // 3. Get topLevelScenes (storyboard == 0, parent_id == null)
  const topListScenes = items.filter(i => i.storyboard === false && i.parent_id === null)

  // 4. Sort topLevelScenes by seq_id
  const topList = sortBySeqId(topListScenes)

  // 5. Combine: for each top scene, add its sorted children
  const result: Scene[] = []
  topList.forEach(top => {
    result.push(top)
    const subList = sortBySeqId(subSceneMap.get(top.id) || [])
    subList.forEach(child => {
      // top.children?.push(child.id)
      result.push(child)
    })
  })

  return result
}

export default function ScenePage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [expandedSceneIds, setExpandedSceneIds] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [generatingStoryboards, setGeneratingStoryboards] = useState<Set<number>>(new Set())

  // Memoize sorted scenes to keep linked list order across the entire project
  // Don't cache sortedScenes - recalculate on every scenes update
  const sortedScenes = sortLinkedList(scenes)

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

  // ─── Add Scene/Storyboard Dialog ────────────────────────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSceneTitle, setNewSceneTitle] = useState("")
  const [currentSceneForAdd, setCurrentSceneForAdd] = useState<Scene | null>(null)

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

        // Ensure children is always an array (avoid undefined/null)
        flat_scenes.forEach(s => {
          scene_map.set(s.id, s)
          s.children = s.children || []  // Initialize children array if not present
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
      // setIsGeneratingVideo(false) // Not implemented yet
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

  const handleAddStoryboard = (current_scene: Scene) => {
    // Open dialog to ask for title
    setCurrentSceneForAdd(current_scene)
    setNewSceneTitle("")
    setShowAddDialog(true)
  }

  const handleConfirmAddScene = async () => {
    if (!currentSceneForAdd || !newSceneTitle.trim()) {
      showToast("请输入名称", "error")
      return
    }

    setShowAddDialog(false)

    const endpoint = '/api/v2/scene/add'
    const data = {
      project_id: projectId,
      stage_id: stageId,
      scene_id: currentSceneForAdd.id,
      title: newSceneTitle.trim()
    }

    instance.post(endpoint, data)
      .then((res: any) => {
        const newBoard: Scene = {
          id: res.id, title: res.title,
          status: "INIT",
          storyboard: res.storyboard,
          parent_id: res.parent_id,
          image_status: false, clip_status: false, voice_status: false,
          del: false,
          create_time: new Date().toISOString(), update_time: new Date().toISOString(),
          project_id: Number(currentSceneForAdd.project_id) || 0,
          stage_id: Number(currentSceneForAdd.stage_id) || 0,
          seq_id: res.seq_id, pre_seq_id: res.pre_seq_id, next_seq_id: res.next_seq_id,
          video_setting: { model: "", camera: "frame", duration: "", motion: "" },
          children: []
        }

        // 1. Find the next_scene based on current_scene.next_seq_id
        const nextScene = scenes.find((s: Scene) => s.seq_id === currentSceneForAdd.next_seq_id
          && s.parent_id == currentSceneForAdd.parent_id)

        // 2. Update linked list by creating new objects with updated seq_id references
        const updatedScenes = scenes.map(s => {
          if (s.id === currentSceneForAdd.id) return { ...s, next_seq_id: newBoard.seq_id }
          if (nextScene && s.id === nextScene.id) return { ...s, pre_seq_id: newBoard.seq_id }
          return s
        })

        // 3. Create new array with newBoard inserted after current_scene
        const scenesWithNewBoard = [
          ...updatedScenes,
          newBoard
        ]

        const scenesWithChildren = scenesWithNewBoard.map(s => {
          if (s.storyboard == true && s.id === currentSceneForAdd.parent_id) {
            return { ...s, children: [...(s.children || []), newBoard.id] }
          }
          return s
        })

        // 5. Set state with updated scenes
        setScenes(scenesWithChildren)

        // setExpandedSceneIds(prev => new Set(prev).add(currentSceneForAdd.id))
        if (currentSceneForAdd.storyboard) {
          setSelected({ type: "storyboard", data: newBoard })
        } else {
          setSelected({ type: "scene", data: currentSceneForAdd })
        }
      })
      .catch((error) => {
        console.error('Add Scene Error:', error)
        showToast("添加场景失败", "error")
      })
  }


  const handleGenerateStoryboards = (current_scene: Scene) => {
    if (!projectId || !stageId || !projectDetail?.user_id) return

    // Add to generating set to show loading state
    setGeneratingStoryboards(prev => new Set(prev).add(current_scene.id))

    instance.post('/api/v2/scene/generate_storyboards', {
      project_id: projectId,
      stage_id: stageId,
      scene_id: current_scene.id,
      user_id: projectDetail.user_id,
      storyboard_no: 5
    }).then((res: any) => {
      if (!Array.isArray(res)) return

      // 1. Construct newStoryboards first
      const newStoryboards: Scene[] = res
        .filter((detail: any) => detail.scene_id !== current_scene.id) // Only storyboards
        .map((detail: any) => ({
          id: detail.id,
          title: detail.title || `AI Storyboard ${detail.scene_id}`,
          seq_id: detail.seq_id || 0,
          pre_seq_id: detail.pre_seq_id || -1,
          next_seq_id: detail.next_seq_id || -1,
          project_id: Number(projectId),
          stage_id: Number(stageId),
          status: detail.status || "INIT",
          storyboard: true,
          parent_id: current_scene.id,
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

      // 2. Append newStoryboards to scenes
      // 3. Add all newStoryboards' ids to current_scene.children
      // 4. SetExpandedSceneIds to the current_scene
      setScenes(prev => {
        const nextList = [...prev, ...newStoryboards]
        const newIds = newStoryboards.map(s => s.id)
        return nextList.map(s => {
          if (s.id === current_scene.id) {
            return {
              ...s,
              children: newIds
            }
          }
          return s
        })
      })

      // 4. Expand the current scene to see the new storyboards
      setExpandedSceneIds(prev => new Set(prev).add(current_scene.id))

      // Remove from generating set after success
      setGeneratingStoryboards(prev => {
        const next = new Set(prev)
        next.delete(current_scene.id)
        return next
      })
    }).catch(err => {
      console.error('Failed to generate storyboards:', err)
      // Remove from generating set on error
      setGeneratingStoryboards(prev => {
        const next = new Set(prev)
        next.delete(current_scene.id)
        return next
      })
    })
  }

  const handleSceneDelete = async (scene: Scene) => {
    instance.post('/api/v2/scene/delete', { project_id: projectId, stage_id: stageId, scene_id: scene.id })
      .then(() => {
        // Find pre and next scenes based on seq_id
        const preScene = scene.pre_seq_id !== -1 && scene.pre_seq_id !== null
          ? scenes.find((s) => s.seq_id === scene.pre_seq_id && s.parent_id == scene.parent_id)
          : null;

        const nextScene = scene.next_seq_id !== -1 && scene.next_seq_id !== null
          ? scenes.find((s) => s.seq_id === scene.next_seq_id && s.parent_id == scene.parent_id)
          : null;

        // Update linked list: pre.next_seq_id = current.next_seq_id (if pre exists)
        // and next.pre_seq_id = current.pre_seq_id (if next exists)
        const updatedScenes = scenes.map(s => {
          if (s.id === scene.id) return null; // Remove current scene

          // Update pre scene's next_seq_id
          if (s.id === preScene?.id && scene.pre_seq_id !== -1 && scene.pre_seq_id !== null && s.parent_id == scene.parent_id) {
            return { ...s, next_seq_id: scene.next_seq_id };
          }

          // Update next scene's pre_seq_id
          if (s.id === nextScene?.id && scene.next_seq_id !== -1 && scene.next_seq_id !== null && s.parent_id == scene.parent_id) {
            return { ...s, pre_seq_id: scene.pre_seq_id };
          }

          // Update children list if current is a storyboard and has a parent
          if (scene.storyboard == true && s.storyboard === false && s.id === scene.parent_id) {
            const updatedChildren = (s.children || []).filter(childId => childId !== scene.id);
            return { ...s, children: updatedChildren };
          }

          return s;
        }).filter(s => s !== null);

        setScenes(updatedScenes);

        if (selected?.type === "scene" && selected.data.id === scene.id) setSelected(null);
      })
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
                              hasChildren={scene.children && scene.children.length > 0}
                              onSelect={() => handleSceneSelect(scene)}
                              onSave={() => { }}
                              onAddStoryboard={() => handleAddStoryboard(scene)}
                              onGenerateStoryboards={() => handleGenerateStoryboards(scene)}
                              onDelete={() => handleSceneDelete(scene)}
                              generatingStoryboards={generatingStoryboards}
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
                                    onAddStoryboard={() => handleAddStoryboard(board)}
                                    onDelete={() => handleSceneDelete(board)}
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

          {/* Add Scene/Storyboard Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentSceneForAdd?.storyboard ? "添加 Storyboard" : "添加 Scene"}</DialogTitle>
                <DialogDescription>
                  请输入新场景/分镜的名称
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="输入名称..."
                  value={newSceneTitle}
                  onChange={(e) => setNewSceneTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
                <Button onClick={handleConfirmAddScene}>确定</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
