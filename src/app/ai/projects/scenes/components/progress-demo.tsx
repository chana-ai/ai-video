"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { MergeProgress } from './merge-progress'
import { StoryboardStatus } from './storyboard-status'
import { useMergeProgress } from '@/hooks/use-merge-progress'
import type { Scene } from "@/app/ai/projects/types"

// 模拟数据
const mockScenes: Scene[] = [
  {
    id: 1,
    title: "开场场景",
    seq_id: 0,
    pre_seq_id: -1,
    next_seq_id: 1,
    project_id: 1,
    stage_id: 1,
    status: "COMPLETE",
    storyboard: false,
    parent_id: null,
    image_status: true,
    clip_status: true,
    voice_status: true,
    del: false,
    create_time: "2024-01-01T00:00:00Z",
    update_time: "2024-01-01T00:00:00Z",
    video_url: "https://example.com/video1.mp4",
    video_setting: { model: "", camera: "frame", duration: "15", motion: "" },
    children: [3, 4]
  },
  {
    id: 2,
    title: "发展场景",
    seq_id: 1,
    pre_seq_id: 0,
    next_seq_id: -1,
    project_id: 1,
    stage_id: 1,
    status: "COMPLETE",
    storyboard: false,
    parent_id: null,
    image_status: true,
    clip_status: true,
    voice_status: true,
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
    video_url: "https://example.com/video1-1.mp4",
    video_setting: { model: "", camera: "frame", duration: "10", motion: "" }
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
    video_url: "https://example.com/video1-2.mp4",
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

export function ProgressDemo() {
  const [activeTab, setActiveTab] = useState<'progress' | 'status'>('progress')
  const [selectedScenes, setSelectedScenes] = useState<number[]>([3, 4])

  const { progress, startMerge, isProcessing, isCompleted } = useMergeProgress({
    projectId: "1",
    stageId: "1",
    totalScenes: selectedScenes.length,
    onProgress: (p) => console.log('进度更新:', p),
    onComplete: (url) => console.log('合并完成:', url)
  })

  // 处理storyboard预览
  const handlePreview = (videoUrl: string) => {
    window.open(videoUrl, '_blank')
  }

  // 处理重试
  const handleRetry = (storyboardId: number) => {
    console.log('重试 storyboard:', storyboardId)
    // 在实际应用中，这里会触发重新生成
  }

  // 开始合并
  const handleStartMerge = async () => {
    try {
      await startMerge(selectedScenes)
    } catch (error) {
      console.error('开始合并失败:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Merge Progress Demo</h1>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">控制面板</h2>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'progress' ? 'default' : 'outline'}
                onClick={() => setActiveTab('progress')}
              >
                进度跟踪
              </Button>
              <Button
                variant={activeTab === 'status' ? 'default' : 'outline'}
                onClick={() => setActiveTab('status')}
              >
                状态显示
              </Button>
            </div>
          </div>

          {/* 场景选择 */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">选择要合并的场景</h3>
            <div className="flex flex-wrap gap-2">
              {mockScenes.filter(s => s.storyboard).map(scene => (
                <button
                  key={scene.id}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedScenes.includes(scene.id)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    if (selectedScenes.includes(scene.id)) {
                      setSelectedScenes(prev => prev.filter(id => id !== scene.id))
                    } else {
                      setSelectedScenes(prev => [...prev, scene.id])
                    }
                  }}
                >
                  {scene.title}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              已选择 {selectedScenes.length} 个场景
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartMerge}
              disabled={isProcessing || selectedScenes.length === 0}
            >
              {isProcessing ? '处理中...' : '开始合并'}
            </Button>
            {isCompleted && (
              <Button variant="outline">
                查看结果
              </Button>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'progress' && (
            <MergeProgress
              projectId="1"
              stageId="1"
              totalScenes={selectedScenes.length}
            />
          )}

          {activeTab === 'status' && (
            <StoryboardStatus
              storyboards={mockScenes}
              onPreview={handlePreview}
              onRetry={handleRetry}
            />
          )}
        </div>

        {/* 当前状态显示 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium mb-2">任务状态</h3>
          <div className="space-y-2 text-sm">
            <div>任务ID: {progress.taskId || '未开始'}</div>
            <div>状态: {progress.status}</div>
            <div>进度: {progress.progress}%</div>
            <div>处理数: {progress.processed}/{progress.total}</div>
            {progress.duration && <div>持续时间: {progress.duration}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}