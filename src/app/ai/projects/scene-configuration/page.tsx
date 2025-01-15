'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut } from 'lucide-react'
import { ScenePanel } from "../components/scene-panel"
import type { ScenePanel as ScenePanelType } from "./types"

export default function SceneConfiguration() {
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [panels, setPanels] = useState<ScenePanelType[]>([
    {
      id: '1',
      title: '分镜一',
      information: '城市街道场景',
      images: [],
      currentImageIndex: 0,
      videos: [],
      currentVideoIndex: 0
    },
    {
      id: '2',
      title: '分镜二',
      information: '办公室场景',
      images: [],
      currentImageIndex: 0,
      videos: [],
      currentVideoIndex: 0
    }
  ])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(panels)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setPanels(items)
  }

  const handlePanelUpdate = (updatedPanel: ScenePanelType) => {
    setPanels(panels.map(panel => 
      panel.id === updatedPanel.id ? updatedPanel : panel
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stag:</h1>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.min(150, zoom + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline">保存</Button>
          <Button className="bg-green-600 hover:bg-green-700">导出</Button>
        </div>
      </div>

      <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="scenes" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {panels.map((panel, index) => (
                  <Draggable key={panel.id} draggableId={panel.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ScenePanel
                          panel={panel}
                          isMaximized={maximizedPanel === panel.id}
                          onMaximize={() => setMaximizedPanel(
                            maximizedPanel === panel.id ? null : panel.id
                          )}
                          onUpdate={handlePanelUpdate}
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
  )
}

