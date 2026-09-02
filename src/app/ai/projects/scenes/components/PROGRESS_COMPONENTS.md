# Progress Components Documentation

## 任务3 & 4 完成总结

已成功实现了故事板状态显示组件和合并进度跟踪系统。

## 组件列表

### 1. StoryboardStatus (`storyboard-status.tsx`)
展示各个storyboard的详细状态信息。

#### 功能特性
- ✅ **状态可视化**: 清晰显示ready、processing、not-started、failed状态
- ✅ **展开详情**: 点击可查看详细信息、错误信息、进度条
- ✅ **视频预览**: 内置视频播放器预览功能
- ✅ **重试功能**: 失败的场景可以重试
- ✅ **父场景标识**: 显示所属父场景
- ✅ **时间显示**: 显示最后更新时间
- ✅ **统计卡片**: 各状态的数量和百分比统计

#### 使用示例
```tsx
import { StoryboardStatus } from './storyboard-status'

function MyComponent() {
  return (
    <StoryboardStatus
      storyboards={scenes}
      onPreview={(url) => console.log('预览:', url)}
      onRetry={(id) => console.log('重试:', id)}
    />
  )
}
```

### 2. MergeProgress (`merge-progress.tsx`)
完整的合并任务进度跟踪界面。

#### 功能特性
- ✅ **任务概览**: 显示总进度、处理统计、持续时间
- ✅ **进度控制**: 开始、暂停、取消、重试功能
- ✅ **场景详情**: 每个场景的处理状态和进度
- ✅ **实时更新**: WebSocket实时同步进度
- ✅ **完成预览**: 合成完成后显示视频预览和下载
- ✅ **错误处理**: 友好的错误提示和处理

#### 使用示例
```tsx
import { MergeProgress } from './merge-progress'

function MyComponent() {
  return (
    <MergeProgress
      projectId="123"
      stageId="456"
      totalScenes={selectedCount}
    />
  )
}
```

### 3. useMergeProgress Hook (`use-merge-progress.ts`)
管理合并任务进度的高级Hook。

#### 功能特性
- ✅ **状态管理**: 自动管理任务状态
- ✅ **事件订阅**: WebSocket事件自动处理
- ✅ **回调通知**: 进度更新、完成、错误回调
- ✅ **操作方法**: start、pause、resume、cancel、retry
- ✅ **计算逻辑**: 自动计算持续时间和进度

#### 使用示例
```tsx
import { useMergeProgress } from '@/hooks/use-merge-progress'

function MyComponent() {
  const { progress, startMerge, isProcessing } = useMergeProgress({
    projectId: "123",
    stageId: "456",
    totalScenes: 5,
    onProgress: (p) => console.log(p),
    onComplete: (url) => console.log('完成:', url)
  })

  return (
    <button onClick={() => startMerge([1, 2, 3])} disabled={isProcessing}>
      开始合并
    </button>
  )
}
```

### 4. ProgressDemo (`progress-demo.tsx`)
展示进度组件的演示页面。

## 状态系统

### Storyboard状态
- **ready**: 视频已生成，可以合并
- **processing**: 正在生成中（带进度显示）
- **not-started**: 未开始生成
- **failed**: 生成失败（可重试）
- **complete**: 生成完成

### 合并任务状态
- **idle**: 空闲状态
- **processing**: 处理中（可暂停）
- **completed**: 已完成
- **failed**: 失败（可重试）
- **paused**: 已暂停

## 数据流

```
场景数据 → StoryboardStatus → 状态展示
    ↓
 用户操作 → useMergeProgress → WebSocket → 后端
    ↓
 进度更新 → MergeProgress → 界面刷新
```

## 依赖项
- @/components/ui/button
- @/components/ui/progress
- @/components/ui/card
- @/components/ui/badge
- lucide-react
- react
- @/lib/websocket
- @/hooks/use-merge-progress

## 样式
使用Tailwind CSS，提供响应式设计。

## 扩展性
- 组件设计为可独立使用
- Hook可复用到其他场景
- WebSocket事件可扩展
- 状态系统可自定义

## 文件结构
```
components/
├── storyboard-status.tsx      # 状态显示组件
├── merge-progress.tsx        # 进度跟踪组件
├── progress-demo.tsx        # 演示组件
└── PROGRESS_COMPONENTS.md   # 本文档

hooks/
└── use-merge-progress.ts    # 进度管理Hook
```

## 下一步
- 集成到主场景页面
- 添加更多的WebSocket事件处理
- 实现性能优化
- 添加测试用例