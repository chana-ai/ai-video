'use client'

import React from 'react'
import { ImageIcon, Volume2, Package } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SelectedAsset, VoiceConfig } from '../../value-assets/types'
import { ImageConfigTab } from './ImageConfigTab'
import { AudioConfigTab } from './AudioConfigTab'

interface AssetDetailProps {
    selectedAsset: SelectedAsset | null
    voiceModels: any[]
    isGenerating: boolean
    isGeneratingAudio: boolean
    audioPreviewUrl: string
    selectedRowIndex: number | null
    errors: string
    uploadingImage: boolean
    onPromptChange: (value: string) => void
    onGenerateImages: () => void
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onAudioPreview: () => void
    onRowSelect: (index: number | null) => void
    onNextClick: () => void
    onSaveVoiceConfig: () => void
    onVoiceConfigChange: (config: VoiceConfig) => void
}

export const AssetDetail: React.FC<AssetDetailProps> = ({
    selectedAsset,
    voiceModels,
    isGenerating,
    isGeneratingAudio,
    audioPreviewUrl,
    selectedRowIndex,
    errors,
    uploadingImage,
    onPromptChange,
    onGenerateImages,
    onImageUpload,
    onAudioPreview,
    onRowSelect,
    onNextClick,
    onSaveVoiceConfig,
    onVoiceConfigChange
}) => {
    if (!selectedAsset) {
        return (
            <div className="bg-white rounded-lg p-12 border shadow-sm">
                <div className="text-center text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>请从左侧选择一个角色或资源素材</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            {/* Header */}
            <div className="p-6 border-b">
                <h3 className="text-lg font-semibold mb-2">
                    {selectedAsset.name}
                </h3>
                <p className="text-sm text-gray-600">
                    {selectedAsset.description || '暂无描述'}
                </p>
            </div>

            {/* Tabs for Characters, Single view for Resources */}
            {selectedAsset.type === 'character' ? (
                <Tabs defaultValue="image" className="w-full">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2">
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

                    <TabsContent value="image" className="p-6">
                        <ImageConfigTab
                            selectedAsset={selectedAsset}
                            isGenerating={isGenerating}
                            selectedRowIndex={selectedRowIndex}
                            errors={errors}
                            uploadingImage={uploadingImage}
                            onPromptChange={onPromptChange}
                            onGenerateImages={onGenerateImages}
                            onImageUpload={onImageUpload}
                            onRowSelect={onRowSelect}
                            onNextClick={onNextClick}
                        />
                    </TabsContent>

                    <TabsContent value="audio" className="p-6">
                        <AudioConfigTab
                            selectedAsset={selectedAsset}
                            voiceModels={voiceModels}
                            isGeneratingAudio={isGeneratingAudio}
                            audioPreviewUrl={audioPreviewUrl}
                            onAudioPreview={onAudioPreview}
                            onSaveVoiceConfig={onSaveVoiceConfig}
                            onVoiceConfigChange={onVoiceConfigChange}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                /* Resource Assets - Single View */
                <div className="p-6">
                    <ImageConfigTab
                        selectedAsset={selectedAsset}
                        isGenerating={isGenerating}
                        selectedRowIndex={selectedRowIndex}
                        errors={errors}
                        uploadingImage={uploadingImage}
                        onPromptChange={onPromptChange}
                        onGenerateImages={onGenerateImages}
                        onImageUpload={onImageUpload}
                        onRowSelect={onRowSelect}
                        onNextClick={onNextClick}
                    />
                </div>
            )}
        </div>
    )
}
