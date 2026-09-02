# Merge Panel Components

这是一个用于视频合并功能的独立组件库，包含了两个主要组件：

## 组件列表

### 1. MergePanel
主要的浮动面板组件，提供完整的合并功能界面。

#### Props
```typescript
interface MergePanelProps {
  isOpen: boolean              // 面板是否打开
  onClose: () => void          // 关闭面板的回调
  projectId: string            // 项目ID
  stageId: string              // 阶段ID
  scenes: Scene[]              // 场景数据
  onMergeComplete?: (resultUrl: string) => void  // 合并完成的回调
}
```

#### 特性
- ✅ 浮动面板设计，支持展开/收起动画
- ✅ 两种视图模式：选择视图和进度视图
- ✅ 实时显示storyboard状态
- ✅ 支持批量选择和快捷操作
- ✅ WebSocket集成，实时更新进度
- ✅ 合并完成后自动预览

#### 使用示例
```tsx
import { MergePanel } from './merge-panel'

function MyComponent() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  
  return (
    <MergePanel
      isOpen={isPanelOpen}
      onClose={() => setIsPanelOpen(false)}
      projectId="123"
      stageId="456"
      scenes={scenes}
      onMergeComplete={(url) => console.log('合并完成:', url)}
    />
  )
}
```

### 2. StoryboardSelection
专门用于storyboard选择的组件，可以独立使用。

#### Props
```typescript
interface StoryboardSelectionProps {
  storyboards: Scene[]          // 场景数据
  selectedIds: Set<number>     // 已选择的ID集合
  onSelectionChange: (ids: Set<number>) => void  // 选择变化的回调
  disabled?: boolean           // 是否禁用
  showStatusCounts?: boolean   // 是否显示状态统计
}
```

#### 特性
- ✅ 清晰的状态可视化
- ✅ 支持批量选择操作
- ✅ 状态统计显示
- ✅ 父场景标识
- ✅ 可选性控制

#### 使用示例
```tsx
import { StoryboardSelection } from './storyboard-selection'

function MyComponent() {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  
  return (
    <StoryboardSelection
      storyboards={scenes}
      selectedIds={selected}
      onSelectionChange={setSelected}
      showStatusCounts={true}
    />
  )
}
```

## 数据结构

### Scene 类型
```typescript
interface Scene {
  id: number
  title: string
  storyboard: boolean
  parent_id: number | null
  video_url?: string
  video_setting?: {
    duration: string
  }
  status: string
  // ... 其他字段
}
```

### 状态说明
- **ready**: 视频已生成，可以合并
- **processing**: 正在生成中
- **not-started**: 未开始生成
- **failed**: 生成失败

## 依赖项
- @/components/ui/button
- @/components/ui/progress
- @/components/ui/badge
- lucide-react
- react

## 样式
组件使用 Tailwind CSS，确保已正确配置。

## WebSocket 集成
组件内置了 WebSocket 事件处理：
- `createVideoCombinationAccepted`
- `createVideoCombinationProgress`
- `createVideoCombinationComplete`
- `createVideoCombinationError`

## 文件结构
```
components/
├── merge-panel.tsx              # 主面板组件
├── storyboard-selection.tsx      # 选择组件
├── merge-demo.tsx              # 演示组件
└── README.md                   # 说明文档
```

## 测试
运行 `npm run dev` 启动开发服务器，访问演示组件查看效果。