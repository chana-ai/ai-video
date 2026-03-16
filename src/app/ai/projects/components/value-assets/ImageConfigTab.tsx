'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ValueAssetsImageGrid } from '../value-assets-image-grid'
import { SelectedAsset } from '../../value-assets/types'

interface ImageConfigTabProps {
    selectedAsset: SelectedAsset
    isGenerating: boolean
    selectedRowIndex: number | null
    errors: string
    uploadingImage: boolean
    onPromptChange: (value: string) => void
    onGenerateImages: () => void
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRowSelect: (index: number | null) => void
    onNextClick: () => void
}

export const ImageConfigTab: React.FC<ImageConfigTabProps> = ({
    selectedAsset,
    isGenerating,
    selectedRowIndex,
    errors,
    uploadingImage,
    onPromptChange,
    onGenerateImages,
    onImageUpload,
    onRowSelect,
    onNextClick
}) => {
    return (
        <div className="space-y-6">
            {/* Prompt Input */}
            <div>
                <Label className="text-sm font-medium mb-2 block">提示词</Label>
                <textarea
                    value={selectedAsset.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="输入提示词 (最多120字符)"
                    className="w-full min-h-[120px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={120}
                />
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                        {selectedAsset.prompt.length}/120 字符
                    </span>
                    <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={onGenerateImages}
                        disabled={isGenerating || selectedAsset.images.length >= 12}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            '生成图像'
                        )}
                    </Button>
                </div>
                {errors && (
                    <p className="text-red-500 mt-2 text-sm">{errors}</p>
                )}
            </div>

            {/* Image Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">图像列表 (3列/行, 最多4行)</h4>
                    <input
                        type="file"
                        id={`image-upload-${selectedAsset.type}`}
                        accept="image/*"
                        onChange={onImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                    />
                </div>
                <ValueAssetsImageGrid
                    images={selectedAsset.images}
                    isLoading={isGenerating}
                    selectedRowIndex={selectedRowIndex}
                    onRowSelect={onRowSelect}
                    onUploadClick={() => document.getElementById(`image-upload-${selectedAsset.type}`)?.click()}
                />
            </div>

            <div className="flex justify-end">
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={onNextClick}
                >
                    下一步
                </Button>
            </div>
        </div>
    )
}
