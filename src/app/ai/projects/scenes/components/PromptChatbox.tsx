"use client"

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Mention from "@tiptap/extension-mention"
import { Button } from "@/components/ui/button"
import { Loader2, Info, Users, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PreviewImageList } from './ImageControl'

import suggestion from './suggestion'

interface Asset {
    id: number
    name: string
    images?: { id: number; url: string }[]
}

interface PromptChatboxProps {
    initialValue?: string
    assets: Asset[]
    onGenerate: (prompt: string, resolvedAssets: Record<string, number>) => Promise<void>
    isGenerating: boolean
    onImagePromptChange?: (prompt: string) => void
    onConfirmAssetImage?: (assetName: string, imageId: number, prompt: string) => void
    asset_image_map?: Record<string, number>  // New prop: asset_name -> image_id mapping
}

// Extend Mention to handle 'resolved' attribute
const CustomMention = Mention.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            resolved: {
                default: false,
                parseHTML: element => element.getAttribute('data-resolved') === 'true',
                renderHTML: attributes => {
                    return {
                        'data-resolved': attributes.resolved,
                    }
                },
            },
        }
    },
})

export function PromptChatbox({
    initialValue = "",
    assets,
    onGenerate,
    isGenerating,
    onImagePromptChange,
    onConfirmAssetImage,
    asset_image_map = {}
}: PromptChatboxProps) {
    const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false)
    const [activeAsset, setActiveAsset] = useState<Asset | null>(null)
    const [resolvedAssets, setResolvedAssets] = useState<Record<string, number>>({})

    // Use ref to store current assets so suggestion can access the latest values
    const assetsRef = useRef<Asset[]>(assets)

    useEffect(() => {
        console.log('PromptChatbox assets updated:', assets.length, assets)
        assetsRef.current = assets
    }, [assets])

    const editor = useEditor({
        extensions: [
            StarterKit,
            CustomMention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
                suggestion: useMemo(() => suggestion(assetsRef), [assetsRef]),
            }),
        ],
        content: initialValue,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none min-h-[60px] p-4 text-sm leading-relaxed text-gray-700 font-mono',
            },
            handleClick(view, pos, event) {
                // 1. 查找被点击的元素是否属于 mention 标签
                const mentionEl = (event.target as HTMLElement).closest('.mention')

                if (mentionEl) {
                    // 2. 从 DOM 文本内容中提取名字（例如去掉前面的 '@'）
                    const assetName = mentionEl.textContent?.replace(/^@/, '').trim()
                    const asset = assetsRef.current.find(a => a.name === assetName)

                    if (asset) {
                        setActiveAsset(asset)
                        setIsAssetDialogOpen(true)
                        return true
                    }
                }
                return false
            },
        }
    })

    const hasContent = useMemo(() => {
        if (!editor) return false
        return editor.getText().trim().length > 0
    }, [editor])

    const unresolvedMentions = useMemo(() => {
        if (!editor) return []
        const mentions: string[] = []
        editor.state.doc.descendants((node) => {
            if (node.type.name === 'mention') {
                const assetName = node.attrs.label
                if (!resolvedAssets[assetName]) {
                    mentions.push(assetName)
                }
            }
        })
        return mentions
    }, [editor?.state.doc, resolvedAssets])

    const handleProcessSubmission = useCallback(async () => {
        if (!editor || isGenerating) return
        const text = editor.getText()
        if (!text.trim()) return

        if (unresolvedMentions.length > 0) {
            const firstUnresolved = assets.find(a => a.name === unresolvedMentions[0])
            if (firstUnresolved) {
                setActiveAsset(firstUnresolved)
                setIsAssetDialogOpen(true)
            }
            return
        }

        if (onImagePromptChange) {
            onImagePromptChange(text)
        }

        // Merge resolvedAssets with asset_image_map
        const mergedAssetImageMap = { ...resolvedAssets, ...asset_image_map }

        editor.commands.clearContent()
        await onGenerate(text, mergedAssetImageMap)
    }, [editor, isGenerating, unresolvedMentions, assets, onGenerate, resolvedAssets, onImagePromptChange])

    const selectAssetImage = (imageId: number) => {
        if (activeAsset) {
            const currentText = editor?.getText() || ""
            setResolvedAssets(prev => ({ ...prev, [activeAsset.name]: imageId }))
            setIsAssetDialogOpen(false)

            if (onConfirmAssetImage) {
                onConfirmAssetImage(activeAsset.name, imageId, currentText)
            }
        }
    }

    return (
        <>
            <div className="flex flex-col h-[400px] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden relative">
                <div className="flex-1 p-4 relative">
                    <EditorContent editor={editor} />
                </div>

                {!hasContent && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-700 text-white text-[10px] px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300">
                        换行请用 shift+enter
                    </div>
                )}

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    {unresolvedMentions.length > 0 && (
                        <span className="text-[9px] text-red-500 font-bold bg-white border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Info className="h-2.5 w-2.5" /> Resolve {unresolvedMentions.length}
                        </span>
                    )}
                    <Button
                        size="icon"
                        className="h-8 w-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg disabled:opacity-30 transition-all shrink-0"
                        onClick={handleProcessSubmission}
                        disabled={isGenerating || !editor?.getText().trim()}
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </div>

            <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-gray-800">
                            <Users className="h-5 w-5 text-green-600" />
                            Select Image: {activeAsset?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <PreviewImageList
                        images={activeAsset?.images || []}
                        selectedImageId={activeAsset ? (resolvedAssets[activeAsset.name] || 0) : 0}
                        onImageSelect={selectAssetImage}
                        className="mt-4"
                    />
                </DialogContent>
            </Dialog>

            <style jsx global>{`
        .mention {
          cursor: pointer;
          color: #a855f7;
          background: #fdf4ff;
          padding: 0 4px;
          border-radius: 4px;
          font-weight: 600;
          transition: all 0.2s;
          display: inline-block;
        }
        .mention[data-resolved="false"] {
          text-decoration: underline;
          text-decoration-color: #ef4444;
          text-decoration-thickness: 2px;
        }
        .mention:hover {
          background: #fae8ff;
          color: #9333ea;
        }
      `}</style>
        </>
    )
}
