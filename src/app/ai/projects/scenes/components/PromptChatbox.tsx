import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import { Button } from "@/components/ui/button"
import { Check, Loader2, Info, Users, Send, MessageSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { PromptHistoryItem } from '../types'

import suggestion from './suggestion'

interface Asset {
    id: number
    name: string
    images?: { id: number; url: string }[]
}

interface Message {
    id: string
    text: string
    resolvedAssets: Record<string, number>
    timestamp: number
    error?: string | null
}

interface PromptChatboxProps {
    initialValue?: string
    assets: Asset[]
    history?: PromptHistoryItem[]
    onGenerate: (prompt: string, resolvedAssets: Record<string, number>) => Promise<void>
    isGenerating: boolean
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
    history,
    onGenerate,
    isGenerating
}: PromptChatboxProps) {
    const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false)
    const [activeAsset, setActiveAsset] = useState<Asset | null>(null)
    const [resolvedAssets, setResolvedAssets] = useState<Record<string, number>>({}) // mentionName -> imageId
    const [messages, setMessages] = useState<Message[]>(() => {
        if (history && history.length > 0) {
            return history.map((h, i) => ({
                id: `history-${i}-${h.timestamp}`,
                text: h.prompt,
                resolvedAssets: {}, // History from backend doesn't have resolved assets in this format yet
                timestamp: h.timestamp * 1000, // backend might be in seconds
                error: h.error_message
            }))
        }
        return []
    })
    const scrollRef = useRef<HTMLDivElement>(null)

    const editor = useEditor({
        extensions: [
            StarterKit,
            CustomMention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
                suggestion: suggestion(assets),
            }),
        ],
        content: (history && history.length > 0) ? "" : initialValue,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none min-h-[60px] p-4 text-sm leading-relaxed text-gray-700 font-mono',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleProcessSubmission()
                    return true
                }
                return false
            },
        }
    })

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [messages])

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

        // 1. Strict Validation
        if (unresolvedMentions.length > 0) {
            const firstUnresolved = assets.find(a => a.name === unresolvedMentions[0])
            if (firstUnresolved) {
                setActiveAsset(firstUnresolved)
                setIsAssetDialogOpen(true)
            }
            return
        }

        // 2. Chat Logic: Add to history
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text: editor.getHTML(), // Store as HTML to keep mentions visible
            resolvedAssets: { ...resolvedAssets },
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, newMessage])

        // Clear editor for next prompt
        editor.commands.clearContent()

        await onGenerate(text, resolvedAssets)
    }, [editor, isGenerating, unresolvedMentions, assets, onGenerate, resolvedAssets])

    useEffect(() => {
        const handleMentionClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('mention')) {
                const assetName = target.getAttribute('data-label')
                const asset = assets.find(a => a.name === assetName)
                if (asset) {
                    setActiveAsset(asset)
                    setIsAssetDialogOpen(true)
                }
            }
        }
        document.addEventListener('click', handleMentionClick)
        return () => document.removeEventListener('click', handleMentionClick)
    }, [assets])

    // Mark mentions as resolved in the editor when resolvedAssets changes
    useEffect(() => {
        if (!editor) return
        editor.commands.command(({ tr }) => {
            tr.doc.descendants((node, pos) => {
                if (node.type.name === 'mention') {
                    const isResolved = !!resolvedAssets[node.attrs.label]
                    if (node.attrs.resolved !== isResolved) {
                        tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            resolved: isResolved
                        })
                    }
                }
            })
            return true
        })
    }, [editor, resolvedAssets])

    const selectAssetImage = (imageId: number) => {
        if (activeAsset) {
            setResolvedAssets(prev => ({ ...prev, [activeAsset.name]: imageId }))
            setIsAssetDialogOpen(false)
        }
    }

    return (
        <div className="flex flex-col h-[400px] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* ── Chat History ── */}
            <ScrollArea className="flex-1 p-4 bg-gray-50/30" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                            <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-[11px] font-bold uppercase tracking-widest">No history yet</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="max-w-[90%] bg-white border border-gray-100 rounded-2xl rounded-tr-none p-4 shadow-sm relative group">
                                <div className="text-sm text-gray-700 leading-relaxed font-mono prose prose-sm prose-purple">
                                    <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                                    {msg.error && (
                                        <span className="text-red-500 font-bold ml-1">({msg.error})</span>
                                    )}
                                </div>
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {Object.keys(msg.resolvedAssets).map(assetName => (
                                        <span key={assetName} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 font-bold">
                                            {assetName}: {msg.resolvedAssets[assetName]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isGenerating && (
                        <div className="flex items-center gap-2 text-purple-500 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Generating sequence...</span>
                        </div>
                    )}

                    {/* ── Input Area moved inside ScrollArea ── */}
                    <div className={cn(
                        "relative mt-6 pt-4 border-t border-gray-100 transition-all",
                        isGenerating ? "bg-gray-50/50 grayscale pointer-events-none" : "bg-white/80 backdrop-blur-sm rounded-xl"
                    )}>
                        <EditorContent editor={editor} />

                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            {unresolvedMentions.length > 0 && (
                                <span className="text-[9px] text-red-500 font-bold bg-white border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-in fade-in slide-in-from-right-2">
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
                </div>
            </ScrollArea>


            <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-gray-800">
                            <Users className="h-5 w-5 text-purple-600" />
                            Select Image: {activeAsset?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] mt-4 pr-4">
                        <div className="grid grid-cols-3 gap-3">
                            {activeAsset?.images?.map((img, idx) => (
                                <div
                                    key={`${activeAsset.id}-${idx}`}
                                    className={cn(
                                        "relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                                        resolvedAssets[activeAsset.name] === img.id ? "border-purple-600 ring-2 ring-purple-100" : "border-transparent hover:border-gray-200"
                                    )}
                                    onClick={() => selectAssetImage(img.id)}
                                >
                                    <img src={img.url} alt="Asset" className="w-full h-full object-cover" />
                                    {resolvedAssets[activeAsset.name] === img.id && (
                                        <div className="absolute inset-0 bg-purple-600/10 flex items-center justify-center">
                                            <div className="bg-purple-600 text-white p-1 rounded-full shadow-sm">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!activeAsset?.images || activeAsset.images.length === 0) && (
                                <div className="col-span-3 py-10 text-center text-gray-400 text-sm italic">
                                    No reference images found for this character.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
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
        </div>
    )
}
