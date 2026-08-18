'use client'

import React from 'react'
import { Loader2, RotateCcw, Star, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { SelectedAsset, Batch, ImageInfo } from '../../value-assets/types'
import { cn, formatTimeUTC8, formatDateTimeUTC8 } from "@/lib/utils"

interface ImageConfigTabProps {
    selectedAsset: SelectedAsset
    isGenerating: boolean
    errors: string
    history: Batch[]
    currentBatch: Batch | null
    selectedImageIds: Set<number>
    onPromptChange: (value: string) => void
    onGenerateImages: () => void
    onRestoreBatch: (batch: Batch) => void
    onSetSelectedImageIds: (ids: Set<number>) => void
    onRefresh?: () => void
    onSaveBatch?: () => void
    onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const ImageConfigTab: React.FC<ImageConfigTabProps> = ({
    selectedAsset,
    isGenerating,
    errors,
    history,
    currentBatch,
    selectedImageIds,
    onPromptChange,
    onGenerateImages,
    onRestoreBatch,
    onSetSelectedImageIds,
    onRefresh,
    onSaveBatch,
    onImageUpload
}) => {
    const [viewMode, setViewMode] = React.useState<'single' | 'multi'>('multi')
    const [generateSideBack, setGenerateSideBack] = React.useState(false)

    const handleGenerateClick = () => {
        const options: any = {
            num: viewMode === 'single' ? 1 : 3
        };
        if (generateSideBack && selectedImageIds.size === 1) {
            const refId = Array.from(selectedImageIds)[0];
            const refImage = currentBatch?.images.find(img => img.id === refId);
            options.sideBack = true;
            options.refImageId = refId;
            options.refImageUrl = refImage?.url;
            options.num = 2;  // 2张侧面和背面
        }
        // @ts-ignore - Signature updated in parent next
        onGenerateImages(options);
    }

    const toggleImageSelection = (id: number) => {
        const next = new Set(selectedImageIds)
        if (next.has(id)) {
            next.delete(id)
        } else if (next.size < 3) {
            next.add(id)
        }
        onSetSelectedImageIds(next)
    }

    const formatTime = (ts: number | string | Date) => {
        return formatTimeUTC8(ts);
    }

    return (
        <div className="flex gap-6 min-h-[800px] h-[calc(100vh-250px)] overflow-hidden">
            {/* Left Column: Generation Controls */}
            <div className="w-[320px] flex flex-col gap-6 border-r pr-6 overflow-y-auto">
                <div>
                    <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 block">提示词</Label>
                    <textarea
                        value={selectedAsset.prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder="输入提示词..."
                        className="w-full min-h-[220px] p-4 text-sm border rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        maxLength={120}
                    />
                    <div className="text-xs text-gray-400 mt-2 text-right">
                        {selectedAsset.prompt?.length}/120
                    </div>
                </div>

                <div>
                    <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 block">生成设置</Label>
                    <RadioGroup value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="single" id="single" className="w-5 h-5" />
                            <Label htmlFor="single" className="text-sm cursor-pointer font-medium">单视图(新版本)</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="multi" id="multi" className="w-5 h-5" />
                            <Label htmlFor="multi" className="text-sm cursor-pointer font-medium">多视图(新版本)</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className={cn("pt-4 p-4 bg-gray-50 rounded-xl border border-dashed", selectedImageIds.size !== 1 && "opacity-50 pointer-events-none")}>
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                            id="side-back"
                            checked={generateSideBack}
                            onChange={(e) => setGenerateSideBack(e.target.checked)}
                        />
                        <Label htmlFor="side-back" className="text-sm cursor-pointer font-bold text-gray-700">生成侧面和背面(当前版本)</Label>
                    </div>
                    {selectedImageIds.size !== 1 && (
                        <p className="text-xs text-orange-500 mt-2 ml-8">请在中间预览中选中一张作为参考图</p>
                    )}
                </div>

                <div className="mt-auto pt-4">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 shadow-lg font-bold text-base transition-all active:scale-[0.98]"
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            '立即生成图片'
                        )}
                    </Button>
                    {errors && <p className="text-[10px] text-red-500 mt-2">{errors}</p>}
                </div>
            </div>

            {/* Middle Column: Current Batch Workspace */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-base font-bold text-gray-800">当前批次工作台</h4>
                    {currentBatch && (
                        <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border shadow-sm">
                            {formatDateTimeUTC8(currentBatch.timestamp)}
                        </span>
                    )}
                </div>

                <ScrollArea className="flex-1 pr-2">
                    {currentBatch ? (
                        <div className="grid grid-cols-4 gap-6">
                            {currentBatch.images.map((img) => (
                                <div
                                    key={img.id}
                                    className={cn(
                                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group",
                                        selectedImageIds.has(img.id) ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-300"
                                    )}
                                    onClick={() => toggleImageSelection(img.id)}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    {selectedImageIds.has(img.id) && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5">
                                            <Badge variant="default" className="h-4 w-4 p-0 flex items-center justify-center border-none">
                                                ✓
                                            </Badge>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="text-[10px] text-white font-medium">正面</div>
                                    </div>
                                </div>
                            ))}

                            {/* Upload Placeholder if less than 8 images */}
                            {currentBatch.images.length < 8 && (
                                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                                    onClick={() => document.getElementById('batch-upload')?.click()}>
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 mb-2">
                                        <RotateCcw className="w-5 h-5 text-gray-400 group-hover:text-blue-500 rotate-45" />
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-blue-600">上传本地图片</span>
                                    <input
                                        id="batch-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={onImageUpload}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2">
                            <Loader2 className="w-12 h-12 stroke-1" />
                            <p className="text-sm">暂无生成内容</p>
                        </div>
                    )}
                </ScrollArea>

                {currentBatch && (
                    <div className="mt-6 pt-6 border-t flex items-center justify-between">
                        <Button
                            variant="default"
                            size="lg"
                            className="text-sm gap-2 bg-blue-600 hover:bg-blue-700 shadow-md"
                            onClick={onSaveBatch}
                            disabled={selectedImageIds.size !== 3}
                        >
                            <Star className={cn("w-4 h-4", selectedImageIds.size === 3 ? "fill-current" : "")} />
                            保存选定资源 (需选3张)
                        </Button>
                        <div className="text-sm font-medium text-gray-500">
                            已选择 <span className="text-blue-600 font-bold">{selectedImageIds.size}</span> / 3 张
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: History Pool */}
            <div className="w-[280px] flex flex-col border-l pl-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-base font-bold text-gray-800">生成历史</h4>
                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                            onClick={onRefresh}
                            title="刷新历史"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <ScrollArea className="flex-1 pr-2">
                    <div className="space-y-3">
                        {history.map((batch) => (
                            <div
                                key={batch.id}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group relative",
                                    currentBatch?.id === batch.id ? "bg-blue-50 border-blue-100" : "hover:bg-gray-100"
                                )}
                                onClick={() => onRestoreBatch(batch)}
                            >
                                <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0 relative">
                                    {batch.images[0] && <img src={batch.images[0].url} alt="" className="w-full h-full object-cover" />}
                                    {batch.version !== null && (
                                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 font-bold rounded-tl-sm">
                                            V{batch.version}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-blue-600 font-mono">
                                            {formatTime(batch.timestamp)}
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-300 group-hover:text-yellow-400 transition-colors">
                                            <Star className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{batch.images.length} 张资源图片</div>
                                </div>
                                {currentBatch?.id === batch.id && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                                )}
                            </div>
                        ))}
                        {history.length === 0 && (
                            <div className="text-center text-xs text-gray-400 pt-10">
                                暂无历史记录
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
