'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { VoiceConfig, SelectedAsset } from '../../value-assets/types'

interface AudioConfigTabProps {
    selectedAsset: SelectedAsset
    voiceModels: any[]
    isGeneratingAudio: boolean
    audioPreviewUrl: string
    onAudioPreview: () => void
    onSaveVoiceConfig: () => void
    onVoiceConfigChange: (config: VoiceConfig) => void
    projectDetail: any
    onVendorChange: (vendor: string) => void
}

export const AudioConfigTab: React.FC<AudioConfigTabProps> = ({
    selectedAsset,
    voiceModels,
    isGeneratingAudio,
    audioPreviewUrl,
    onAudioPreview,
    onSaveVoiceConfig,
    onVoiceConfigChange,
    projectDetail,
    onVendorChange
}) => {
    const voiceConfig = selectedAsset.voiceConfig || {
        voice: '',
        voice_name: '',
        desc: '',
        gender: 'female',
        emotion: 'neutral',
        vendor: 'azure',
        is_master: false
    }

    const updateConfig = (updates: Partial<VoiceConfig>) => {
        onVoiceConfigChange({ ...voiceConfig, ...updates })
    }

    console.log(`[Audio] Generating: ${isGeneratingAudio}, Voice: ${JSON.stringify(voiceConfig)}`)
    return (
        <div className="space-y-4">

            {/* Gender Selection */}
            <div>
                <Label className="text-sm font-medium mb-2 block">性别</Label>
                <RadioGroup
                    value={voiceConfig.gender}
                    onValueChange={(value: string) => updateConfig({ gender: value })}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="gender-male" />
                        <Label htmlFor="gender-male" className="cursor-pointer">男</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="gender-female" />
                        <Label htmlFor="gender-female" className="cursor-pointer">女</Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Vendor Selection */}
            <div>
                <Label className="text-sm font-medium mb-2 block">供应商</Label>
                <Select
                    value={voiceConfig.vendor || 'azure'}
                    onValueChange={(value) => {
                        updateConfig({ vendor: value });
                        onVendorChange(value);
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择供应商" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="azure">Azure</SelectItem>
                        <SelectItem value="qwen">Qwen</SelectItem>
                    </SelectContent>
                </Select>
            </div>


            {/* Voice Model Selection */}
            <div>
                <Label className="text-sm font-medium mb-2 block">语音模型</Label>
                <Select
                    value={voiceConfig.voice}
                    onValueChange={(value) => {
                        const model = voiceModels.find(m => m.voice === value);
                        if (model) {
                            updateConfig({
                                voice: model.voice,
                                voice_name: model.voice_name,
                                gender: model.gender
                            });
                        }
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择语音模型" />
                    </SelectTrigger>
                    <SelectContent>
                        {voiceModels
                            .filter(model => !voiceConfig.gender || model.gender === voiceConfig.gender)
                            .map((model) => (
                                <SelectItem key={model.voice} value={model.voice}>
                                    {model.voice_name} ({model.desc})
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Emotion Selection */}
            <div>
                <Label className="text-sm font-medium mb-2 block">情感</Label>
                <Select
                    value={voiceConfig.emotion || 'neutral'}
                    onValueChange={(value) => updateConfig({ emotion: value })}
                >
                    <SelectTrigger className="w-full">
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

            {/* Additional Description */}
            <div>
                <Label className="text-sm font-medium mb-2 block">补充描述 (可选)</Label>
                <Textarea
                    value={voiceConfig.desc || ''}
                    onChange={(e) => updateConfig({ desc: e.target.value })}
                    placeholder="输入补充描述..."
                    className="w-full min-h-[80px] resize-none"
                    maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                    {(voiceConfig.desc || '').length}/200 字符
                </div>
            </div>

            {/* Master Anchor Selection */
                console.log(projectDetail)
            }
            {projectDetail?.narration === true && (
                <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                        id="is-master-asset"
                        checked={voiceConfig.is_master || false}
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



            <div className="border-t pt-4 mt-6">
                <Label className="text-sm font-medium mb-3 block">试听效果</Label>
                <div className="space-y-3">

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                        onClick={onAudioPreview}
                        disabled={isGeneratingAudio || !voiceConfig.voice}
                    >
                        {isGeneratingAudio ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            '生成试听音频'
                        )}
                    </Button>

                    {audioPreviewUrl && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-sm text-gray-600 mb-2">试听音频：</p>
                            <audio
                                controls
                                className="w-full"
                                src={audioPreviewUrl}
                                controlsList="nodownload"
                            >
                                您的浏览器不支持音频播放。
                            </audio>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t font-bold">
                <Button
                    className="bg-blue-600 hover:bg-blue-700 px-8 h-12 shadow-lg transition-all active:scale-[0.95]"
                    onClick={onSaveVoiceConfig}
                    disabled={!voiceConfig.voice}
                >
                    保存语音配置
                </Button>
            </div>
        </div>
    )
}
