import { Save, Plus, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SceneCardProps, SceneStatus } from "../types"

export function SceneCard({ scene, isSelected, onSelect, onSave, onAdd, onDelete }: SceneCardProps) {
  const getStatusBadge = (status: SceneStatus) => {
    const styles = {
      init: "bg-gray-100 text-gray-600",
      image_generating: "bg-blue-100 text-blue-600",
      video_generating: "bg-purple-100 text-purple-600",
      voice_generating: "bg-orange-100 text-orange-600",
      complete: "bg-green-100 text-green-600",
      fail: "bg-red-100 text-red-600",
    }

    const labels = {
      init: "Initial",
      image_generating: "Generating Image",
      video_generating: "Generating Video",
      voice_generating: "Generating Voice",
      complete: "Complete",
      fail: "Failed",
    }

    return (
      <Badge variant="secondary" className={styles[status]}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div
      className={`
        p-4 rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-lg hover:-translate-y-1
        ${isSelected ? "bg-purple-50 border-2 border-purple-500" : "bg-white border border-gray-200"}
      `}
      onClick={() => onSelect(scene.id)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium">{scene.title}</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${scene.isModified ? "text-red-500" : "text-green-500"}`}
            onClick={(e) => {
              e.stopPropagation()
              onSave(scene.id)
            }}
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onAdd(scene.id)
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(scene.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          {scene.timestamp}
        </div>
        {getStatusBadge(scene.status)}
      </div>
    </div>
  )
}

