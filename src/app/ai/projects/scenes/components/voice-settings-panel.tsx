"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { VoiceSettings, VoiceSettingsPanelProps } from "../types"

export function VoiceSettingsPanel({
  open,
  onOpenChange,
  settings,
  onSave,
}: VoiceSettingsPanelProps) {
  const defaultSettings: VoiceSettings = {
    voiceType: settings?.voiceType || "超真实笑笑",
    backgroundSound: settings?.backgroundSound || "自动匹配",
  }

  const handleSave = () => {
    onSave(defaultSettings)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">音频设置</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">配音声音</label>
            <Select
              defaultValue={defaultSettings.voiceType}
              onValueChange={(value) => {
                defaultSettings.voiceType = value
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择配音声音" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="超真实笑笑">超真实笑笑</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">背景音</label>
            <Select
              defaultValue={defaultSettings.backgroundSound}
              onValueChange={(value) => {
                defaultSettings.backgroundSound = value
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择背景音" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="自动匹配">自动匹配</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
            onClick={handleSave}
          >
            保存设置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 