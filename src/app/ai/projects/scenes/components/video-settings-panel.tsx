"use client"
import { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "antd"
import type { SelectProps } from 'antd'
import { RightPanel } from "./right-panel"
import type { VideoSettingsProps, VideoSettings, CameraMovement } from "../types"

// Move constants outside component to prevent recreating on each render
const DURATION_OPTIONS = [
  { value: "4", label: "4 seconds" },
  { value: "6", label: "6 seconds" },
  { value: "8", label: "8 seconds" },
  { value: "16", label: "16 seconds" },
  { value: "32", label: "32 seconds" }
]

const MOTION_OPTIONS = [
  { value: "1", label: "Speed 1" },
  { value: "2", label: "Speed 2" },
  { value: "3", label: "Speed 3" },
  { value: "4", label: "Speed 4" },
  { value: "5", label: "Speed 5" },
  { value: "6", label: "Speed 6" }
]

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

// Memoize the camera controls to prevent unnecessary re-renders
const CameraControlButtons = memo(({ currentCamera, onCameraChange }: {
  currentCamera: CameraMovement,
  onCameraChange: (value: CameraMovement) => void
}) => (
  <div className="grid grid-cols-3 gap-2">
    {CAMERA_CONTROLS.map((control) => (
      <Button
        key={control.value}
        variant={currentCamera === control.value ? "default" : "outline"}
        className="aspect-square text-lg"
        onClick={() => onCameraChange(control.value)}
      >
        {control.icon}
      </Button>
    ))}
  </div>
))
CameraControlButtons.displayName = 'CameraControlButtons'

// Create a memoized select component to prevent unnecessary re-renders
const SettingsSelect = memo(({ 
  value, 
  onChange, 
  options 
}: { 
  value: string, 
  onChange: (value: string) => void, 
  options: { value: string, label: string }[] 
}) => {
  const handleSelect: SelectProps['onChange'] = (newValue) => {
    if (typeof newValue === 'string') {
      onChange(newValue)
    }
  }

  return (
    <Select
      value={value}
      onChange={handleSelect}
      options={options}
      style={{ width: '100%' }}
      className="video-settings-select"
      popupClassName="video-settings-dropdown"
      dropdownStyle={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      }}
      getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
    />
  )
})
SettingsSelect.displayName = 'SettingsSelect'

export function VideoSettingsPanel({ open, onOpenChange, settings, onSave }: VideoSettingsProps) {
  const [currentSettings, setCurrentSettings] = useState<VideoSettings>({
    camera: settings?.camera || "frame",
    duration: settings?.duration || "4",
    motion: settings?.motion || "6",
  })

  console.log(`current video ${currentSettings.camera}  and settings ${settings?.camera}` )
  
  // Memoize handlers to prevent recreating on each render
  const handleCameraChange = useCallback((value: CameraMovement) => {
    setCurrentSettings(prev => ({ ...prev, camera: value }))
  }, [])

  const handleDurationChange = useCallback((value: string) => {
    setCurrentSettings(prev => ({ ...prev, duration: value }))
  }, [])

  const handleMotionChange = useCallback((value: string) => {
    setCurrentSettings(prev => ({ ...prev, motion: value }))
  }, [])

  const handleSave = useCallback(() => {
    onSave(currentSettings, "video_setting")
    onOpenChange(false)
  }, [currentSettings, onSave, onOpenChange])

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity ${
      open ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className={`transform transition-transform duration-200 ${
        open ? 'scale-100' : 'scale-95'
      }`}>
        <RightPanel 
          open={open} 
          onClose={() => onOpenChange(false)}
          title="Video Settings"
          className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-white rounded-lg shadow-xl"
          // className="overflow-y-auto bg-white rounded-lg shadow-xl"
        >
          <div className="p-6 space-y-6">
            {/* Camera Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Camera</label>
              <CameraControlButtons
                currentCamera={currentSettings.camera}
                onCameraChange={handleCameraChange}
              />
            </div>

            {/* Duration Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <SettingsSelect
                value={currentSettings.duration}
                onChange={handleDurationChange}
                options={DURATION_OPTIONS}
              />
            </div>

            {/* Motion Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Motion</label>
              <SettingsSelect
                value={currentSettings.motion}
                onChange={handleMotionChange}
                options={MOTION_OPTIONS}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </RightPanel>
      </div>
    </div>
  )
}

// Update the CSS in globals.css
const styles = `
.video-settings-select .ant-select-selector {
  height: 40px !important;
  padding: 4px 11px !important;
  display: flex !important;
  align-items: center !important;
  border-radius: 0.5rem !important;
}

.video-settings-dropdown {
  animation: none !important;
}

.video-settings-dropdown .ant-select-item {
  padding: 8px 12px !important;
}

.video-settings-dropdown .ant-select-item-option-active {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

.video-settings-dropdown .ant-select-item-option-selected {
  background-color: rgba(0, 0, 0, 0.08) !important;
}

`

// Memoize the entire component to prevent unnecessary re-renders from parent
export default memo(VideoSettingsPanel)

