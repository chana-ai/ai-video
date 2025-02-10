'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Maximize2, Minimize2, RotateCcw, RotateCw, Square } from 'lucide-react'

interface VideoSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: VideoSettings) => void;
}

interface VideoSettings {
  duration: string;
  cameraAngle: string;
  motion: string;
}

const cameraControls = [
  { icon: Square, value: 'frame' },
  { icon: ArrowLeft, value: 'left' },
  { icon: ArrowRight, value: 'right' },
  { icon: ArrowUp, value: 'up' },
  { icon: ArrowDown, value: 'down' },
  { icon: Minimize2, value: 'minimize' },
  { icon: Maximize2, value: 'maximize' },
  { icon: RotateCcw, value: 'rotate-ccw' },
  { icon: RotateCw, value: 'rotate-cw' },
]

export function VideoSettingsDialog({ open, onOpenChange, onSave }: VideoSettingsProps) {
  const [settings, setSettings] = useState<VideoSettings>({
    duration: '1',
    cameraAngle: 'frame',
    motion: '1'
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">配置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">时长</label>
            <Select
              value={settings.duration}
              onValueChange={(value) => setSettings(prev => ({ ...prev, duration: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">摄像头角度</label>
            <div className="grid grid-cols-3 gap-4">
              {cameraControls.map((control, index) => (
                <Button
                  key={index}
                  variant={settings.cameraAngle === control.value ? "default" : "outline"}
                  className="aspect-square p-0 h-16"
                  onClick={() => setSettings(prev => ({ ...prev, cameraAngle: control.value }))}
                >
                  <control.icon className="h-6 w-6" />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Motion</label>
            <Select
              value={settings.motion}
              onValueChange={(value) => setSettings(prev => ({ ...prev, motion: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select motion" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              onSave(settings)
              onOpenChange(false)
            }}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

