'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
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
}

export const AudioConfigTab: React.FC<AudioConfigTabProps> = ({
    selectedAsset,
    voiceModels,
    isGeneratingAudio,
    audioPreviewUrl,
    onAudioPreview,
    onSaveVoiceConfig,
    onVoiceConfigChange
}) => {
    const voiceConfig = selectedAsset.voiceConfig || {
        voice: '',
        voice_name: '',
        desc: '',
        gender: 'female',
        ttsEngine: 'qwen',
        emotion: 'neutral',
        extraDesc: ''
    }

    const updateConfig = (updates: Partial<VoiceConfig>) => {
        onVoiceConfigChange({ ...voiceConfig, ...updates })
    }

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
                                desc: model.desc,
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

            {/* Extra Description */}
            <div>
                <Label className="text-sm font-medium mb-2 block">补充描述 (可选)</Label>
                <Textarea
                    value={voiceConfig.extraDesc || ''}
                    onChange={(e) => updateConfig({ extraDesc: e.target.value })}
                    placeholder="输入补充描述..."
                    className="w-full min-h-[80px] resize-none"
                    maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                    {(voiceConfig.extraDesc || '').length}/200 字符
                </div>
            </div>

            {/* TTS Engine - Hidden as per requirement */}
            <div className="hidden">
                <Label className="text-sm font-medium mb-2 block">TTS引擎</Label>
                <Select
                    value={voiceConfig.ttsEngine}
                    onValueChange={(value) => updateConfig({ ttsEngine: value })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择TTS引擎" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="qwen">qwen</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Preview Audio Section */

                console.log(`[Audio] Generating: ${isGeneratingAudio}, Voice: ${JSON.stringify(voiceConfig)}`)


            }

            <div className="border-t pt-4 mt-6">
                <Label className="text-sm font-medium mb-3 block">试听效果</Label>
                <div className="space-y-3">

                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
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

            {/* Save Button */}
            <div className="flex justify-end pt-4 mt-4 border-t">
                <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={onSaveVoiceConfig}
                    disabled={!voiceConfig.voice}
                >
                    保存语音配置
                </Button>
            </div>
        </div>
    )
}
