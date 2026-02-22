"use client"

import { useState, useRef, useEffect, use } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, RefreshCw, Mic, Combine } from "lucide-react"
import { SceneCard } from "./components/scene-card"
import { SceneSettings } from "./components/scene-settings"
import type { Scene } from "./types"
import Header from "../../header";
import instance from "@/lib/axios";
import { useSearchParams } from "next/navigation"
import { VoiceSettingsPanel } from "./components/voice-settings-panel"
import ExportUrlPanel from "./components/export_url_panel"
import { VoiceSettings, CombinedVideo } from "./types"
import { MultiVideoDisplayPanel } from "./components/multi-video-display-panel"

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


  const [showExportUrlPanel, setShowExportUrlPanel] = useState(false)



  // 合并后的是 预览视频
  const [isPreviewingVideo, setIsPreviewingVideo] = useState(false)  //控制显示显示 面板
  const [combinedVideos, setCombinedVideos] = useState<CombinedVideo[]>([])  // 合并后生成的 videoURl 列表
  const [isCombiningTaskRunning, setIsCombiningTaskRunning] = useState(false)   //当前是否有正在进行合并任务，若有，则已知循环检测状态。
  const [combine_error_message, setCombineErrorMessage] = useState<string>()  //合并错误消息。


  useEffect(() => {
    instance.get(`/api/v2/scene/list?project_id=${projectId}&stage_id=${stageId}`).then((res) => {
      let remote_scenes = buildSceneOrder(res?.scenes || [])
      setScenes(remote_scenes)
      if (remote_scenes.length > 0) {
        // 如果 scenes 不为空，则设置第一个为 selectedScene
        setSelectedScene(remote_scenes[0])
      }

      // let localTaskList: Task[] = []
      // for (const scene of remote_scenes) {
      //   //初始化 task 全部用 INIT。
      //     localTaskList.push({
      //       scene_id: Number(scene.id), 
      //       task_id: 0, 
      //       video_url: scene.video_url || "", 
      //       status: "INIT"
      //     })
      // }
      // setTaskList(localTaskList)
      // console.log('Task List: '+JSON.stringify(taskList))
    })

    instance.get(`/api/v2/project/detail?project_id=${projectId}&stage_id=${stageId}`).then((res) => {
      console.log('Project Info: ' + JSON.stringify(res))
      setVoiceSettings(res?.config?.voice_setting)
      setVoiceUrl(res?.voice_url)
    })
    instance.post("/api/v2/voice/list_voices", {
      project_id: projectId,
      stage_id: stageId
    }).then((res) => {
      setVoiceMenu(res?.data || {})
    })

    // instance.get(`/api/v2/task/running_video_scene_ids?project_id=${projectId}&stage_id=${stageId}`).then((res)=>{
    //   let tasks: Task[] = []
    //   for(const task_id of res?.data || []){
    //     tasks.push({
    //       scene_id: Number(task_id), 
    //       task_id: 0, 
    //       video_url: "", 
    //       status: 'PROCESSING'
    //     })
    //   }
    //   setTaskList(tasks)
    // })

    checkCombiningTaskStatus()

  }, [projectId, stageId])


  // useEffect(() => {
  //   console.log('Task List: '+JSON.stringify(taskList))
  //   const timmer = setInterval(checkTaskStatus, 120000);
  //   return () => {
  //     // 组件卸载时 清除定时器
  //     clearInterval(timmer);
  //   }
  // }, [taskList])


  useEffect(() => {
    if (isCombiningTaskRunning) {
      const timmer = setInterval(checkCombiningTaskStatus, 150000);
      return () => {
        clearInterval(timmer);
      }
    }
    //每次发生变化的时候， 重新检查下是否有最新的video_url了，并全部获取出来
    instance.get(`/api/v2/project/get_project_combine_videos?project_id=${projectId}&stage_id=${stageId}`).then((res) => {
      console.log('Project Combining Clip Stats: ' + JSON.stringify(res))
      //TODO: 服务器返回是 list 的格式， 需要取最后一个的video_url. 以后再改为全部的不同版本
      //{"id": video.id,
      // "name": video.name,
      // "url": video.get_oss_url,
      // "reference_id": video.reference_id,
      // "version": video.version}
      if (res.videos.length > 0) {
        setCombinedVideos(res.videos)
      }
    })

  }, [isCombiningTaskRunning])

  const checkCombiningTaskStatus = async () => {
    instance.get(`/api/v2/project/get_project_combing_clip_stats?project_id=${projectId}&stage_id=${stageId}`).then((res) => {
      console.log('Project Combining Clip Stats: ' + JSON.stringify(res))
      if (res.status == 'PROCESSING' || res.status == 'PENDING' || res.status == 'INIT') {
        setIsCombiningTaskRunning(true)
      } else {
        setIsCombiningTaskRunning(false)
      }
    })
  }

  // const checkTaskStatus = async () => {

  //   if(taskList.length == 0){
  //     return
  //   }
  //   instance.get(`/api/v2/task/scene_status?project_id=${projectId}&stage_id=${stageId}`).then((res)=>{
  //     console.log('Scene Status: '+JSON.stringify(res))
  //     let remote_id_task_status: { [key: string]: any } = {}   
  //     for(const scene_task of res){
  //       remote_id_task_status[scene_task.scene_id] = scene_task
  //     }

  //     let local_id_task_map: { [key: string]: Task } = {}
  //     for(const task of taskList){
  //       local_id_task_map[task.scene_id] = task
  //     }

  //     let updateScenes = []
  //     let scene_updated = false
  //     let task_updated = false
  //     for(const scene of scenes){
  //       const task = remote_id_task_status[scene.id]
  //       const local_task = local_id_task_map[scene.id]
  //       if(!task || !local_task){
  //         updateScenes.push(scene)
  //         continue
  //       }

  //       if(task.status == 'COMPLETED' && local_task.status != 'COMPLETED'){
  //         // 当远程的任务状态是 COMPLETE， 并且和本地的状态不一致，是新更新的。 
  //         updateScenes.push({ ...scene, video_url: task.video_url })
  //         scene_updated = true
  //       }else{
  //         updateScenes.push(scene)
  //       }
  //       if(task.status != local_task.status){
  //         // 更新为远程的 status
  //         local_id_task_map[scene.id] = task
  //         task_updated = true
  //       }
  //     }

  //     if(task_updated){
  //       setTaskList(Object.values(local_id_task_map))
  //     }

  //     // 如果本地有更新，则更新本地
  //     if (scene_updated){
  //       setScenes(updateScenes)
  //     }
  //   })
  // }


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

  const handleCombineVideo = async () => {

    //1. 调用合并视频的API, 之后循坏检查合并状态
    let clips_ready = true
    for (const scene of scenes) {
      if (scene.video_url == null) {
        clips_ready = false
        break
      }
    }
    if (!clips_ready) {
      alert("请确保所有clip都已经生成")
      return
    }
    // 2. 合并完成之后，调用导出视频的API

    instance.post('/api/v2/project/combine_project_scene_clips', {
      project_id: projectId,
      stage_id: stageId,
    }).then((res) => {
      console.log('Combine Video: ' + JSON.stringify(res))
      setIsCombiningTaskRunning(true)
    }).catch((error) => {
      console.error('Combine Video Error: ' + JSON.stringify(error))
      setIsCombiningTaskRunning(false)
      if (error.code == "ERR_NETWORK") {
        setCombineErrorMessage("网络连接临时错误")
        return
      }
      setCombineErrorMessage(error.response.data.message)
    })
  }


  const handleSceneAdd = async (scene: Scene) => {

    console.log(`add a scene after JSON: ${JSON.stringify(scene)}`)
    instance.post('/api/v2/scene/add', {
      project_id: projectId,
      stage_id: stageId,
      scene_id: scene.id
    }).then((res) => {
      const newScene: Scene = {
        id: res.id,
        title: res.title,
        description: res.description,
        status: "init",
        isModified: true,
        // Add other required fields
        project_id: Number(scene.project_id) || 0,
        stage_id: Number(scene.stage_id) || 0,
        seq_id: res.seq_id,
        pre_seq_id: res.pre_seq_id,
        next_seq_id: res.next_seq_id,
        video_setting: {
          model: "",
          camera: "frame",
          duration: "",
          motion: ""
        }
      }

      const next_scene = scenes.find((s) => s.seq_id === scene.next_seq_id)
      if (next_scene) {
        next_scene.pre_seq_id = newScene.seq_id
      }
      scene.next_seq_id = newScene.seq_id

      console.log(`newScene: ${JSON.stringify(newScene)}`)
      const index = scenes.findIndex((s) => s.id === scene.id)
      const newScenes = [...scenes]
      newScenes.splice(index + 1, 0, newScene)
      setScenes(newScenes)
    }).catch((error) => {
      console.error('Add Scene Error: ' + JSON.stringify(error))
    })
  }

  const handleSceneDelete = async (scene: Scene) => {
    console.log(`delete scene ${scene.id}`)
    instance.post('/api/v2/scene/delete', {
      project_id: projectId,
      stage_id: stageId,
      scene_id: scene.id
    }).then((res) => {
      console.log(`delete scene ${scene.id} success`)
      // Find pre and next scenes
      const pre_scene = scenes.find((s) => s.seq_id === scene.pre_seq_id)
      const next_scene = scenes.find((s) => s.seq_id === scene.next_seq_id)

      if (pre_scene) {
        pre_scene.next_seq_id = scene.next_seq_id
      }
      if (next_scene) {
        next_scene.pre_seq_id = scene.pre_seq_id
      }
      // Create new scenes array excluding deleted scene
      const newScenes = scenes.filter((s) => s.id !== scene.id)
      setScenes(newScenes)
    }).catch((error) => {
      console.error('Delete Scene Error: ' + JSON.stringify(error))
    })
  }

  return (
    <>
      <Header
        title={
          "Projects"}
      ></Header>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}


        {/* Main Content */}
        <div className="flex-grow flex overflow-hidden">
          <div className="w-100 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">

              <div className="flex items-center gap-4">
                {/* <Mic className="h-4 w-4 text-gray-400" onClick={ () =>  {
                    scenes.length > 0 && setSubtitle(scenes.map(scene => scene.description).join("."))
                    setIsVoiceSettingsOpen(true)
                }}
                  /> */}

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
                <Mic className="h-4 w-4 text-gray-400" onClick={() => {
                  scenes.length > 0 && setSubtitle(scenes.map(scene => scene.description).join("."))
                  setIsVoiceSettingsOpen(true)
                }} />

                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowExportUrlPanel(true)}>导出</Button>

                <Button variant="outline" onClick={handleCombineVideo} disabled={isCombiningTaskRunning}>
                  {isCombiningTaskRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      合并中...
                    </>
                  ) : (
                    "合并"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsPreviewingVideo(true)} disabled={combinedVideos.length === 0}>
                  预览
                </Button>
              </div>
              <div style={{ color: 'red' }}>{combine_error_message} </div>
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
                                  onAdd={(scene) => {
                                    handleSceneAdd(scene)
                                  }}
                                  onDelete={(scene) => {
                                    handleSceneDelete(scene)
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
              onUpdate={(key: string, value: any) => {

                if (["title", "description", "image_prompt", "video_setting"].includes(key)) {
                  let data: any = {
                    id: selectedScene.id,
                    project_id: projectId,
                    stage_id: stageId,
                  }
                  data[key] = value

                  // 这几个需要用户将当前UI上的更爱上传到服务器端并生效的（自动更改）
                  instance.post('/api/v2/scene/update', data).then(() => {
                    console.log(`Scene ${selectedScene.id} updated successfully.`);
                    setSelectedScene({ ...selectedScene, [key]: value })
                  }).catch((error) => {
                    console.error(`Error updating scene ${selectedScene.id}: ${error}`);
                  });
                } else {
                  // 这几个需要用户将当前UI上的数值进行更改，不需要上传到服务器端，因为本身这些值是服务器生成并返回的 
                  // video_prompt_cn, image_url, video_url, 
                  setSelectedScene({ ...selectedScene, [key]: value })
                }

                if (key == "image_prompt") {
                  key = "prompt"   // 服务器返回的是  prompt, 这里需要转化一下。
                }
                setScenes(scenes.map((scene) =>
                  scene.id === selectedScene.id ? { ...scene, [key]: value } : scene
                ))
              }}
            />
          </div>

          {/* Voice Settings Panel - Only renders when isVoiceSettingsOpen is true */}
          {isVoiceSettingsOpen && projectId && stageId && (
            <VoiceSettingsPanel
              open={isVoiceSettingsOpen}
              onOpenChange={setIsVoiceSettingsOpen}
              settings={voiceSettings}
              voice_menu={voiceMenu}
              project_id={projectId}
              stage_id={stageId}
              subtitle={subtitle}
              voice_url={voice_url}
              onGenerate={(voice_path: string) => {
                setVoiceUrl(voice_path)
              }}
              onSave={(settings: VoiceSettings) => {
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

          {showExportUrlPanel && projectId && stageId && (
            <ExportUrlPanel
              open={showExportUrlPanel}
              project_id={projectId}
              stage_id={stageId}
              onClose={() => setShowExportUrlPanel(false)}
            />
          )}


          {isPreviewingVideo && combinedVideos.length > 0 && (
            <MultiVideoDisplayPanel
              combinedVideos={combinedVideos}
              isGenerating={isCombiningTaskRunning}
              onClose={() => setIsPreviewingVideo(false)}
            />
          )}

        </div>
      </div>
    </>
  )
}
