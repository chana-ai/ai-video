'use client'

import React from 'react'
import { ImageIcon, Volume2, Package } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SelectedAsset, VoiceConfig, Batch } from '../../value-assets/types'
import { ImageConfigTab } from './ImageConfigTab'
import { AudioConfigTab } from './AudioConfigTab'

interface AssetDetailProps {
    selectedAsset: SelectedAsset | null
    voiceModels: any[]
    isGenerating: boolean
    isGeneratingAudio: boolean
    audioPreviewUrl_tts: string
    audioPreviewUrl_clone: string
    mode: 'tts' | 'clone'
    onModeChange: (mode: 'tts' | 'clone') => void
    selectedRowIndex: number | null
    errors: string
    uploadingImage: boolean
    history: Batch[]
    currentBatch: Batch | null
    selectedImageIds: Set<number>
    onPromptChange: (value: string) => void
    onGenerateImages: (options?: any) => void
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onAudioPreview: () => Promise<void>
    onVoiceClone: (audioUrl: string, text: string) => Promise<void>
    onRowSelect: (index: number | null) => void
    onSaveVoiceConfig: () => void
    onVoiceConfigChange: (config: VoiceConfig) => void
    onRestoreBatch: (batch: Batch) => void
    onSetSelectedImageIds: (ids: Set<number>) => void
    projectDetail: any
    onVendorChange: (vendor: string) => void
    onRefresh?: () => void
    onSaveBatch?: () => void
}

export const AssetDetail: React.FC<AssetDetailProps> = ({
    selectedAsset,
    voiceModels,
    isGenerating,
    isGeneratingAudio,
    audioPreviewUrl_tts,
    audioPreviewUrl_clone,
    mode,
    onModeChange,
    selectedRowIndex,
    errors,
    uploadingImage,
    history,
    currentBatch,
    selectedImageIds,
    onPromptChange,
    onGenerateImages,
    onImageUpload,
    onAudioPreview,
    onVoiceClone,
    onRowSelect,
    onSaveVoiceConfig,
    onVoiceConfigChange,
    onRestoreBatch,
    onSetSelectedImageIds,
    projectDetail,
    onVendorChange,
    onRefresh,
    onSaveBatch
}) => {
    if (!selectedAsset) {
        return (
            <div className="bg-white rounded-lg p-12 border shadow-sm h-full">
                <div className="text-center text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>请从左侧选择一个角色或资源素材</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex-shrink-0">
                <h3 className="text-lg font-semibold mb-1">
                    {selectedAsset.name}
                </h3>
                <p className="text-sm text-gray-600">
                    {selectedAsset.description || '暂无描述'}
                </p>
            </div>

            {/* Tabs for Characters, Single view for Resources */}
            {selectedAsset.type === 'character' ? (
                <Tabs defaultValue="image" className="w-full flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4 flex-shrink-0">
                        <TabsList className="grid w-80 grid-cols-2">
                            <TabsTrigger value="image" className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                图片设置
                            </TabsTrigger>
                            <TabsTrigger value="audio" className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                音频配置
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="image" className="p-4 flex-1 min-h-0">
                        <ImageConfigTab
                            selectedAsset={selectedAsset}
                            isGenerating={isGenerating}
                            errors={errors}
                            history={history}
                            currentBatch={currentBatch}
                            selectedImageIds={selectedImageIds}
                            onPromptChange={onPromptChange}
                            onGenerateImages={onGenerateImages}
                            onRestoreBatch={onRestoreBatch}
                            onSetSelectedImageIds={onSetSelectedImageIds}
                            onRefresh={onRefresh}
                            onSaveBatch={onSaveBatch}
                            onImageUpload={onImageUpload}
                        />
                    </TabsContent>

                    <TabsContent value="audio" className="p-4 flex-1 min-h-0 overflow-y-auto">
                        <AudioConfigTab
                            selectedAsset={selectedAsset}
                            voiceModels={voiceModels}
                            isGeneratingAudio={isGeneratingAudio}
                            audioPreviewUrl_tts={audioPreviewUrl_tts}
                            audioPreviewUrl_clone={audioPreviewUrl_clone}
                            mode={mode}
                            onModeChange={onModeChange}
                            onAudioPreview={onAudioPreview}
                            projectDetail={projectDetail}
                            onVendorChange={onVendorChange}
                            onVoiceClone={onVoiceClone}
                            onSaveVoiceConfig={onSaveVoiceConfig}
                            onVoiceConfigChange={onVoiceConfigChange}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                /* Resource Assets - Single View */
                <div className="p-4 flex-1 min-h-0">
                    <ImageConfigTab
                        selectedAsset={selectedAsset}
                        isGenerating={isGenerating}
                        errors={errors}
                        history={history}
                        currentBatch={currentBatch}
                        selectedImageIds={selectedImageIds}
                        onPromptChange={onPromptChange}
                        onGenerateImages={onGenerateImages}
                        onRestoreBatch={onRestoreBatch}
                        onSetSelectedImageIds={onSetSelectedImageIds}
                        onRefresh={onRefresh}
                        onSaveBatch={onSaveBatch}
                        onImageUpload={onImageUpload}
                    />
                </div>
            )}
        </div>
    )
}
