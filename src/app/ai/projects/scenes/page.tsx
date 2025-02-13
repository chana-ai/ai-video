"use client"

import { useState, useRef, useEffect } from "react"
import { RefreshCw } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { SceneCard } from "./components/scene-card"
import { SceneSettings } from "./components/scene-settings"
import type { Scene } from "./types"
import { useSearchParams } from "next/navigation"
import Header from "../../header";
import instance from "@/lib/axios";

const initialScenes: Scene[] = [
  // {
  //   id: "1",
  //   title: "分镜 1",
  //   description: "城市街道场景",
  //   update_time: "2024-01-19 15:30",
  //   status: "complete",
  //   isModified: false,
    
  // },
  // {
  //   id: "2",
  //   title: "分镜 2",
  //   description: "办公室场景",
  //   update_time: "2024-01-18 16:31",
  //   status: "image_generating",
  //   isModified: false,
  // },
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
    instance.get(`/api/v2/scene/list?project_id=${projectId}&stage_id=${stageId}`).then((res)=>{
      console.log('Scenes: '+JSON.stringify(res))  // {scenes: [...]}
      setScenes(buildSceneOrder(res.scenes))
    })
  }, [projectId, stageId])

 
  const buildSceneOrder = (scenes: Scene[]) => {
    //TODO
    return scenes
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
          <Button variant="outline" onClick={handleGlobalSave} disabled={isSaving || ( scenes.length > 0 && !scenes.some((s) => s.isModified))}>
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
                          <Draggable key={String(scene.id)} draggableId={String(scene.id)} index={index}>
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
                                      update_time: new Date().toLocaleString(),
                                      status: "init",
                                      isModified: true,
                                      imageUrl: "",
                                      videoUrl: "",
                                      project_id: Number(projectId),
                                      stage_id: Number(stageId),
                                      seq_id: -1,
                                      prompt: "",
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
                console.log(`Updated scene ${JSON.stringify(updatedScene)}`)
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

