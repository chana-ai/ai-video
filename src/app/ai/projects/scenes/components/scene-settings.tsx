"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, ImageIcon, Play, Plus } from "lucide-react"
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

  // ── Sync with external scene prop ──────────────────────────────────────────
  useEffect(() => {
    setTitle(scene.title)
    setDescription(scene.description ?? '')
    setPrompt(scene.prompt ?? '')
  }, [scene])

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scene.project_id || !scene.stage_id) return
    instance.get(`/api/v2/asset/list?project_id=${scene.project_id}&stage_id=${scene.stage_id}`)
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

      {/* ── PART 1: CHARACTERS (2-Row Table) ── */}
      <section className="space-y-4">
        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Asset Reference Map
        </Label>


      </section>

      {/* ── Visual Context & Action ── */}
      <section className="pt-4 border-t border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Global Scene Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 min-h-[140px] resize-none text-[13px] bg-gray-50/50 focus:bg-white transition-all font-mono leading-relaxed p-4 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-gray-100"
              placeholder="Describe the overall visual mood and lighting..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Base Reference Image</Label>
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-50 border-2 border-gray-100 relative group flex items-center justify-center">
              {scene.image_url ? (
                <img src={scene.image_url} alt="Scene Context" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-100" />
              )}
            </div>
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
