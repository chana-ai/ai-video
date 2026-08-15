'use client'

import React from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from 'lucide-react'
import { VoiceSynthesisTab } from './VoiceSynthesisTab'
import { VoiceCloningTab } from './VoiceCloningTab'

interface AudioConfigTabProps {
    selectedAsset: any
    voiceModels: any[]
    isGeneratingAudio: boolean
    audioPreviewUrl: string
    onAudioPreview: () => void
    onVoiceClone: () => void
    onSaveVoiceConfig: () => void
    onVoiceConfigChange: (config: any) => void
    projectDetail: any
    onVendorChange: (vendor: string) => void
}

export const AudioConfigTab: React.FC<AudioConfigTabProps> = ({
    selectedAsset,
    voiceModels,
    isGeneratingAudio,
    audioPreviewUrl,
    onAudioPreview,
    onVoiceClone,
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
        is_master: false,
        mode: 'tts' // tts | cloning
    }

    const updateConfig = (updates: any) => {
        // 如果切换到克隆模式，自动设置为 Qwen 供应商
        if (updates.mode === 'cloning') {
            updates = { ...updates, vendor: 'qwen' }
        }
        // 如果切换到语音合成模式，恢复供应商设置
        if (updates.mode === 'tts' && !updates.vendor) {
            updates = { ...updates, vendor: 'azure' }
        }
        onVoiceConfigChange({ ...voiceConfig, ...updates })
    }

    return (
        <div className="space-y-4">
            {/* 模式选择 - 二选一 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Label className="text-sm font-medium mb-3 block">
                    语音配置模式
                </Label>
                <RadioGroup
                    value={voiceConfig.mode || 'tts'}
                    onValueChange={(value) => updateConfig({ mode: value })}
                    className="flex gap-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tts" id="mode-tts" />
                        <Label
                            htmlFor="mode-tts"
                            className="cursor-pointer font-medium"
                        >
                            语音合成
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cloning" id="mode-cloning" />
                        <Label
                            htmlFor="mode-cloning"
                            className="cursor-pointer font-medium"
                        >
                            声音克隆
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* 供应商和情感选择 - 公共部分 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium mb-2 block">供应商</Label>
                    <Select
                        value={voiceConfig.vendor || 'azure'}
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
                        value={voiceConfig.emotion || 'neutral'}
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
            {voiceConfig.mode === 'tts' && (
                <VoiceSynthesisTab
                    voiceConfig={voiceConfig}
                    voiceModels={voiceModels}
                    onVoiceConfigChange={updateConfig}
                />
            )}

            {/* 声音克隆模式 - 独立一部分 */}
            {voiceConfig.mode === 'cloning' && (
                <VoiceCloningTab
                    voiceConfig={voiceConfig}
                    onVoiceConfigChange={updateConfig}
                    onSaveVoiceConfig={onSaveVoiceConfig}
                    projectDetail={projectDetail}
                    onAudioPreview={onAudioPreview}
                    isGeneratingAudio={isGeneratingAudio}
                    audioPreviewUrl={audioPreviewUrl}
                />
            )}

            {/* 试听效果 - 公共部分 */}
            <div className="border-t pt-4 mt-6">
                <Label className="text-sm font-medium mb-3 block">试听效果</Label>
                <div className="space-y-3">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                        onClick={voiceConfig.mode === 'cloning' ? onVoiceClone : onAudioPreview}
                        disabled={isGeneratingAudio || (voiceConfig.mode === 'cloning' && !voiceConfig.voice)}
                    >
                        {isGeneratingAudio ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            voiceConfig.mode === 'cloning' ? '克隆声音' : '生成试听音频'
                        )}
                    </Button>

                    {(audioPreviewUrl || voiceConfig.voice_url) && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-sm text-gray-600 mb-2">试听音频：</p>
                            <audio
                                controls
                                className="w-full"
                                src={audioPreviewUrl || voiceConfig.voice_url}
                                controlsList="nodownload"
                            >
                                您的浏览器不支持音频播放。
                            </audio>
                        </div>
                    )}
                </div>
            </div>

            {/* 主播音声音开关 - 只有在主播模式下显示 */}
            {projectDetail?.narration === true && voiceConfig.mode === 'tts' && (
                <div className="flex items-center space-x-2 py-2 border-t">
                    <div className="bg-blue-50 px-3 py-1 rounded text-xs text-blue-600">
                        主播模式
                    </div>
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

            {/* 保存按钮 */}
            <div className="flex justify-end pt-4 mt-6 border-t">
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
