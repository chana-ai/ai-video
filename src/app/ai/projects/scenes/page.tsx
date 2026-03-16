"use client"

import React, { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, RefreshCw, Mic } from "lucide-react"
import { SceneCard, StoryboardCard } from "./components/scene-card"
import { SceneSettings } from "./components/scene-settings"
import { StoryboardSettings } from "./components/storyboard-settings"
import type { Scene, Storyboard, ProjectDetail, VoiceSettings, CombinedVideo } from "./types"
import Header from "../../header"
import instance from "@/lib/axios"
import { useSearchParams } from "next/navigation"
import { VoiceSettingsPanel } from "./components/voice-settings-panel"
import ExportUrlPanel from "./components/export_url_panel"
import { MultiVideoDisplayPanel } from "./components/multi-video-display-panel"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SelectedItem =
  | { type: "scene"; data: Scene }
  | { type: "storyboard"; data: Storyboard }

export default function ScenePage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [expandedSceneIds, setExpandedSceneIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<SelectedItem | null>(null)

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

    instance.get(`/api/v2/scene/list?project_id=${projectId}&stage_id=${stageId}`)
      .then((res: any) => {
        const remote_scenes: Scene[] = res?.scenes || []
        setScenes(remote_scenes)
        if (remote_scenes.length > 0) {
          setSelected({ type: "scene", data: remote_scenes[0] })
        }
      })

    instance.get(`/api/v2/project/detail?project_id=${projectId}&stage_id=${stageId}`)
      .then((res: any) => {
        setProjectDetail(res as ProjectDetail)
      })
      .catch((err) => console.error('Failed to load project detail:', err))

    instance.post("/api/v2/voice/list_voices", { project_id: projectId, stage_id: stageId })
      .then((res: any) => setVoiceMenu(res?.data || {}))

    checkCombiningTaskStatus()
  }, [projectId, stageId])

  useEffect(() => {
    if (isCombiningTaskRunning) {
      const timer = setInterval(checkCombiningTaskStatus, 150000)
      return () => clearInterval(timer)
    }
    instance.get(`/api/v2/project/get_project_combine_videos?project_id=${projectId}&stage_id=${stageId}`)
      .then((res: any) => { if (res.videos.length > 0) setCombinedVideos(res.videos) })
  }, [isCombiningTaskRunning])

  const checkCombiningTaskStatus = async () => {
    if (!projectId || !stageId) return
    instance.get(`/api/v2/project/get_project_combing_clip_stats?project_id=${projectId}&stage_id=${stageId}`)
      .then((res: any) => {
        const running = ['PROCESSING', 'PENDING', 'INIT'].includes(res.status)
        setIsCombiningTaskRunning(running)
      })
  }

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

  const handleStoryboardSelect = (storyboard: Storyboard) => {
    setSelected({ type: "storyboard", data: storyboard })
  }

  // ─── Update Handlers ────────────────────────────────────────────────────────

  const handleUpdate = async (type: "scene" | "storyboard", item: any, key: string, value: any) => {
    // 1. Update backend if it's a persistent key
    const persistentKeys = ["title", "description", "prompt", "image_prompt", "video_prompt", "video_setting", "character_ids", "scene_image_id", "resource_id"]
    if (persistentKeys.includes(key)) {
      const endpoint = type === "scene" ? '/api/v2/scene/update' : '/api/v2/storyboard/update'
      const data: any = { id: item.id, project_id: projectId, stage_id: stageId }
      data[key] = value

      instance.post(endpoint, data)
        .then(() => console.log(`${type} updated.`))
        .catch(err => console.error(`Error updating ${type}:`, err))
    }

    // 2. Update local state
    if (type === "scene") {
      const updatedScene = { ...item, [key]: value }
      setScenes(prev => prev.map(s => s.id === item.id ? updatedScene : s))
      if (selected?.type === "scene" && selected.data.id === item.id) {
        setSelected({ type: "scene", data: updatedScene })
      }
    } else {
      const updatedStoryboard = { ...item, [key]: value }
      setScenes(prev => prev.map(s => {
        if (s.id === item.scene_id) {
          return { ...s, storyboards: (s.storyboards || []).map(b => b.id === item.id ? updatedStoryboard : b) }
        }
        return s
      }))
      if (selected?.type === "storyboard" && selected.data.id === item.id) {
        setSelected({ type: "storyboard", data: updatedStoryboard })
      }
    }
  }

  // ─── Action Handlers ────────────────────────────────────────────────────────

  const handleCombineVideo = async () => {
    const allReady = scenes.every((s) => s.video_url != null)
    if (!allReady) { alert("请确保所有clip都已经生成"); return }
    instance.post('/api/v2/project/combine_project_scene_clips', { project_id: projectId, stage_id: stageId })
      .then(() => setIsCombiningTaskRunning(true))
      .catch((error) => {
        setIsCombiningTaskRunning(false)
        setCombineErrorMessage(error.code === "ERR_NETWORK" ? "网络连接临时错误" : error.response?.data?.message)
      })
  }

  const handleSceneAdd = async (scene: Scene) => {
    instance.post('/api/v2/scene/add', { project_id: projectId, stage_id: stageId, scene_id: scene.id })
      .then((res: any) => {
        const newScene: Scene = {
          id: res.id, title: res.title, description: res.description,
          prompt: '', video_prompt: '', video_prompt_cn: '', update_time: '',
          status: "init",
          project_id: Number(scene.project_id) || 0,
          stage_id: Number(scene.stage_id) || 0,
          seq_id: res.seq_id, pre_seq_id: res.pre_seq_id, next_seq_id: res.next_seq_id,
          video_setting: { model: "", camera: "frame", duration: "", motion: "" },
          storyboards: []
        }
        const index = scenes.findIndex((s) => s.id === scene.id)
        const newScenes = [...scenes]
        newScenes.splice(index + 1, 0, newScene)
        setScenes(newScenes)
      })
      .catch((error) => console.error('Add Scene Error:', error))
  }

  const handleAddStoryboard = (parentScene: Scene, afterStoryboard?: Storyboard) => {
    const existingBoards = parentScene.storyboards || []
    const newBoard: Storyboard = {
      id: `storyboard-${Date.now()}`,
      title: `Storyboard ${existingBoards.length + 1}`,
      description: '', prompt: '', video_prompt: '', video_prompt_cn: '',
      update_time: new Date().toLocaleString(),
      status: 'init', scene_id: parentScene.id,
      project_id: parentScene.project_id, stage_id: parentScene.stage_id,
      seq_id: existingBoards.length, pre_seq_id: -1, next_seq_id: -1,
      video_setting: { model: "", camera: "frame", duration: "", motion: "" },
    }

    setScenes(prev => prev.map(s => {
      if (s.id === parentScene.id) {
        const boards = [...(s.storyboards || [])]
        if (afterStoryboard) {
          const idx = boards.findIndex(b => b.id === afterStoryboard.id)
          boards.splice(idx + 1, 0, newBoard)
        } else {
          boards.push(newBoard)
        }
        return { ...s, storyboards: boards }
      }
      return s
    }))
    setExpandedSceneIds(prev => new Set(prev).add(parentScene.id))
    setSelected({ type: "storyboard", data: newBoard })
  }

  const handleSceneDelete = async (scene: Scene) => {
    instance.post('/api/v2/scene/delete', { project_id: projectId, stage_id: stageId, scene_id: scene.id })
      .then(() => {
        setScenes(scenes.filter((s) => s.id !== scene.id))
        if (selected?.type === "scene" && selected.data.id === scene.id) setSelected(null)
      })
  }

  const handleStoryboardDelete = (storyboard: Storyboard) => {
    setScenes(prev => prev.map(s => s.id === storyboard.scene_id ? { ...s, storyboards: (s.storyboards || []).filter(b => b.id !== storyboard.id) } : s))
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
                <Mic className="h-4 w-4 text-gray-400 cursor-pointer" onClick={() => setIsVoiceSettingsOpen(true)} />
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
                    {scenes.map((scene, index) => (
                      <Draggable key={scene.id} draggableId={scene.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <SceneCard
                              scene={scene}
                              isSelected={selected?.type === "scene" && selected.data.id === scene.id}
                              isExpanded={expandedSceneIds.has(scene.id)}
                              storyboardCount={scene.storyboards?.length || 0}
                              onSelect={() => handleSceneSelect(scene)}
                              onSave={() => { }}
                              onAddScene={() => handleSceneAdd(scene)}
                              onAddStoryboard={() => handleAddStoryboard(scene)}
                              onDelete={() => handleSceneDelete(scene)}
                            />
                            {expandedSceneIds.has(scene.id) && scene.storyboards?.map(board => (
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
              <StoryboardSettings
                storyboard={selected.data}
                projectDetail={projectDetail}
                onUpdate={(key, val) => handleUpdate("storyboard", selected.data, key, val)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
                <p>Select a scene or storyboard to get started</p>
              </div>
            )}
          </div>

          {/* Global voice settings panel */}
          {isVoiceSettingsOpen && projectId && stageId && (
            <VoiceSettingsPanel
              open={isVoiceSettingsOpen}
              onOpenChange={setIsVoiceSettingsOpen}
              settings={projectDetail?.config?.voice_setting as VoiceSettings | undefined}
              voice_menu={voiceMenu}
              project_id={projectId}
              stage_id={stageId}
              subtitle={subtitle}
              voice_url={projectDetail?.voice_url ?? undefined}
              onGenerate={(voice_path: string) => {
                setProjectDetail(prev => prev ? { ...prev, voice_url: voice_path } : prev)
              }}
              onSave={(settings: VoiceSettings) => {
                instance.post('/api/v2/voice/update_voice_config', {
                  project_id: projectId, stage_id: stageId, voice_name: settings.voice_name,
                }).then(() => {
                  setProjectDetail(prev => prev ? { ...prev, config: { ...prev.config, voice_setting: settings } } : prev)
                })
              }}
            />
          )}

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
