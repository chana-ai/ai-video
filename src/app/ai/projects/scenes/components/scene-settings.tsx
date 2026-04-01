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
    }).then((res: any) => {
      onUpdate("image_url", res.image_url)
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

      {/* ── PART 1: Assets & Base Reference (Split View) ── */}
      <div className="grid grid-cols-2 gap-8 min-h-[220px]">
        {/* Left Col: Asset Reference Map */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Asset Reference Map
          </Label>

          <div className="border rounded-xl overflow-hidden divide-y divide-gray-100 bg-gray-50/30 max-h-[300px] overflow-y-auto">
            {assets.map((asset) => (
              <div key={asset.id} className="grid grid-cols-12 gap-2 items-center p-2.5 hover:bg-gray-50 transition-colors">
                <div className="col-span-1 text-[10px] font-mono text-gray-300">#{asset.id}</div>
                <div className="col-span-3 text-[11px] font-bold text-gray-500 truncate">{asset.name}</div>
                <div className="col-span-8 flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {asset?.images?.map((img) => (
                    <div key={img.id} className="relative group/thumb flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:scale-[5.0] hover:z-[100] active:scale-95 group-hover/thumb:shadow-xl group-hover/thumb:border-purple-400 origin-center cursor-zoom-in"
                        onClick={() => setZoomImageUrl(img.url)}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none z-[110] whitespace-nowrap">
                        ID: {img.id}
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

        {/* Right Col: Base Reference Image Stack */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Base Reference Images
          </Label>

          <div className="relative h-[180px] w-full flex items-center justify-center group/stack">
            {/* The Stacked Images */}
            {[0, 1, 2].map((idx) => {
              // Try to get 3 different images or fallback to the same/empty
              const url = scene.image_url; // For now assuming one URL, could be extended to an array
              if (!url) return idx === 0 && (
                <div key="empty" className="w-48 h-32 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 italic text-xs">
                  No image yet
                </div>
              );

              return (
                <div
                  key={idx}
                  className={`absolute w-44 h-28 rounded-xl overflow-hidden shadow-md border-2 border-white transition-all duration-500 cursor-zoom-in 
                    ${idx === 0 ? 'z-30 translate-x-0 translate-y-0 rotate-0 group-hover/stack:-translate-x-20 group-hover/stack:rotate-[-5deg]' : ''}
                    ${idx === 1 ? 'z-20 translate-x-3 translate-y-2 rotate-3 group-hover/stack:translate-x-0 group-hover/stack:rotate-0' : ''}
                    ${idx === 2 ? 'z-10 translate-x-6 translate-y-4 rotate-6 group-hover/stack:translate-x-20 group-hover/stack:rotate-[5deg]' : ''}
                    hover:!z-[200] hover:scale-[5.0] hover:shadow-2xl hover:border-purple-300
                  `}
                  onClick={() => setZoomImageUrl(url)}
                >
                  <img src={url} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                  {idx > 0 && <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] group-hover/stack:bg-transparent transition-all" />}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Visual Context & Action ── */}
      <section className="pt-4 border-t border-gray-100 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Global Scene Prompt</Label>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm"
                onClick={handleGenerateSceneImage}
                disabled={isGeneratingImage || !prompt}
              >
                {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                Generate Scene Image
              </Button>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 min-h-[140px] resize-none text-[13px] bg-gray-50/50 focus:bg-white transition-all font-mono leading-relaxed p-4 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-gray-100"
              placeholder="Describe the overall visual mood and lighting..."
            />
          </div>

        </div>

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
