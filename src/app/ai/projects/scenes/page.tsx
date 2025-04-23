"use client"

import { useState, useRef, useEffect, use } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, RefreshCw, Mic} from "lucide-react"
import { SceneCard } from "./components/scene-card"
import { SceneSettings } from "./components/scene-settings"
import type { Scene } from "./types"
import Header from "../../header";
import instance from "@/lib/axios";
import { useSearchParams } from "next/navigation"
import { VoiceSettingsPanel } from "./components/voice-settings-panel"
import { VoiceSettings } from "./types"

export default function ScenePage() {
  const [scenes, setScenes] = useState<Scene[]>([] as Scene[])
  const [selectedScene, setSelectedScene] = useState<Scene>({} as Scene)
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const scenesContainerRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  const stageId = searchParams.get('stage_id')
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState({} as VoiceSettings)
  const [voiceMenu, setVoiceMenu] = useState({} as { [key: string]: string })
  const [subtitle, setSubtitle] = useState<string>()
  const [voice_url, setVoiceUrl] = useState<string>()
  useEffect(() => {
    instance.get(`/api/v2/scene/list?project_id=${projectId}&stage_id=${stageId}`).then((res)=>{
      setScenes(buildSceneOrder(res?.scenes))
    })

    instance.get(`/api/v2/project/detail?project_id=${projectId}&stage_id=${stageId}`).then((res)=>{
      console.log('Project Info: '+JSON.stringify(res))
      setVoiceSettings(res?.config?.voice_setting)
      setVoiceUrl(res?.voice_url) 
    })
    instance.post("/api/v2/voice/list_voices", {
      project_id: projectId,
      stage_id: stageId
    }).then((res) => {
      setVoiceMenu(res)
    })
  }, [projectId, stageId])
  
  const buildSceneOrder = (scenes: Scene[]): Scene[] => {
    return scenes
  }

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

  const handleSceneSelect = async (scene: Scene) => {
    console.log(`selected ${selectedScene?.id} and now select ${scene.id}`)
    try {
      // Select the new scene
      setSelectedScene(scene)

    } catch (error) {
      console.error('Failed to save scene:', error)
      // Optionally show error message to user
    }
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
     

      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden">
        <div className="w-100 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            
              <div className="flex items-center gap-4">
                <Mic className="h-4 w-4 text-gray-400" onClick={ () =>  {
                    scenes.length > 0 && setSubtitle(scenes.map(scene => scene.description).join("."))
                    setIsVoiceSettingsOpen(true)
                }}
                  />
                
                {/* <Button
                // className="bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-0"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  alert("Generate Voice")
                }}
              >
                Generate Voice
              </Button> */}
              </div>

              
            <div className="flex gap-2">
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
          
          <h2 className="text-xl font-bold">Scenes</h2>
          <div className="relative">
            {showScrollButtons && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-12 right-0 z-10"
                  onClick={() => handleScroll("up")}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-12 right-0 z-10"
                  onClick={() => handleScroll("down")}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </>
            )}
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
                      className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2"
                    >
                      {scenes.map((scene, index) => (
                        <Draggable 
                          key={scene.id.toString()} 
                          draggableId={scene.id.toString()} 
                          index={index}
                        >
                          {(provided) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps}
                            >
                              <SceneCard
                                scene={scene}
                                isSelected={scene.id === selectedScene?.id}
                                onSelect={() => handleSceneSelect(scene)}
                                onSave={(id) => console.log("save", id)}
                                onAdd={(id) => {
                                  const newScene: Scene = {
                                    id: Date.now().toString(),
                                    title: "新分镜",
                                    description: "",
                                    status: "init",
                                    isModified: true,
                                    // Add other required fields
                                    prompt: "",
                                    update_time: new Date().toISOString(),
                                    project_id: projectId || "",
                                    stage_id: stageId || "",
                                    seq_id: scenes.length + 1,
                                    video_setting: {}
                                  }
                                  const index = scenes.findIndex((s) => s.id === id)
                                  const newScenes = [...scenes]
                                  newScenes.splice(index + 1, 0, newScene)
                                  setScenes(newScenes)
                                }}
                                onDelete={(id) => {
                                  setScenes(scenes.filter((s) => s.id !== id))
                                  if (selectedScene?.id === id) {
                                    setSelectedScene(null)
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
        <div className="flex-grow p-4 overflow-y-auto">
          <SceneSettings
            scene={selectedScene}
            onUpdate={(updatedScene: Scene, key: string) => {        

              if (["title", "description", "prompt", "video_setting"].includes(key)) {
                // 这几个需要用户将当前UI上的更爱上传到服务器端并生效的（自动更改）
                instance.post('/api/v2/scene/update', {
                  id: updatedScene.id,
                  project_id: projectId,
                  stage_id: stageId,
                  ...(key === "prompt" ? { image_prompt: updatedScene[key] } : { [key]: updatedScene[key] }),
                  // Add other necessary fields
                }).then(() => {
                  console.log(`Scene ${updatedScene.id} updated successfully.`);
                  setScenes(scenes.map((scene) => 
                    scene.id === updatedScene.id ? updatedScene : scene
                  ))
                  setSelectedScene(updatedScene)
                }).catch((error) => {
                  console.error(`Error updating scene ${updatedScene.id}: ${error}`);
                });
              }//If 
              else {
                setScenes(scenes.map((scene) => 
                  scene.id === updatedScene.id ? updatedScene : scene
                ))
                setSelectedScene(updatedScene)
              }

            }}
          />
        </div>

      {/* Voice Settings Panel - Only renders when isVoiceSettingsOpen is true */}
      {isVoiceSettingsOpen  && projectId &&stageId && (
        <VoiceSettingsPanel
          open={isVoiceSettingsOpen}
          onOpenChange={setIsVoiceSettingsOpen}
          settings={voiceSettings}
          voice_menu={voiceMenu}
          project_id={projectId}
          stage_id = {stageId}
          subtitle={subtitle}
          voice_url={voice_url}
          onGenerate={ (voice_path: string)=>{
              setVoiceUrl(voice_path)
          }}
          onSave={(settings) => {
            instance.post('/api/v2/voice/update_voice_config', { 
              project_id: projectId,
              stage_id: stageId,
              voice_name: settings.voice_name,
            }).then(() => {
                setVoiceSettings(settings)
            })
          }}
        />
      )}
      </div>
    </div>
    </>
  )
}

