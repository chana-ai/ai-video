"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, ImageIcon, Play, Plus, Loader2 } from "lucide-react"
import type { Scene, SceneSettingsProps } from "../types"
import { VideoDisplayPanel } from "./video-display-panel"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import instance from "@/lib/axios"

import { Asset, ImageInfo, ResourceAsset } from "../../value-assets/types"


export function SceneSettings({ scene, projectDetail, onUpdate }: SceneSettingsProps) {
  const [title, setTitle] = useState(scene.title)
  const [description, setDescription] = useState(scene.description ?? '')
  const [prompt, setPrompt] = useState(scene.prompt ?? '')

  const [assets, setAssets] = useState<Asset[]>([])
  const [charToPickImageFor, setCharToPickImageFor] = useState<Asset | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number>(-1)

  // ── Sync with external scene prop ──────────────────────────────────────────
  useEffect(() => {
    setTitle(scene.title)
    setDescription(scene.description ?? '')
    setPrompt(scene.prompt ?? '')
  }, [scene])

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scene.project_id || !scene.stage_id) return
    // TODO: Optimized it using the cache.
    instance.get(`/api/v2/asset/list?project_id=${scene.project_id}&stage_id=${scene.stage_id}&with_image=True`)
      .then((res: any) => {
        setAssets(res.assets || [])
      })
  }, [scene.project_id, scene.stage_id])

  // ── Gallery Navigation logic ──
  useEffect(() => {
    const urls = scene.image_urls || []
    if (previewIndex === -1 && urls.length > 0) {
      setPreviewIndex(urls.length - 1)
    }
  }, [scene.image_urls])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const urls = scene.image_urls || []
      if (urls.length <= 1) return

      const currentIndex = previewIndex === -1 ? urls.length - 1 : previewIndex

      if (e.key === "ArrowLeft") {
        setPreviewIndex(Math.max(0, currentIndex - 1))
      } else if (e.key === "ArrowRight") {
        setPreviewIndex(Math.min(urls.length - 1, currentIndex + 1))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewIndex, scene.image_urls])

  const handleUpdateField = (key: string, value: any) => onUpdate(key, value)

  const handlePickCharImage = (charId: number, imageId: number) => {
    const nextMap = { ...(scene.char_image_map || {}), [charId]: imageId }
    onUpdate("char_image_map", nextMap)
    setCharToPickImageFor(null)
  }

  const handleGenerateSceneImage = async () => {
    if (!scene.id || !scene.project_id || !scene.stage_id) return
    setIsGeneratingImage(true)
    instance.post('/api/v2/scene/generateSceneImage', {
      scene_id: scene.id,
      project_id: scene.project_id,
      stage_id: scene.stage_id,
      prompt: prompt
    }).then((res: any) => {
      const newUrls: string[] = res.image_url ? Object.values(res.image_url) as string[] : []
      onUpdate("image_urls", newUrls)
      setPreviewIndex(newUrls.length - 1)
      setIsGeneratingImage(false)
    }).catch((error: any) => {
      console.error("Failed to generate scene image:", error)
      setIsGeneratingImage(false)
      alert(`生成失败: ${error.message || '未知错误'}`)
    })
  }

  return (
    <div className="h-full flex flex-col space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
      {/* ── Scene Meta: Title & Description ── */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scene Name</Label>
          <Input
            value={title}
            className="text-xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-gray-200"
            placeholder="Scene Title..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[72px] text-sm bg-gray-50/50 border-gray-100 resize-none focus:bg-white transition-colors p-3 rounded-lg border-none focus-visible:ring-1 focus-visible:ring-gray-200"
            placeholder="Brief description of the context..."
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm"
            onClick={() => {
              handleUpdateField("description", description)
            }}
          >
            Confirm Update
          </Button>
        </div>
      </section>

      {/* ── PART 1: Assets & Base Reference (Balanced Grid) ── */}
      <div className="grid grid-cols-[4fr_6fr] gap-8 min-h-[300px] mb-12">
        {/* Left Col: Asset Reference Map */}
        <section className="space-y-4">
          <div className="flex items-center justify-between h-10">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Users className="w-3.5 h-3.5" /> Asset Reference Map
            </Label>
          </div>

          <div className="border rounded-xl divide-y divide-gray-100 bg-gray-50/20 max-h-[420px] overflow-y-auto">
            {assets.map((asset) => (
              <div key={asset.id} className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-white transition-colors relative z-0 hover:z-20">
                <div className="col-span-1 text-[10px] font-mono text-gray-300">#{asset.id}</div>
                <div className="col-span-3 text-[11px] font-bold text-gray-600 truncate">{asset.name}</div>
                <div className="col-span-8 flex gap-2 overflow-visible py-1">
                  {asset?.images?.map((img) => (
                    <div key={img.id} className="relative">
                      <div
                        className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white bg-white shadow-sm transition-all duration-300 hover:scale-[3.5] hover:z-[50] hover:shadow-2xl active:scale-95 cursor-zoom-in relative"
                        onClick={() => setZoomImageUrl(img.url)}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400 italic">No assets assigned</div>
            )}
          </div>
        </section>

        {/* Right Col: Interactive Visual Reference GALLERY */}
        <section className="space-y-4">
          {/* Header area for Image Reference */}
          <div className="flex items-center justify-between h-10">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <ImageIcon className="w-3.5 h-3.5" /> Base Reference
            </Label>

            {/* History thumbnails moved to sidebar below */}
          </div>

          <div className="flex gap-4 items-start">
            {/* Sidebar for History Thumbnails */}
            {(() => {
              const urls = scene.image_urls ?? []
              if (urls.length <= 1) return null
              return (
                <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar max-h-[320px] w-14 flex-shrink-0 pt-1">
                  {urls.map((url, idx) => {
                    const isActive = (previewIndex === -1 ? urls.length - 1 : previewIndex) === idx
                    return (
                      <div
                        key={idx}
                        className={`relative flex-shrink-0 w-full aspect-[2/1] rounded-sm border-2 transition-all cursor-pointer ${isActive ? 'border-purple-600 scale-105 shadow-sm z-10' : 'border-transparent hover:border-purple-100 opacity-40 hover:opacity-100'}`}
                        onClick={() => setPreviewIndex(idx)}
                      >
                        <img src={url} alt={`v${idx + 1}`} className=" h-full object-cover rounded-[1px]" />
                        {isActive && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-purple-600 rounded-full" />}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Main Visual Frame */}
            <div className="flex-1 min-w-0 max-w-[80%]">
              {(() => {
                const urls = scene.image_urls ?? []
                if (urls.length === 0) {
                  return (
                    <div className="w-full aspect-[2/1] max-h-[320px] rounded-3xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 italic text-xs gap-3">
                      <ImageIcon className="w-8 h-8 opacity-20" />
                      No base image generated
                    </div>
                  )
                }
                const activeIdx = previewIndex === -1 ? urls.length - 1 : previewIndex
                const displayUrl = urls[activeIdx]
                return (
                  <div
                    className="w-full aspect-[2/1] max-h-[320px] rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-purple-900/5 cursor-zoom-in group/mainimg relative"
                    onClick={() => setZoomImageUrl(displayUrl)}
                  >
                    <img src={displayUrl} alt="Active reference" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/mainimg:opacity-100 transition-all flex justify-between items-end transform translate-y-2 group-hover/mainimg:translate-y-0">
                      <div className="flex gap-2">
                        <kbd className="px-2 py-1 bg-white/20 backdrop-blur-md rounded border border-white/20 text-[9px] text-white font-mono leading-none">←</kbd>
                        <kbd className="px-2 py-1 bg-white/20 backdrop-blur-md rounded border border-white/20 text-[9px] text-white font-mono leading-none">→</kbd>
                      </div>
                      <span className="text-[10px] text-white font-bold bg-purple-600/80 px-3 py-1 rounded-full backdrop-blur-md border border-purple-400/30">v{activeIdx + 1} / {urls.length}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

        </section>
      </div>

      {/* ── Global Scene Prompt Section ── */}
      <section className="pt-16 border-t border-gray-100 space-y-5">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <Label className="text-[11px] font-heavy text-gray-400 uppercase tracking-widest">Global Scene Prompt</Label>
        </div>

        <div className="relative flex flex-col group/prompt">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full min-h-[180px] pb-24 resize-none text-[14px] bg-gray-50/30 focus:bg-white transition-all font-mono leading-relaxed p-8 rounded-[3rem] border-2 border-transparent focus:border-purple-100 shadow-inner placeholder:text-gray-200"
            placeholder="Atmosphere, cinematic lighting, framing, emotional tone..."
          />
          <div className="absolute bottom-6 right-6 flex items-center gap-5">
            {isGeneratingImage && (
              <div className="flex items-center gap-2.5 text-[11px] font-bold text-purple-500 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Masterpiece...
              </div>
            )}
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-[1.5rem] shadow-2xl shadow-purple-600/20 px-10 font-bold transition-all hover:scale-105 active:scale-95 flex gap-3 h-14 border-b-4 border-purple-800"
              onClick={handleGenerateSceneImage}
              disabled={isGeneratingImage || !prompt}
            >
              {isGeneratingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
              <span className="text-lg tracking-tight">Generate Scene Image</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Scene Pre-vis: Video Player ── */}
      <section className="pt-6 border-t border-gray-50 space-y-4">

        {/* ── Scene Video Player ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <Play className="w-3 h-3 text-green-600 fill-current" />
            </div>
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Scene Layout Preview</Label>
          </div>
          <div className="aspect-video rounded-3xl overflow-hidden bg-black border-4 border-gray-900 shadow-2xl relative shadow-gray-200">
            <VideoDisplayPanel scene={scene as any} />
            {!scene.video_url && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                <span className="text-xs font-bold text-white/40 tracking-[0.2em] px-5 py-2 border border-white/10 rounded-full uppercase">Pre-vis Unavailable</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Dialogs ── */}
      <Dialog open={!!zoomImageUrl} onOpenChange={(o) => !o && setZoomImageUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={() => setZoomImageUrl(null)}>
            <img
              src={zoomImageUrl || ''}
              alt="Zoomed View"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-md animate-in zoom-in-95 duration-300"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!charToPickImageFor} onOpenChange={(o) => !o && setCharToPickImageFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Select Reference Image for {charToPickImageFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4 overflow-y-auto max-h-[60vh]">
            {charToPickImageFor?.images.map(img => (
              <div key={img.id} className={`group cursor-pointer aspect-square rounded-xl border-2 transition-all overflow-hidden ${scene.char_image_map?.[charToPickImageFor.id] === img.id ? 'border-purple-600 ring-2 ring-purple-100' : 'border-gray-100 hover:border-purple-300'}`}
                onClick={() => handlePickCharImage(charToPickImageFor.id, img.id)}>
                <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Char variant" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
