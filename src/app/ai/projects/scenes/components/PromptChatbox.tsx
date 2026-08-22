"use client"

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { EditorContent, useEditor, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Mention from "@tiptap/extension-mention"
import { Button } from "@/components/ui/button"
import { Loader2, Info, Users, Send, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PreviewImageList } from './ImageControl'
import type { AssetImage } from '@/app/ai/projects/types'

import suggestion from './suggestion'

interface Asset {
    id: number
    name: string
    images?: { id: number; url: string }[]
}

interface PromptChatboxProps {
    prompt?: string
    assets: Asset[]
    onGenerate: (prompt: string, resolvedAssets: Record<string, AssetImage>) => Promise<void>
    isGenerating: boolean
    onImagePromptChange?: (prompt: string) => void
    onConfirmAssetImage?: (assetName: string, imageId: number, rawPrompt: string) => void
    asset_image_map?: Record<string, { asset_id: number; image_id: number }>  // asset_name -> {asset_id, image_id}
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
    // 新增 parseHTML 以识别自定义 span ==> 主要针对初始化的时候 @name 之后<space mention> 没有解析这个部分
    parseHTML() {
        return [
            {
                tag: 'span[class="mention"]',
                getAttrs: (node) => {
                    const el = node as HTMLElement
                    return {
                        label: el.getAttribute('data-asset-name') || '',
                        resolved: el.getAttribute('data-resolved') === 'true',
                    }
                }
            }
        ]
    }
})

export function PromptChatbox({
    prompt = "",
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
    const [showHintPopup, setShowHintPopup] = useState(true)

    // Use ref to store current assets so suggestion can access the latest values
    const assetsRef = useRef<Asset[]>(assets)
    const resolvedAssetsRef = useRef<Record<string, number>>(resolvedAssets)
    const editorRef = useRef<Editor | null>(null)

    const currentRawPromptRef = useRef<string>(prompt) // Store raw prompt ref

    // Auto-hide hint popup after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowHintPopup(false)
        }, 5000)
        return () => clearTimeout(timer)
    }, [])

    // Initialize resolved assets from asset_image_map
    useEffect(() => {
        if (!editorRef.current) return

        const initialResolved: Record<string, number> = {}
        if (asset_image_map) {
            Object.entries(asset_image_map).forEach(([assetName, entry]) => {
                if (entry && typeof entry === 'object' && 'image_id' in entry && entry.image_id != 0) {
                    initialResolved[assetName] = entry.image_id
                }
            })
        }
        setResolvedAssets(initialResolved)
    }, [asset_image_map])

    // Sync resolvedAssets state to resolvedAssetsRef
    useEffect(() => {
        resolvedAssetsRef.current = resolvedAssets
    }, [resolvedAssets])

    useEffect(() => {
        console.log('PromptChatbox assets updated:', assets.length, assets)
        assetsRef.current = assets
    }, [assets])

    // Parse prompt and convert @name mentions to mentions with resolved state
    useEffect(() => {
        if (!editorRef.current) return

        // Only process prompt if editor is empty
        const currentText = editorRef.current.getText().trim()
        // if (currentText) {
        //     // Store current raw text for submission
        //     currentRawPromptRef.current = currentText
        //     return
        // }

        if (!prompt) {
            currentRawPromptRef.current = ""
            return
        }

        // Replace @name with mention nodes
        const regex = /@(\S+)/g
        const newContent = prompt.replace(regex, (match: string, assetName: string) => {
            const asset = assets.find(a => a.name === assetName)
            if (asset) {
                // Check if this asset has an image assigned
                const isResolved = asset_image_map && asset_image_map[assetName] && 'image_id' in asset_image_map[assetName] && asset_image_map[assetName]['image_id'] != 0
                return isResolved
                    ? `<span class="mention" data-resolved="true" data-asset-name="${assetName}">@${assetName}</span>`
                    : `<span class="mention" data-resolved="false" data-asset-name="${assetName}">@${assetName}</span>`
            }
            return match
        })

        // Update editor content only if it's different from current prompt
        if (editorRef.current.getText() !== newContent) {
            editorRef.current.commands.setContent(newContent)
        }

        // Update raw prompt ref
        currentRawPromptRef.current = prompt
    }, [prompt, assets, asset_image_map])

    // Update mentions in editor when resolvedAssets changes
    useEffect(() => {
        if (!editorRef.current || !editorRef.current.state) return

        // Check if editor has mentions
        let hasMentions = false
        editorRef.current.state.doc.descendants((node) => {
            if (node.type.name === 'mention') {
                hasMentions = true
                return true // Stop traversal if found
            }
        })

        if (!hasMentions) return

        // Get the current editor state
        const state = editorRef.current.state
        if (!state) return

        // Update mentions with new resolved state by traversing nodes
        const tr = state.tr
        let updated = false

        editorRef.current.state.doc.descendants((node, pos) => {
            if (node.type.name === 'mention') {
                const assetName = node.attrs.label || node.attrs.dataAssetName
                const isResolved = resolvedAssets[assetName] !== undefined

                // Check if we need to update this mention
                const currentResolved = node.attrs.resolved === 'true'
                if (currentResolved !== isResolved) {
                    // Update the mention's resolved attribute
                    tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        resolved: isResolved
                    })
                    updated = true
                }
            }
        })

        // Only dispatch if something was updated
        if (!updated) return

        // Dispatch the transaction to apply changes
        editorRef.current.view.dispatch(tr)

        // Restore cursor position to its original position
        try {
            const { from, to } = state.selection
            if (from > 0 && from <= tr.doc.content.size) {
                editorRef.current.commands.focus()
                editorRef.current.commands.setNodeSelection(from)
            }
        } catch (error) {
            console.error('Error restoring cursor position:', error)
        }
    }, [resolvedAssets])

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
        immediatelyRender: false,
        // onUpdate: ({ editor, transaction }) => {
        //     // Check if mention nodes were added
        //     transaction.doc.descendants((node, pos) => {
        //         if (node.type.name === 'mention') {
        //             const assetName = node.attrs.label || node.attrs.dataAssetName

        //             // Check if this mention was added in this transaction
        //             // by checking if the node's position is within the transaction's content
        //             if (pos >= transaction.from && pos < transaction.from + transaction.doc.content.size) {
        //                 // This mention was added in the transaction

        //                 // Check if this asset is already resolved
        //                 const isResolved = resolvedAssetsRef.current[assetName] !== undefined

        //                 // Check if we need to update the mention's resolved attribute
        //                 const currentResolved = node.attrs.resolved === true
        //                 if (currentResolved !== isResolved) {
        //                     // Update the mention's resolved attribute
        //                     const tr = editor.state.tr
        //                     tr.setNodeMarkup(pos, undefined, {
        //                         ...node.attrs,
        //                         resolved: isResolved
        //                     })
        //                     editor.view.dispatch(tr)
        //                 }
        //             }
        //         }
        //     })
        // },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none min-h-[60px] p-4 text-sm leading-relaxed text-gray-700 font-mono',
            },
            handleClick(view: any, pos: number, event: any) {
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

    // Store editor ref and sync when editor becomes available
    useEffect(() => {
        if (editor) {
            editorRef.current = editor
        }
    }, [editor])

    // Sync editor content when prompt prop changes (real-time updates)
    useEffect(() => {
        // If editor is ready and empty, sync with prompt prop
        if (editorRef.current && !editorRef.current.getText().trim()) {
            // Check if we need to update content
            const currentText = editorRef.current.getText()
            if (currentText !== prompt) {
                editorRef.current.commands.setContent(prompt)
            }
            currentRawPromptRef.current = prompt
            return
        }

        // If editor has content, just update the raw prompt ref
        currentRawPromptRef.current = editorRef.current?.getText() || prompt
    }, [prompt])

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

        // Use raw text without styling (mentions converted back to text)
        const rawText = currentRawPromptRef.current
        if (!rawText.trim()) return

        // Check for unresolved mentions
        if (unresolvedMentions.length > 0) {
            const firstUnresolved = assets.find(a => a.name === unresolvedMentions[0])
            if (firstUnresolved) {
                setActiveAsset(firstUnresolved)
                setIsAssetDialogOpen(true)
            }
            return
        }

        if (onImagePromptChange) {
            onImagePromptChange(rawText)
        }

        // Merge resolvedAssets with asset_image_map, converting to new structure
        const mergedAssetImageMap: Record<string, { asset_id: number, name: string, image_id: number }> = {}

        // Add entries from asset_image_map
        if (asset_image_map) {
            Object.entries(asset_image_map).forEach(([assetName, entry]) => {
                if (entry && typeof entry === 'object' && 'image_id' in entry) {
                    if (entry.image_id == 0) return;
                    mergedAssetImageMap[assetName] = {
                        asset_id: entry.asset_id || 0,
                        name: assetName,
                        image_id: entry.image_id
                    }
                }
            })
        }

        // Add entries from resolvedAssets
        Object.entries(resolvedAssets).forEach(([assetName, imageId]) => {
            if (!mergedAssetImageMap[assetName] && imageId != 0) {
                const asset = assetsRef.current.find(a => a.name === assetName)

                mergedAssetImageMap[assetName] = {
                    name: assetName,
                    asset_id: asset?.id || 0,
                    image_id: imageId
                }
            }
        })

        // Don't clear editor content - keep it for further editing
        await onGenerate(rawText, mergedAssetImageMap)
    }, [editor, isGenerating, unresolvedMentions, assets, onGenerate, resolvedAssets, asset_image_map, onImagePromptChange])

    const selectAssetImage = (imageId: number) => {
        if (activeAsset) {
            setResolvedAssets(prev => ({ ...prev, [activeAsset.name]: imageId }))
            setIsAssetDialogOpen(false)

            if (onConfirmAssetImage) {
                onConfirmAssetImage(activeAsset.name, imageId, currentRawPromptRef.current)
            }
        }
    }

    return (
        <>
            <div className="flex flex-col h-[400px] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden relative">
                <div className="flex-1 p-4 relative">
                    <EditorContent editor={editor} />
                </div>

                {showHintPopup && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-right-4 duration-300 z-10">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                提示
                            </h3>
                            <button
                                onClick={() => setShowHintPopup(false)}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                在编辑框中输入 <code className="bg-white px-1.5 py-0.5 rounded text-[11px] font-mono">@</code> 符号可以快速选择资产，按 <code className="bg-white px-1.5 py-0.5 rounded text-[11px] font-mono">Shift + Enter</code> 可换行
                            </p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 text-center">5秒后自动关闭</p>
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
