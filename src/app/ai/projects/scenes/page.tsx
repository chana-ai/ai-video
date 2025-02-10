"use client"

import { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, RefreshCw } from "lucide-react"
import { SceneCard } from "./components/scene-card"
import { SceneSettings } from "./components/scene-settings"
import type { Scene } from "./types"
import { useSearchParams } from "next/navigation"
import Header from "../../header";

const initialScenes: Scene[] = [
  {
    id: "1",
    title: "分镜 1",
    description: "城市街道场景",
    timestamp: "2024-01-19 15:30",
    status: "complete",
    isModified: false,
  },
  {
    id: "2",
    title: "分镜 2",
    description: "办公室场景",
    timestamp: "2024-01-18 16:31",
    status: "image_generating",
    isModified: false,
  },
  {
    id: "3",
    title: "分镜 3",
    description: "咖啡厅场景",
    timestamp: "2024-01-18 14:20",
    status: "video_generating",
    isModified: false,
  },
  {
    id: "4",
    title: "分镜 4",
    description: "公园场景",
    timestamp: "2024-01-18 12:15",
    status: "voice_generating",
    isModified: false,
  },
  {
    id: "5",
    title: "分镜 5",
    description: "地铁站场景",
    timestamp: "2024-01-18 10:45",
    status: "init",
    isModified: false,
  },
  {
    id: "6",
    title: "分镜 6",
    description: "商场场景",
    timestamp: "2024-01-18 09:30",
    status: "fail",
    isModified: false,
  },
  {
    id: "7",
    title: "分镜 7",
    description: "餐厅场景",
    timestamp: "2024-01-17 16:20",
    status: "init",
    isModified: false,
  },
  {
    id: "8",
    title: "分镜 8",
    description: "学校场景",
    timestamp: "2024-01-17 14:15",
    status: "init",
    isModified: false,
  },
]

export default function ScenePage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  const stageId = searchParams.get('stage_id')
  
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false)
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const scenesContainerRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // const checkScroll = () => {
    //   if (scenesContainerRef.current) {
    //     setShowScrollButtons(scenesContainerRef.current.scrollHeight > scenesContainerRef.current.clientHeight)
    //   }
    // }
    // checkScroll()
    // window.addEventListener("resize", checkScroll)
    // return () => window.removeEventListener("resize", checkScroll)
  }, [])

  const handleScroll = (direction: "up" | "down") => {
    if (scenesContainerRef.current) {
      const scrollAmount = direction === "up" ? -100 : 100
      scenesContainerRef.current.scrollBy({ top: scrollAmount, behavior: "smooth" })
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(scenes)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setScenes(items)
  }

  const handleGlobalSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setScenes(scenes.map((scene) => ({ ...scene, isModified: false })))
    setIsSaving(false)
  }

  return (
    <>
    <Header
         title={
             "Projects"  }
       ></Header>
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-end gap-4">
          <Button variant="outline" onClick={handleGlobalSave} disabled={isSaving || !scenes.some((s) => s.isModified)}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">导出</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Scenes List */}
          <div className="w-80">
            {/* <h2 className="text-xl font-bold mb-4">Scenes</h2> */}
            <div className="relative">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="scenes">
                    {(provided) => (
                      <div
                        ref={(el) => {
                          provided.innerRef(el)
                          if (scenesContainerRef) {
                            scenesContainerRef.current = el
                          }
                        }}
                        {...provided.droppableProps}
                        className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2"
                      >
                        {scenes.map((scene, index) => (
                          <Draggable key={scene.id} draggableId={scene.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <SceneCard
                                  scene={scene}
                                  isSelected={scene.id === selectedSceneId}
                                  onSelect={setSelectedSceneId}
                                  onSave={(id) => console.log("save", id)}
                                  onAdd={(id) => {
                                    const newScene: Scene = {
                                      id: Date.now().toString(),
                                      title: "新分镜",
                                      description: "",
                                      timestamp: new Date().toLocaleString(),
                                      status: "init",
                                      isModified: true,
                                    }
                                    const index = scenes.findIndex((s) => s.id === id)
                                    const newScenes = [...scenes]
                                    newScenes.splice(index + 1, 0, newScene)
                                    setScenes(newScenes)
                                  }}
                                  onDelete={(id) => {
                                    setScenes(scenes.filter((s) => s.id !== id))
                                    if (selectedSceneId === id) {
                                      setSelectedSceneId(null)
                                    }
                                  }}
                                />
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
          </div>

          {/* Scene Settings */}
          <div className="flex-1">
            <SceneSettings
              scene={scenes.find((s) => s.id === selectedSceneId) || null}
              onUpdate={(updatedScene) => {
                setScenes(scenes.map((scene) => (scene.id === updatedScene.id ? updatedScene : scene)))
              }}
              onVideoPreviewToggle={() => setIsVideoPreviewOpen(!isVideoPreviewOpen)}
              isVideoPreviewOpen={isVideoPreviewOpen}
            />
          </div>

          {/* Empty space for future controls */}
          <div className="w-80" />
        </div>
      </div>
    </div>
    </>
  )
}

