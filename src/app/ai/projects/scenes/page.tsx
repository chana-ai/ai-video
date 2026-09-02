"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { SceneCard, StoryboardCard } from "./components/scene-card"
import { SceneSettings } from "@/components/scene-settings"
import { StoryboardSettings } from "./components/storyboard-settings"
import type { Scene, ProjectDetail, CombinedVideo } from "@/app/ai/projects/types"
import Header from "../../header"
import instance from "@/lib/axios"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import ExportUrlPanel from "./components/export_url_panel"
import { MultiVideoDisplayPanel } from "./components/multi-video-display-panel"
import { MergePanel, type MergePanelRef } from "./components/merge-panel"
import { MergeButton } from "./components/merge-button"
import { VideoProgressList } from "./components/video-progress"
import { useWebSocketManager } from "@/lib/websocket-manager"
import { useVideoActions } from "./hooks/use-video-actions"
import { showToast } from "@/lib/toast-helpers"
import { getUserId } from "@/lib/localcache"

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
        const nextScene = sceneList.find(s => s.seq_id === nextSeqId)
        if (nextScene) {
          curr = nextScene
        } else {
          break
        }
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

  const scenesContainerRef = useRef<HTMLDivElement>(null)

  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  const stageId = searchParams.get('stage_id')

  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null)

  const [showExportUrlPanel, setShowExportUrlPanel] = useState(false)

  const [isPreviewingVideo, setIsPreviewingVideo] = useState(false)
  const [combinedVideos, setCombinedVideos] = useState<CombinedVideo[]>([])
  const [isCombiningTaskRunning, setIsCombiningTaskRunning] = useState(false)
  const [combine_error_message, setCombineErrorMessage] = useState<string>()

  // 缓存WebSocket选项，避免不必要的重新连接
  const wsOptions = useMemo(() => ({
    projectId: projectId && stageId ? Number(projectId) : undefined,
    stageId: projectId && stageId ? Number(stageId) : undefined,
    userId: getUserId() ? Number(getUserId()) : undefined
  }), [projectId, stageId])


  // 缓存视频操作选项，避免不必要的重新创建
  const videoActionsOptions = useMemo(() => ({
    projectId: projectId || '',
    stageId: stageId || '',
    userId: getUserId() || undefined,
    onActionStart: (_action: string, _taskId?: string) => {
      if (_action === 'videoCombination') {
        setIsCombiningTaskRunning(true)
      }
    },
    onActionComplete: (_action: string, result?: any) => {
      if (_action === 'videoCombination' && result?.result_url) {
        setCombinedVideos(prev => [...prev, { version: Date.now(), url: result.result_url }])
      }
      setIsCombiningTaskRunning(false)
    },
    onActionError: (_action: string, error: string) => {
      setIsCombiningTaskRunning(false)
      setCombineErrorMessage(error)
    }
  }), [projectId, stageId])


  // WebSocket管理器 - 在顶层调用
  const wsManager = useWebSocketManager(
    wsOptions,
    videoActionsOptions
  )


  // 视频操作集成
  const videoActions = useVideoActions(videoActionsOptions)

  // 合并功能适配器 - 为保持兼容性
  const [isMergePanelOpen, setIsMergePanelOpen] = useState(false)
  const mergePanelRef = useRef<MergePanelRef>(null)
  const mergeAdapter = {
    toggleMergePanel: () => {
      setIsMergePanelOpen(!isMergePanelOpen)
      if (isMergePanelOpen) {
        // 打开时检查并更新 video_url
        checkAndUpdateVideoUrls()
      }
    },
    closeMergePanel: () => {
      setIsMergePanelOpen(false)
      mergePanelRef.current?.closePanel()
    },
    isMergePanelOpen,
    isMerging: isCombiningTaskRunning,
    getSelectionState: (scenes: any[]) => {
      const allStoryboards = scenes.filter((s: any) => s.storyboard === true && s.parent_id !== null)
      const readyStoryboards = allStoryboards.filter((s: any) => s.status === "COMPLETE")
      return {
        storyboardIds: Array.from(readyStoryboards.map((s: any) => s.id)),
        readyCount: readyStoryboards.length,
        totalCount: allStoryboards.length
      }
    },
    selectReadyStoryboards: (scenes: any[]) => {
      const readyIds = scenes
        .filter((s: any) => s.storyboard === true && s.parent_id !== null && s.status === "COMPLETE")
        .map((s: any) => s.id)
      return readyIds
    },
    onMergeComplete: (resultUrl: string) => {
      // 添加到 combinedVideos
      setCombinedVideos(prev => [...prev, { version: Date.now(), url: resultUrl }])
    }
  }

  // 检查并更新 video_url
  const checkAndUpdateVideoUrls = async () => {
    if (!projectId || !stageId || !projectDetail?.user_id) return

    try {
      const sceneIds = sortedScenes.map(s => s.id)
      if (sceneIds.length === 0) return

      const response = await instance.post('/api/v2/scene/get_video_result', {
        scene_ids: sceneIds,
        user_id: projectDetail.user_id,
        project_id: Number(projectId),
        stage_id: Number(stageId)
      })

      const videoResults = response || {}

      // 更新 scenes 的 video_url
      setScenes(prev => prev.map(s => {
        if (videoResults[s.id]) {
          return {
            ...s,
            video_url: videoResults[s.id]
          }
        }
        return s
      }))
    } catch (error) {
      console.error('获取视频结果失败:', error)
    }
  }

  // ─── Add Scene/Storyboard Dialog ────────────────────────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSceneTitle, setNewSceneTitle] = useState("")
  const [currentSceneForAdd, setCurrentSceneForAdd] = useState<Scene | null>(null)

  // ─── Data loading ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId || !stageId) return

    // 设置视频操作订阅
    const unsubscribe = videoActions.setupSubscriptions()

    return () => {
      unsubscribe()
    }
  }, [projectId, stageId, videoActions])

  useEffect(() => {
    if (!projectId || !stageId) return

    // 使用 Promise.all 确保两个请求都完成后再设置状态
    Promise.all([
      instance.get(`/api/v2/scene/list?project_id=${projectId}&stage_id=${stageId}`),
      instance.get(`/api/v2/project/detail?project_id=${projectId}&stage_id=${stageId}`)
    ]).then(([scenesRes, projectRes]) => {
      const flat_scenes: Scene[] = scenesRes as Scene[] || []
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
      setProjectDetail(projectRes as any)

      // Only select a scene if we have valid top_level data
      if (top_level && top_level.length > 0 && top_level[0]) {
        setSelected({ type: "scene", data: top_level[0] })
        handleSceneSelect(top_level[0])
      }
    }).catch(err => {
      console.error('Failed to load data:', err)
    })

  }, [projectId, stageId])

  // 注意：WebSocket事件现在由 useVideoActions 统一处理
  // 这里保留必要的场景更新逻辑
  useEffect(() => {
    if (!projectId || !stageId || !projectDetail?.user_id) return

    // 更新场景视频 URL（当收到完成事件时）
    const handleSceneUpdate = (message: any) => {
      if (message.event === 'createVideoClipComplete' && message.data?.video_url) {
        setScenes(prev => prev.map(s => {
          if (s.id === Number(message.scene_id)) {
            return {
              ...s,
              video_url: message.data.video_url,
              image_url: message.data.storyboard_image_url
            }
          }
          return s
        }))

        // 更新选择
        setSelected(prev => {
          if (!prev || prev.data.id !== message.scene_id) return prev
          return {
            ...prev,
            data: {
              ...prev.data,
              video_url: message.data.video_url,
              image_url: message.data.storyboard_image_url
            }
          }
        })
      }
    }

    // 使用统一的WebSocket管理器订阅事件
    const unsubscribe = wsManager.subscribe('createVideoClipComplete', handleSceneUpdate)

    return () => {
      unsubscribe()
    }
  }, [projectId, stageId, projectDetail?.user_id])

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
    if (!scene) return

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
  // 视频生成处理器 - 处理可能为undefined的场景
  const handleGenerateVideoSafe = async (scene: Scene | undefined) => {
    if (!scene || !projectId || !stageId || !projectDetail?.user_id) return

    try {
      await videoActions.createVideoClip(
        scene.id,
        scene.video_prompt || scene.prompt || '',
        scene.scene_image_id || 0
      )
    } catch (error) {
      console.error('视频生成失败:', error)
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

  // 取消视频操作
  const handleCancelVideoAction = (_actionId: string) => {
    if (_actionId.startsWith('combine_')) {
      videoActions.cancelVideoCombination()
    }
    videoActions.clearActionState(_actionId)
  }

  // 完成视频操作
  const handleCompleteVideoAction = (_actionId: string) => {
    videoActions.clearActionState(_actionId)
  }

  return (
    <>
      <Header title="Project Scenes" />
      <div className="min-h-screen bg-gray-100 flex flex-col">


        <div className="flex-grow flex overflow-hidden">
          {/* ── Left Panel (20%) ── */}
          <div className="w-[20%] min-w-[250px] p-0 overflow-y-auto bg-gray-100 border-r flex flex-col">
            {/* 进度条显示区域 */}
            <div className="border-b bg-white px-4 py-3 flex-shrink-0">
              <VideoProgressList
                videoActions={videoActions.videoActions}
                onCancel={handleCancelVideoAction}
                onComplete={handleCompleteVideoAction}
              />
            </div>

            {/* 顶部控制栏 */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Scenes</h2>
              <MergeButton
                onClick={mergeAdapter.toggleMergePanel}
                isPanelOpen={mergeAdapter.isMergePanelOpen}
                isMerging={mergeAdapter.isMerging}
                selection={mergeAdapter.getSelectionState(sortedScenes)}
                disabled={mergeAdapter.getSelectionState(sortedScenes).readyCount === 0}
              />
            </div>

            {/* Scene 列表 */}
            <div className="p-4 overflow-y-auto flex-grow">
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
                                // onGenerateVideo={() => handleGenerateVideoSafe(scene)}
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
                                      onGenerateVideo={() => handleGenerateVideoSafe(board)}
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
          </div>

          {/* ── Right Panel (80%) ── */}
          <div className="flex-1 min-w-0 bg-white overflow-y-auto">
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

          {/* {showExportUrlPanel && projectId && stageId && (
            <ExportUrlPanel open={showExportUrlPanel} project_id={projectId} stage_id={stageId} onClose={() => setShowExportUrlPanel(false)} />
          )} */}

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

        {/* Merge Panel */}
        {mergeAdapter.isMergePanelOpen && projectId && stageId && (
          <MergePanel
            isOpen={mergeAdapter.isMergePanelOpen}
            onClose={mergeAdapter.closeMergePanel}
            projectId={projectId}
            stageId={stageId}
            scenes={sortedScenes}
            onMergeComplete={mergeAdapter.onMergeComplete}
          />
        )}
      </div>
    </>
  )
}
