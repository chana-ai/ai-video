'use client'

import React from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { VoiceSetting } from '../../../value-assets/types'

interface VoiceSynthesisTabProps {
    voiceConfig: VoiceSetting
    voiceModels: any[]
    onVoiceConfigChange: (config: VoiceSetting) => void
    onAudioPreview: () => Promise<void>
    isGeneratingAudio: boolean
    audioPreviewUrl: string
}

export const VoiceSynthesisTab: React.FC<VoiceSynthesisTabProps> = ({
    voiceConfig,
    voiceModels,
    onVoiceConfigChange,
    onAudioPreview,
    isGeneratingAudio,
    audioPreviewUrl
}) => {
    // Log voice_config whenever it changes
    React.useEffect(() => {
        console.log('voice_config:', voiceConfig);
    }, [voiceConfig]);

    const updateTtsConfig = (updates: Partial<NonNullable<VoiceSetting['tts']>>) => {
        onVoiceConfigChange({
            ...voiceConfig,
            tts: {
                voice: voiceConfig.tts?.voice || '',
                voice_name: voiceConfig.tts?.voice_name || '',
                desc: voiceConfig.tts?.desc || '',
                url: voiceConfig.tts?.url || '',
                ...updates
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* 性别选择 - 独立一部分 */}
            <div>
                <Label className="text-sm font-medium mb-2 block">性别</Label>
                <RadioGroup
                    value={voiceConfig.gender || 'female'}
                    onValueChange={(value: string) => onVoiceConfigChange({ ...voiceConfig, gender: value })}
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
                    value={voiceConfig.tts?.voice || ''}
                    onValueChange={(value) => {
                        const model = voiceModels.find(m => m.voice === value);
                        if (model) {
                            onVoiceConfigChange({
                                ...voiceConfig,
                                gender: model.gender || voiceConfig.gender,
                                tts: {
                                    url: voiceConfig.tts?.url || '',
                                    voice: model.voice,
                                    voice_name: model.voice_name,
                                    desc: model.desc || ''
                                }
                            });
                        } else {
                            // Clear voice if no model found
                            onVoiceConfigChange({
                                ...voiceConfig,
                                tts: {
                                    url: voiceConfig.tts?.url || '',
                                    voice: '',
                                    voice_name: '',
                                    desc: ''
                                }
                            })
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
                    value={voiceConfig.tts?.desc || ''}
                    onChange={(e) => updateTtsConfig({ desc: e.target.value })}
                    placeholder="输入补充描述..."
                    className="w-full min-h-[80px] resize-none"
                    maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                    {(voiceConfig.tts?.desc || '').length}/200 字符
                </div>
            </div>

            {/* 生成试听音频 */}
            <div className="border-t pt-4 mt-4">
                <Label className="text-sm font-medium mb-3 block">生成试听音频</Label>
                <div className="space-y-3">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                        onClick={onAudioPreview}
                        disabled={isGeneratingAudio || !voiceConfig.tts?.voice}
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

                    {/* {audioPreviewUrl && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-sm font-medium mb-2">试听音频：</p>
                            <audio
                                controls
                                className="w-full"
                                src={audioPreviewUrl}
                                controlsList="nodownload"
                            >
                                您的浏览器不支持音频播放。
                            </audio>
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    )
}
