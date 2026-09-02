"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { MergePanel } from './merge-panel'
import { StoryboardSelection } from './storyboard-selection'
import { Triangle, ChevronDown } from "lucide-react"
import type { Scene } from "@/app/ai/projects/types"

// 示例数据
const sampleScenes: Scene[] = [
  {
    id: 1,
    title: "主场景1",
    seq_id: 0,
    pre_seq_id: -1,
    next_seq_id: 1,
    project_id: 1,
    stage_id: 1,
    status: "INIT",
    storyboard: false,
    parent_id: null,
    image_status: false,
    clip_status: false,
    voice_status: false,
    del: false,
    create_time: "2024-01-01T00:00:00Z",
    update_time: "2024-01-01T00:00:00Z",
    video_setting: { model: "", camera: "frame", duration: "15", motion: "" },
    children: [3, 4]
  },
  {
    id: 2,
    title: "主场景2",
    seq_id: 1,
    pre_seq_id: 0,
    next_seq_id: -1,
    project_id: 1,
    stage_id: 1,
    status: "INIT",
    storyboard: false,
    parent_id: null,
    image_status: false,
    clip_status: false,
    voice_status: false,
    del: false,
    create_time: "2024-01-01T00:00:00Z",
    update_time: "2024-01-01T00:00:00Z",
    video_setting: { model: "", camera: "frame", duration: "20", motion: "" },
    children: [5]
  },
  {
    id: 3,
    title: "Storyboard 1-1",
    seq_id: 0,
    pre_seq_id: -1,
    next_seq_id: 1,
    project_id: 1,
    stage_id: 1,
    status: "COMPLETE",
    storyboard: true,
    parent_id: 1,
    image_status: true,
    clip_status: true,
    voice_status: true,
    del: false,
    create_time: "2024-01-01T00:00:00Z",
    update_time: "2024-01-01T00:00:00Z",
    video_url: "https://example.com/video1.mp4",
    video_setting: { model: "", camera: "frame", duration: "15", motion: "" }
  },
  {
    id: 4,
    title: "Storyboard 1-2",
    seq_id: 1,
    pre_seq_id: 0,
    next_seq_id: -1,
    project_id: 1,
    stage_id: 1,
    status: "COMPLETE",
    storyboard: true,
    parent_id: 1,
    image_status: true,
    clip_status: true,
    voice_status: true,
    del: false,
    create_time: "2024-01-01T00:00:00Z",
    update_time: "2024-01-01T00:00:00Z",
    video_url: "https://example.com/video2.mp4",
    video_setting: { model: "", camera: "frame", duration: "15", motion: "" }
  },
  {
    id: 5,
    title: "Storyboard 2-1",
    seq_id: 0,
    pre_seq_id: -1,
    next_seq_id: -1,
    project_id: 1,
    stage_id: 1,
    status: "INIT",
    storyboard: true,
    parent_id: 2,
    image_status: false,
    clip_status: false,
    voice_status: false,
    del: false,
    create_time: "2024-01-01T00:00:00Z",
    update_time: "2024-01-01T00:00:00Z",
    video_setting: { model: "", camera: "frame", duration: "20", motion: "" }
  }
]

export function MergeDemo() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedStoryboards, setSelectedStoryboards] = useState<Set<number>>(new Set([3, 4]))
  const [scenes] = useState<Scene[]>(sampleScenes)
  const [isMerging, setIsMerging] = useState(false)

  // 合并完成处理
  const handleMergeComplete = (resultUrl: string) => {
    console.log('合并完成:', resultUrl)
    setIsMerging(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Merge Panel Demo</h1>

        {/* 主内容区 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Storyboards Demo</h2>
            <Button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="flex items-center gap-2"
            >
              {isPanelOpen ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Close Merge Panel
                </>
              ) : (
                <>
                  <Triangle className="h-4 w-4" />
                  Open Merge Panel
                </>
              )}
            </Button>
          </div>

          {/* Storyboard选择组件演示 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Storyboard Selection</h3>
            <StoryboardSelection
              storyboards={scenes}
              selectedIds={selectedStoryboards}
              onSelectionChange={setSelectedStoryboards}
            />
          </div>

          {/* 当前选择状态显示 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">当前选择状态:</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedStoryboards).map(id => {
                const storyboard = scenes.find(s => s.id === id && s.storyboard)
                return storyboard ? (
                  <span key={id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {storyboard.title}
                  </span>
                ) : null
              })}
              {selectedStoryboards.size === 0 && (
                <span className="text-gray-500 text-sm">未选择任何 storyboard</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MergePanel 浮动面板 */}
      <MergePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        projectId="1"
        stageId="1"
        scenes={scenes}
        onMergeComplete={handleMergeComplete}
      />
    </div>
  )
}