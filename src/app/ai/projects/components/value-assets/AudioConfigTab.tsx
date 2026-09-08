'use client'

import React from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { VoiceSynthesisTab } from './VoiceSynthesisTab'
import { VoiceCloningTab } from './VoiceCloningTab'
import { VoiceSetting } from '../../../value-assets/types'
import { cn } from "@/lib/utils"

interface AudioConfigTabProps {
    selectedAsset: any
    voiceModels: any[]
    isGeneratingAudio: boolean
    audioPreviewUrl_tts: string
    audioPreviewUrl_clone: string
    mode: 'tts' | 'clone'
    onModeChange: (mode: 'tts' | 'clone') => void
    onAudioPreview: () => Promise<void>
    onVoiceClone: (audioUrl: string, text: string) => Promise<void>
    onVoiceSettingChange: (setting: VoiceSetting) => void
    onVoiceSettingSave: () => void
    projectDetail: any
    onVendorChange: (vendor: string) => void
}

export const AudioConfigTab: React.FC<AudioConfigTabProps> = ({
    selectedAsset,
    voiceModels,
    isGeneratingAudio,
    audioPreviewUrl_tts,
    audioPreviewUrl_clone,
    mode,
    onModeChange,
    onAudioPreview,
    onVoiceClone,
    onVoiceSettingChange,
    onVoiceSettingSave,
    projectDetail,
    onVendorChange
}) => {
    // 使用 selectedAsset.voice_setting，如果没有则使用默认值
    const voice_setting = selectedAsset?.config?.voice_setting || {
        gender: 'female',
        emotion: 'neutral',
        vendor: 'azure',
        is_master: false,
        mode: 'tts',
        tts: {
            url: '',
            desc: '',
            voice: '',
            voice_name: '',
        },
        clone: {
            url: '',
            desc: '',
            voice: '',
            voice_name: '',
        }
    }

    const updateConfig = (updates: Partial<VoiceSetting>) => {
        // 更新 voice_setting，但保持其他字段不变
        onVoiceSettingChange({ ...voice_setting, ...updates })
    }

    const handleModeChange = (value: string) => {
        const nextMode = value === 'clone' ? 'clone' : 'tts'
        const nextVendor = nextMode === 'clone' ? 'qwen' : 'azure'
        onModeChange(nextMode)
        updateConfig({ vendor: nextVendor })
        onVendorChange(nextVendor)
    }

    const currentAudioPreviewUrl = mode === 'clone' ? audioPreviewUrl_clone : audioPreviewUrl_tts

    return (
        <div className="space-y-4">
            {/* 模式选择 - 二选一 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Label className="text-sm font-medium mb-3 block">
                    语音配置模式
                </Label>
                <RadioGroup
                    value={mode || voice_setting.mode}
                    onValueChange={handleModeChange}
                    className="flex gap-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tts" id="mode-tts" />
                        <Label
                            htmlFor="mode-tts"
                            className={cn(
                                "cursor-pointer font-medium transition-colors",
                                (mode || voice_setting.mode) === 'tts'
                                    ? "text-green-700 font-bold"  // Highlight green for TTS mode
                                    : "text-gray-600"
                            )}
                        >
                            合成语音
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="clone" id="mode-clone" />
                        <Label
                            htmlFor="mode-clone"
                            className={cn(
                                "cursor-pointer font-medium transition-colors",
                                (mode || voice_setting.mode) === 'clone'
                                    ? "text-green-700 font-bold"  // Highlight green for Clone mode
                                    : "text-gray-600"
                            )}
                        >
                            语音克隆
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* 供应商和情感选择 - 公共部分 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium mb-2 block">供应商</Label>
                    <Select
                        value={voice_setting.vendor || 'azure'}
                        onValueChange={(value) => {
                            updateConfig({ vendor: value });
                            onVendorChange(value);
                        }}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="选择供应商" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="azure">Azure</SelectItem>
                            <SelectItem value="qwen">Qwen</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="text-sm font-medium mb-2 block">情感</Label>
                    <Select
                        value={voice_setting.emotion || 'neutral'}
                        onValueChange={(value) => updateConfig({ emotion: value })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="选择情感" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="neutral">中性 (Neutral)</SelectItem>
                            <SelectItem value="happy">开心 (Happy)</SelectItem>
                            <SelectItem value="sad">悲伤 (Sad)</SelectItem>
                            <SelectItem value="angry">生气 (Angry)</SelectItem>
                            <SelectItem value="fearful">恐惧 (Fearful)</SelectItem>
                            <SelectItem value="disgust">厌恶 (Disgust)</SelectItem>
                            <SelectItem value="surprised">大吃一惊 (Surprised)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 语音合成模式 - 独立一部分 */}
            {mode === 'tts' && (
                <VoiceSynthesisTab
                    voiceConfig={voice_setting}
                    voiceModels={voiceModels}
                    onVoiceConfigChange={updateConfig}
                    onAudioPreview={onAudioPreview}
                    isGeneratingAudio={isGeneratingAudio}
                    audioPreviewUrl={audioPreviewUrl_tts}
                />
            )}

            {/* 声音克隆模式 - 独立一部分 */}
            {mode === 'clone' && (
                <VoiceCloningTab
                    voiceSetting={voice_setting}
                    audioPreviewUrl={audioPreviewUrl_clone}
                    onVoiceSettingChange={updateConfig}
                    onSaveVoiceSetting={onVoiceSettingSave}
                    onVoiceClone={onVoiceClone}
                />
            )}

            {/* 试听效果 - 公共部分 */}
            <div className="border-t pt-4 mt-6">
                <Label className="text-sm font-medium mb-3 block">试听效果</Label>
                <div className="space-y-3">
                    {currentAudioPreviewUrl && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-sm text-gray-600 mb-2">试听音频：</p>
                            <audio
                                controls
                                className="w-full"
                                src={currentAudioPreviewUrl}
                                controlsList="nodownload"
                            >
                                您的浏览器不支持音频播放。
                            </audio>
                        </div>
                    )}
                </div>
            </div>

            {/* 主播音声音开关 - 只有在主播模式下显示 */}
            {projectDetail?.narration === true && mode === 'tts' && (
                <div className="flex items-center space-x-2 py-2 border-t">
                    <div className="bg-blue-50 px-3 py-1 rounded text-xs text-blue-600">
                        主播模式
                    </div>
                    <Checkbox
                        id="is-master-asset"
                        checked={voice_setting.is_master || false}
                        onCheckedChange={(checked) => updateConfig({ is_master: !!checked })}
                    />
                    <Label
                        htmlFor="is-master-asset"
                        className="text-sm font-medium leading-none cursor-pointer"
                    >
                        是否主播音声音
                    </Label>
                </div>
            )}

            {/* 保存按钮 */}
            <div className="flex justify-end pt-4 mt-6 border-t">
                <Button
                    className="bg-blue-600 hover:bg-blue-700 px-8 h-12 shadow-lg transition-all active:scale-[0.95]"
                    onClick={onVoiceSettingSave}
                    disabled={mode === 'clone' ? !voice_setting.clone?.voice : !voice_setting.tts?.voice}
                >
                    保存语音配置
                </Button>
            </div>
        </div>
    )
}
