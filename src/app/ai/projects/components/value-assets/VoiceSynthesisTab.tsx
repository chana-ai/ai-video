'use client'

import React from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VoiceConfig } from '../../value-assets/types'

interface VoiceSynthesisTabProps {
    voiceConfig: VoiceConfig
    voiceModels: any[]
    onVoiceConfigChange: (config: VoiceConfig) => void
}

export const VoiceSynthesisTab: React.FC<VoiceSynthesisTabProps> = ({
    voiceConfig,
    voiceModels,
    onVoiceConfigChange
}) => {
    const updateConfig = (updates: Partial<VoiceConfig>) => {
        onVoiceConfigChange({ ...voiceConfig, ...updates })
    }

    return (
        <div className="space-y-4">
            {/* 性别选择 - 独立一部分 */}
            <div>
                <Label className="text-sm font-medium mb-2 block">性别</Label>
                <RadioGroup
                    value={voiceConfig.gender || 'female'}
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

            {/* 语音模型选择 - 独立一部分 */}
            <div>
                <Label className="text-sm font-medium mb-2 block">语音模型</Label>
                <Select
                    value={typeof voiceConfig.voice === 'string' ? voiceConfig.voice : ''}
                    onValueChange={(value) => {
                        const model = voiceModels.find(m => m.voice === value);
                        if (model) {
                            updateConfig({
                                voice: model.voice,
                                voice_name: model.voice_name,
                                gender: model.gender || voiceConfig.gender
                            });
                        } else {
                            // Clear voice if no model found
                            updateConfig({ voice: '', voice_name: '' })
                        }
                    }}
                >
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder={voiceModels.length > 0 ? "选择语音模型" : "加载中..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {voiceModels.length > 0 ? (
                            voiceModels
                                .filter(model => !voiceConfig.gender || model.gender === voiceConfig.gender)
                                .map((model) => (
                                    <SelectItem key={model.voice} value={model.voice}>
                                        {model.voice_name} ({model.desc})
                                    </SelectItem>
                                ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                正在加载语音模型...
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* 补充描述 - 独立一部分 */}
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
        </div>
    )
}
