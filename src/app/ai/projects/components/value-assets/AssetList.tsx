'use client'

import React from 'react'
import { User, Plus } from 'lucide-react'
import { Asset, SelectedAsset } from '../../value-assets/types'
import { Package } from 'lucide-react'

interface AssetListProps {
    characters: Asset[]
    resourceAssets: Asset[]
    selectedAsset: SelectedAsset | null
    onSelectAsset: (asset: Asset) => void
    onAddResource: () => void
}

export const AssetList: React.FC<AssetListProps> = ({
    characters,
    resourceAssets,
    selectedAsset,
    onSelectAsset,
    onAddResource
}) => {
    return (
        <div className="w-80 flex-shrink-0 space-y-4">
            {/* Character List */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-500" />
                        角色列表
                    </h2>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                    {characters?.map((char) => (
                        <div
                            key={char.id}
                            onClick={() => onSelectAsset(char)}
                            className={`p-3 rounded-md cursor-pointer transition-all mb-1 ${selectedAsset && selectedAsset.id === char.id
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'hover:bg-gray-100 border-2 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-sm">{char.name}</span>
                            </div>
                        </div>
                    ))}
                    {(characters?.length === 0) && (
                        <div className="p-4 text-center text-gray-400 text-sm">
                            暂无角色
                        </div>
                    )}
                </div>
            </div>

            {/* Resource Assets */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-500" />
                        资源素材
                    </h2>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                    {resourceAssets?.map((resource) => (
                        <div
                            key={resource.id}
                            onClick={() => onSelectAsset(resource)}
                            className={`p-3 rounded-md cursor-pointer transition-all mb-1 ${selectedAsset && selectedAsset.id === resource.id
                                ? 'bg-green-100 border-2 border-green-500'
                                : 'hover:bg-gray-100 border-2 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-sm">{resource.name}</span>
                            </div>
                        </div>
                    ))}

                    {/* Add Resource Button */}
                    <div
                        onClick={onAddResource}
                        className="p-3 rounded-md cursor-pointer transition-all mb-1 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50"
                    >
                        <div className="flex items-center gap-2 justify-center text-gray-500 hover:text-green-600">
                            <Plus className="w-4 h-4" />
                            <span className="font-medium text-sm">添加资源</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
