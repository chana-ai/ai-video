"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RightPanel } from "./right-panel"
import type { VideoSettingsProps, VideoSettings, CameraMovement } from "../types"

const MODEL_OPTIONS = ["Image-to-Video-Morph-0.2"]
const DURATION_OPTIONS = ["4s", "6s", "8s", "16s", "32s"]
const MOTION_OPTIONS = ["1", "2", "3", "4", "5", "6"]

const CAMERA_CONTROLS: { value: CameraMovement; icon: string }[] = [
  { value: "frame", icon: "□" },
  { value: "left", icon: "←" },
  { value: "right", icon: "→" },
  { value: "up", icon: "↑" },
  { value: "down", icon: "↓" },
  { value: "expand", icon: "⤢" },
  { value: "minimize", icon: "⤡" },
  { value: "rotate-ccw", icon: "↺" },
  { value: "rotate-cw", icon: "↻" },
]

export function VideoSettingsPanel({ open, onOpenChange, settings, onSave }: VideoSettingsProps) {
  const [currentSettings, setCurrentSettings] = useState<VideoSettings>({
    // model: settings?.model || MODEL_OPTIONS[0],
    camera: settings?.camera || "frame",
    duration: settings?.duration || "4s",
    motion: settings?.motion || "6",
  })

  return (
    <RightPanel open={open} onClose={() => onOpenChange(false)} title="Settings">
      <div className="space-y-6">
        {/* <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <Select
            value={currentSettings.model}
            onValueChange={(value) => setCurrentSettings({ ...currentSettings, model: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div> */}

        <div className="space-y-2">
          <label className="text-sm font-medium">Camera</label>
          <div className="grid grid-cols-3 gap-2">
            {CAMERA_CONTROLS.map((control) => (
              <Button
                key={control.value}
                variant={currentSettings.camera === control.value ? "default" : "outline"}
                className="aspect-square text-lg"
                onClick={() => setCurrentSettings({ ...currentSettings, camera: control.value })}
              >
                {control.icon}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Duration</label>
          <Select
            value={currentSettings.duration}
            onValueChange={(value) => setCurrentSettings({ ...currentSettings, duration: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Motion</label>
          <Select
            value={currentSettings.motion}
            onValueChange={(value) => setCurrentSettings({ ...currentSettings, motion: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOTION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(currentSettings)
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </RightPanel>
  )
}

