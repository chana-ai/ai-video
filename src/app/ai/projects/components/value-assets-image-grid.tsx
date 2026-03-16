import { Plus, X } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ImageInfo } from '../value-assets/types'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface ValueAssetsImageGridProps {
    images: ImageInfo[];
    isLoading: boolean;
    selectedRowIndex: number | null;
    onRowSelect: (index: number | null) => void;
    onUploadClick?: (row: number, col: number) => void;
}

export function ValueAssetsImageGrid({ images, isLoading, selectedRowIndex, onRowSelect, onUploadClick }: ValueAssetsImageGridProps) {
    const maxRows = 4;
    const colsPerRow = 3;
    const labels = ["正面图", "侧面图", "背面图"];

    // Calculate how many rows to display
    const numFilledRows = Math.ceil(images.length / colsPerRow);
    const isLastRowFull = images.length > 0 && images.length % colsPerRow === 0;
    const showEmptyRow = selectedRowIndex === null && (images.length === 0 || isLastRowFull) && numFilledRows < maxRows;
    const displayRows = Math.min(maxRows, showEmptyRow ? numFilledRows + 1 : Math.max(1, numFilledRows));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-dashed border-gray-200">
                <span className="text-sm text-gray-500 font-medium ml-2">选择初始图片行进行生成</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRowSelect(null)}
                    className="h-8 text-gray-500 hover:text-red-500 flex items-center gap-1 text-xs"
                >
                    <X className="w-3.5 h-3.5" />
                    取消选择 (Unselect All)
                </Button>
            </div>

            {/* Table Header Labels */}
            <div className="flex items-center gap-6 px-4">
                <div className="w-4" /> {/* Spacer for radio button (w-4 roughly matches w-4 radio item) */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                    {labels.map((label, i) => (
                        <div key={i} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            <RadioGroup
                value={selectedRowIndex !== null ? selectedRowIndex.toString() : ""}
                onValueChange={(val) => onRowSelect(val ? parseInt(val) : null)}
                className="space-y-2"
            >
                {Array.from({ length: displayRows }).map((_, rowIndex) => {
                    const rowImages = images.slice(rowIndex * colsPerRow, (rowIndex + 1) * colsPerRow);

                    return (
                        <div key={rowIndex} className={cn(
                            "group p-2 rounded-lg border-2 transition-all duration-200",
                            selectedRowIndex === rowIndex
                                ? "bg-blue-50/30 border-blue-400 shadow-sm"
                                : "bg-white border-gray-100 hover:border-gray-200"
                        )}>
                            <div className="flex items-center gap-6 px-2">
                                <RadioGroupItem
                                    value={rowIndex.toString()}
                                    id={`row-${rowIndex}`}
                                    className="border-2 w-4 h-4"
                                    disabled={rowImages.length === 0}
                                />

                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    {Array.from({ length: colsPerRow }).map((_, colIndex) => {
                                        const imageIndex = rowIndex * colsPerRow + colIndex;
                                        const image = images[imageIndex];

                                        return (
                                            <div key={colIndex} className="relative">
                                                <div
                                                    className={cn(
                                                        "relative aspect-square rounded-md border transition-all duration-300 ease-out",
                                                        image
                                                            ? "border-gray-200 hover:scale-[2] hover:z-50 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-300 cursor-zoom-in bg-white"
                                                            : "border-dashed border-gray-200 bg-gray-50/30 hover:border-green-400 hover:bg-green-50/30 cursor-pointer"
                                                    )}
                                                    onClick={() => !image && onUploadClick?.(rowIndex, colIndex)}
                                                >
                                                    <div className="w-full h-full rounded-md overflow-hidden bg-white">
                                                        {image ? (
                                                            <img
                                                                src={image.url}
                                                                alt={`Image ${imageIndex}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300">
                                                                <Plus className="w-4 h-4" />
                                                                <span className="text-[10px] uppercase font-bold tracking-tighter">上传</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isLoading && (imageIndex >= images.length) && (
                                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-md">
                                                            <div className="flex gap-1">
                                                                {[...Array(3)].map((_, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                                                                        style={{ animationDelay: `${i * 0.15}s` }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </RadioGroup>
        </div>
    );
}
