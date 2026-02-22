import { Check, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ImageInfo } from '../value-assets/types'

interface ValueAssetsImageGridProps {
    images: ImageInfo[];
    isLoading: boolean;
    onSelect: (index: number) => void;
    onUploadClick?: () => void;
}

export function ValueAssetsImageGrid({ images, isLoading, onSelect, onUploadClick }: ValueAssetsImageGridProps) {
    const totalSlots = 10; // 5x2 grid

    const handleImageClick = (index: number, id: number) => {
        if (images && images.length > 0) {
            console.log("click ", index, " images")
            onSelect(id)
        }
    }

    // Create array of 10 slots, filling with images or empty placeholders
    const slots = Array.from({ length: totalSlots }, (_, index) => {
        if (index < images.length) {
            return images[index];
        }
        return null;
    });

    return (
        <div className="grid grid-cols-5 gap-4">
            {slots.map((image, index) => (
                <div
                    key={index}
                    className={cn(
                        "relative group aspect-square rounded-lg overflow-hidden border-2",
                        image ? "cursor-pointer border-gray-200 hover:border-blue-400" : "cursor-pointer border-dashed border-gray-300 bg-gray-50 hover:border-green-400"
                    )}
                    onClick={() => image ? handleImageClick(index, image.id) : onUploadClick?.()}
                >
                    {image ? (
                        <>
                            <div className={cn(
                                "w-full h-full transition-transform duration-200 ease-in-out",
                                "group-hover:scale-110"
                            )}>
                                <img
                                    src={image.url}
                                    alt={`Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {isLoading && (
                                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 bg-white rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: `${i * 0.2}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {image.is_selected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-20 shadow-lg">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            {isLoading ? (
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{
                                                animationDelay: `${i * 0.2}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-green-500">
                                    <Plus className="w-6 h-6" />
                                    <span className="text-[10px] font-medium">上传</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

