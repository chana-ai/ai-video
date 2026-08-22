"use client"

import React from "react"
import { Users } from "lucide-react"
import { Label } from "@/components/ui/label"
import { AssetReferenceMapProps } from "@/app/ai/projects/types/scene-settings"

/**
 * Asset Reference Map component displaying all assets for a project
 * Compact version
 */
export function AssetReferenceMap({ assets, onSelectAsset }: AssetReferenceMapProps) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between h-8">
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Asset Reference
        </Label>
      </div>

      <div className="border rounded-lg divide-y divide-gray-100 bg-gray-50/20 max-h-[200px] overflow-y-auto">
        {assets.map((asset: any) => (
          <div key={asset.id} className="grid grid-cols-12 gap-1.5 items-center p-2 hover:bg-white transition-colors">
            <div className="col-span-1 text-[9px] font-mono text-gray-400">#{asset.id}</div>
            <div className="col-span-3 text-[10px] font-bold text-gray-600 truncate">{asset.name}</div>
            <div className="col-span-8 flex gap-1 overflow-visible">
              {asset?.images?.slice(0, 6).map((img: any) => (
                <div key={img.id} className="relative">
                  <div
                    className="w-6 h-6 rounded overflow-hidden border border-white bg-white shadow-sm transition-all duration-200 hover:scale-[3] hover:z-[50] cursor-zoom-in"
                    onClick={() => onSelectAsset?.(asset.id, img.id)}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
              {asset?.images?.length > 6 && (
                <div className="text-[9px] text-gray-400 flex items-center">+{asset.images.length - 6}</div>
              )}
            </div>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="p-3 text-center text-[10px] text-gray-400 italic">No assets</div>
        )}
      </div>
    </section>
  )
}
