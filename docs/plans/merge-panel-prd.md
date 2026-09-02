# Chana AI Video - 视频合并功能产品需求文档 (PRD)

## 📋 版本信息
- **版本号**：v2.0
- **创建日期**：2026-08-31
- **文档状态**：✅ 已确认
- **作者**：Product Manager + Claude

---

## 一、功能概述

### 1.1 核心目标
提供一个智能、透明、容错的视频合并体验，解决"部分storyboard未就绪时如何合并"的痛点，确保最终视频质量。

### 1.2 用户价值
- ✅ **避免失败**：提前检查就绪状态，减少合并失败
- ✅ **透明可见**：实时显示合并进度和状态
- ✅ **灵活选择**：用户可手动选择参与合并的storyboard
- ✅ **即时预览**：合并完成后立即预览下载

---

## 二、UI交互设计

### 2.1 Merge按钮状态机

```
┌─────────────────────────────────────────┐
│  [ triangles → ]    ← 默认状态          │
└─────────────────────────────────────────┘

状态流程：
START: ▶️ (向右三角形)
  ↓ 点击
  ↓
MIDDLE: ⬇️ (向下箭头 + 浮动面板展开)
  ↓ 再次点击
  ↓
CLOSE: ▶️ (重置为向右三角形 + 浮动面板收起)
```

#### 2.1.1 视觉设计

**默认状态：**
```css
.merge-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  transition: all 0.3s ease;
}
.merge-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}
```

**展开状态（指向下箭头）：**
```css
.merge-btn.open {
  background: #3b82f6; /* 蓝色 */
  color: white;
  border-color: #2563eb;
}
.merge-btn.open:hover {
  background: #2563eb;
}
```

#### 2.1.2 浮动面板动画

```css
.merge-panel {
  position: fixed;
  top: 80px;
  right: 32px;
  width: 420px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 24px;

  /* 展开/收起动画 */
  transform-origin: top right;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 初始状态：隐藏 */
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
  pointer-events: none;
}

.merge-panel.open {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

/* 内容滚动区域 */
.panel-content {
  max-height: calc(80vh - 100px);
  overflow-y: auto;
  scrollbar-width: thin;
}
```

---

## 三、浮动面板内容设计

### 3.1 面板整体布局

```
┌─────────────────────────────────────────────┐
│  ▶️ 视频合并                      [✕]  │  ← 顶部工具栏
├─────────────────────────────────────────────┤
│  [████████████░░]  70%  [正在处理]       │  ← 进度条区
├─────────────────────────────────────────────┤
│                                             │
│  📋 选择要合并的storyboard:                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ☑️ Scene 1                          │   │
│  │    📼 video_url                     │   │
│  │    0:15 | [预览]                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ☑️ Scene 2                          │   │
│  │    📼 video_url                     │   │
│  │    0:23 | [预览]                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ⬜ Scene 3 (pending)               │   │
│  │    ⏳ 正在生成...                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ⬜ Scene 4 (not started)            │   │
│  │    ❌ 未开始                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [全部选择] [全不选] [仅选择已就绪]        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🚀 开始合并  (disabled if 0 selected)│   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 3.2 上部分：合并任务进度区

#### 3.2.1 未开始状态（初始打开时）

```
┌─────────────────────────────────────────────┐
│  🎬 合并任务                               │
├─────────────────────────────────────────────┤
│                                             │
│  选择要合并的storyboard:                    │
│                                             │
│  [空选择时显示]                             │
│  ⚠️ 请至少选择1个storyboard                │
│  点击"选择已就绪"可快速填充                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ▶️ 视频合并                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

#### 3.2.2 进行中状态（合并任务已启动）

```
┌─────────────────────────────────────────────┐
│  🎬 合并任务进行中...                      │
├─────────────────────────────────────────────┤
│                                             │
│  [████████░░]  70%  [正在处理 Scene 8]     │
│                                             │
│  状态:                                       │
│  ✅ Scene 1 (ready)                          │
│  ✅ Scene 2 (ready)                          │
│  ✅ Scene 3 (ready)                          │
│  ⏳ Scene 4 (processing...)                  │
│  ⏳ Scene 5 (processing...)                  │
│  ❌ Scene 6 (failed)                         │
│                                             │
│  [取消任务]                                 │
│                                             │
└─────────────────────────────────────────────┘
```

#### 3.2.3 完成状态（合并完成）

```
┌─────────────────────────────────────────────┐
│  ✅ 合并完成                               │
├─────────────────────────────────────────────┤
│                                             │
│  [████████████] 100%                        │
│                                             │
│  总时长: 1:45                               │
│  生成于: 2026-08-31 14:30                   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🎬 播放预览                         │   │
│  │ ┌─────────────────────────────┐     │   │
│  │ │                              │     │   │
│  │ │       视频播放器             │     │   │
│  │ │                              │     │   │
│  │ └─────────────────────────────┘     │   │
│  │                                     │   │
│  │ [下载视频]  [重新生成]               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [关闭面板]  [返回场景列表]                 │
│                                             │
└─────────────────────────────────────────────┘
```

**完成状态的播放器功能：**
- ✅ 自动播放预览
- ✅ 暂停/继续
- ✅ 下载按钮（.mp4格式）
- ✅ 进度条（如果拖动，可以seek）
- ✅ 音量控制

---

### 3.3 下部分：Storyboard选择清单

#### 3.3.1 基础列表项样式

**已就绪的storyboard（可勾选）：**
```css
.storyboard-item.ready {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.storyboard-item.ready .checkbox {
  accent-color: #22c55e;
}

.storyboard-item.ready .video-preview {
  color: #22c55e;
}

.storyboard-item.ready:hover {
  background: #dcfce7;
}
```

**正在生成的（不可勾选）：**
```css
.storyboard-item.processing {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  opacity: 0.8;
}

.storyboard-item.processing .checkbox {
  visibility: hidden;
}

.storyboard-item.processing .status-text {
  color: #3b82f6;
}
```

**未开始的（不可勾选）：**
```css
.storyboard-item.not-started {
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  opacity: 0.6;
}

.storyboard-item.not-started .checkbox {
  visibility: hidden;
}

.storyboard-item.not-started .status-text {
  color: #9ca3af;
  font-size: 0.85em;
}
```

#### 3.3.2 单个item结构

```tsx
<div className="storyboard-item ready">
  {/* 勾选框 */}
  <input
    type="checkbox"
    checked={isSelected}
    onChange={(e) => toggleSelection(s)}
  />

  {/* Storyboard信息 */}
  <div className="storyboard-info">
    <span className="title">{s.title}</span>
    <span className="time">0:15</span>
  </div>

  {/* Video预览按钮 */}
  <button className="video-preview" onClick={(e) => {
    e.stopPropagation();
    toggleSelection(s);
    previewVideo(s.video_url);
  }}>
    <PlayIcon className="icon" />
  </button>
</div>
```

#### 3.3.3 快捷操作按钮

```
[ 全选 ]  [ 全不选 ]  [ 仅选择已就绪 ]  [ 仅选择未开始 ]
```

---

### 3.4 底部：操作按钮区

#### 3.4.1 开始合并按钮

**状态：**

```css
.start-merge-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-merge-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.start-merge-btn:not(:disabled):hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
```

**状态映射：**
- ✅ 至少选择1个 → enabled
- ❌ 0个选择 → disabled + tooltip "请至少选择1个storyboard"

#### 3.4.2 取消任务按钮（仅在合并中显示）

```css
.cancel-btn {
  width: 100%;
  padding: 10px;
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 8px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #fecaca;
}
```

---

## 四、数据流与状态管理

### 4.1 新增状态

```typescript
// 合并面板状态
const [isMergePanelOpen, setIsMergePanelOpen] = useState(false)

// 合并任务状态
const [mergeTask, setMergeTask] = useState<{
  isMerging: boolean
  progress: number    // 0-100
  processed: number   // 已处理数量
  total: number       // 总数量
  status: 'idle' | 'processing' | 'completed' | 'failed'
  result_url?: string // 合并完成的视频URL
} | null>(null)

// 选择状态
const [selectedStoryboards, setSelectedStoryboards] = useState<Set<number>>(new Set())

// 全局选择状态
const [selectAll, setSelectAll] = useState(false)
```

### 4.2 数据计算

```typescript
// 获取所有storyboards
const allStoryboards = useMemo(() => {
  return scenes.filter(s => s.storyboard && s.parent_id !== null)
}, [scenes])

// 获取已就绪的storyboards
const readyStoryboards = useMemo(() => {
  return allStoryboards.filter(s => s.video_url)
}, [allStoryboards])

// 获取正在生成的storyboards
const processingStoryboards = useMemo(() => {
  return allStoryboards.filter(s => s.clip_status === true)
}, [allStoryboards])

// 获取未开始的storyboards
const notStartedStoryboards = useMemo(() => {
  return allStoryboards.filter(s => s.clip_status === false && !s.video_url)
}, [allStoryboards])
```

---

### 4.3 关键函数

#### 4.3.1 打开/关闭合并面板

```typescript
const toggleMergePanel = () => {
  setIsMergePanelOpen(prev => !prev)

  if (!prev && mergeTask?.status === 'idle') {
    // 打开时，自动选择所有已就绪的
    setSelectedStoryboards(new Set(readyStoryboards.map(s => s.id)))
    setSelectAll(readyStoryboards.length === allStoryboards.length)
  }
}
```

#### 4.3.2 Toggle单个storyboard选择

```typescript
const toggleStoryboardSelection = (storyboardId: number) => {
  setSelectedStoryboards(prev => {
    const next = new Set(prev)
    if (next.has(storyboardId)) {
      next.delete(storyboardId)
    } else {
      next.add(storyboardId)
    }
    return next
  })
}
```

#### 4.3.3 全选/全不选

```typescript
const handleSelectAll = () => {
  const onlyReady = readyStoryboards.map(s => s.id)
  setSelectedStoryboards(new Set(onlyReady))
  setSelectAll(true)
}

const handleDeselectAll = () => {
  setSelectedStoryboards(new Set())
  setSelectAll(false)
}

const handleSelectReadyOnly = () => {
  setSelectedStoryboards(new Set(readyStoryboards.map(s => s.id)))
  setSelectAll(readyStoryboards.length === allStoryboards.length)
}
```

#### 4.3.4 开始合并

```typescript
const handleStartMerge = async () => {
  if (selectedStoryboards.size === 0) {
    showToast("请至少选择1个storyboard", "error")
    return
  }

  // 1. 过滤出已就绪的storyboard
  const readyToMerge = allStoryboards.filter(s =>
    selectedStoryboards.has(s.id) && s.video_url
  )

  if (readyToMerge.length === 0) {
    showToast("选中的storyboard尚未准备好", "warning")
    return
  }

  // 2. 提交合并任务
  try {
    const taskId = await wsManager.sendCreateVideoCombination(
      Number(projectId),
      Number(stageId),
      readyToMerge.map(s => s.id)
    )

    // 3. 更新状态为进行中
    setMergeTask({
      isMerging: true,
      progress: 0,
      processed: 0,
      total: readyToMerge.length,
      status: 'processing'
    })

    // 4. 取消面板选择（进入合并模式）
    setSelectedStoryboards(new Set())

  } catch (error: any) {
    setMergeTask(prev => ({
      ...prev!,
      status: 'failed'
    }))
    showToast("合并任务启动失败", "error")
  }
}
```

#### 4.3.5 取消合并任务

```typescript
const handleCancelMerge = () => {
  wsManager.cancelVideoCombination()
  setMergeTask({
    isMerging: false,
    progress: 0,
    processed: 0,
    total: 0,
    status: 'idle'
  })
}
```

---

### 4.4 WebSocket事件处理

```typescript
// 监听合并任务接受
wsManager.subscribe('createVideoCombinationAccepted', (message: WsMessage) => {
  console.log('合并任务已接受:', message)
  // update mergeTask status
})

// 监听合并进度更新
wsManager.subscribe('createVideoCombinationProgress', (message: WsMessage) => {
  if (mergeTask?.status === 'processing') {
    setMergeTask(prev => ({
      ...prev!,
      progress: message.progress || 0,
      processed: message.processed || 0,
      total: message.total || 0
    }))
  }
})

// 监听合并完成
wsManager.subscribe('createVideoCombinationComplete', (message: WsMessage) => {
  if (message.result_url) {
    setMergeTask({
      isMerging: false,
      progress: 100,
      processed: mergeTask?.total || 0,
      total: mergeTask?.total || 0,
      status: 'completed',
      result_url: message.result_url
    })

    // 刷新场景列表（获取新的video_url）
    fetchSceneDetails()

    // 播放器自动播放
    playMergeResult(message.result_url)
  }
})

// 监听合并失败
wsManager.subscribe('createVideoCombinationError', (message: WsMessage) => {
  setMergeTask(prev => ({
    ...prev!,
    status: 'failed'
  }))
  showToast("视频合并失败: " + message.message, "error")
})
```

---

## 五、用户体验流程

### 5.1 完整流程示例

#### 场景A：全部就绪，直接合并

```
1. 用户生成5个storyboard
   ↓
2. 所有storyboard都ready
   ↓
3. 点击Merge按钮 (▶️)
   ↓
4. 浮动面板展开 (⬇️)
   ↓
5. 自动选择所有5个
   ↓
6. 点击"开始合并"
   ↓
7. 面板切换为进度视图
   ↓
8. 显示进度条 [██████████] 100%
   ↓
9. 自动播放预览
   ↓
10. 显示"下载视频"按钮
   ↓
11. 点击关闭面板 (▶️)
```

#### 场景B：部分就绪，手动选择

```
1. 用户生成5个storyboard
   ↓
2. 2个ready，3个未开始
   ↓
3. 点击Merge按钮
   ↓
4. 浮动面板展开
   ↓
5. 自动选择2个ready的
   ↓
6. 手动选择2个未开始的（或者不选）
   ↓
7. 点击"开始合并"
   ↓
8. 显示警告："3个未开始，将被跳过"
   ↓
9. 仅提交2个ready的storyboard
   ↓
10. 显示进度条
   ↓
11. 完成后预览
```

#### 场景C：全部未就绪，引导生成

```
1. 用户刚创建项目，还没有storyboard
   ↓
2. 点击Merge按钮
   ↓
3. 浮动面板展开
   ↓
4. 所有5个都是"未开始"状态
   ↓
5. 开始合并按钮disabled
   ↓
6. 提示："请先为storyboard生成video"
   ↓
7. 用户点击单个storyboard的"生成video"
   ↓
8. 自动检测到有新video ready
   ↓
9. 按钮自动enabled
   ↓
10. 点击开始合并
   ↓
11. 提交所有ready的storyboard
```

---

## 六、边界情况处理

### 6.1 合并时某些storyboard失败

**场景：**
- Scene 1, 2, 3 ready
- Scene 4 正在生成中
- Scene 5 failed

**处理：**
```
1. 开始合并时，仅提交1, 2, 3
2. Scene 4 加入队列
3. Scene 5 跳过（因为failed）
4. 进度条显示：3/4 processed
5. 最终结果：包含Scene 1, 2, 3的视频
6. 提示："Scene 5合并失败，已自动跳过"
```

### 6.2 用户在合并中修改选择

**场景：**
- 合并在进行中（进度50%）
- 用户修改选择，取消Scene 2的选择

**处理：**
```
1. 显示警告："合并正在进行，无法修改选择"
2. 按钮disabled
3. 提示："合并完成后可重新打开面板"
4. 或者提供"取消当前合并"选项
```

### 6.3 用户关闭面板后再打开

**场景：**
- 合并在进行中
- 用户关闭面板
- 用户重新打开面板

**处理：**
```
1. 面板自动切换到"进度视图"
2. 显示当前进度
3. 选项：继续等待 / 取消任务
4. 不允许重新选择storyboard
```

---

## 七、技术实现要点

### 7.1 关键组件

```tsx
// MergePanel.tsx
export function MergePanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <div className={`merge-panel ${isOpen ? 'open' : ''}`}>
      {renderContent()}
    </div>
  )
}

// StoryboardItem.tsx
export function StoryboardItem({
  storyboard,
  isSelected,
  onSelect,
  canSelect
}: Props) {
  return (
    <div className={`storyboard-item ${storyboard.status}`}>
      {/* 逻辑 */}
    </div>
  )
}
```

### 7.2 样式变量

```css
/* colors.css */
:root {
  --color-ready: #22c55e;
  --color-processing: #3b82f6;
  --color-not-started: #9ca3af;

  --color-ready-bg: #f0fdf4;
  --color-processing-bg: #eff6ff;
  --color-not-started-bg: #f9fafb;
}
```

### 7.3 性能优化

```typescript
// 使用useMemo缓存计算结果
const selectedStoryboardsData = useMemo(() => {
  return selectedStoryboards.map(id => allStoryboards.find(s => s.id === id))
}, [selectedStoryboards, allStoryboards])

// 滚动优化
const panelContentRef = useRef<HTMLDivElement>(null)

// 使用ResizeObserver监听尺寸变化
useEffect(() => {
  const observer = new ResizeObserver(() => {
    // 处理尺寸变化
  })

  if (panelContentRef.current) {
    observer.observe(panelContentRef.current)
  }

  return () => observer.disconnect()
}, [])
```

---

## 八、测试场景

### 8.1 功能测试

| 场景ID | 测试步骤 | 预期结果 |
|--------|----------|----------|
| FM-001 | 点击Merge按钮，面板展开 | 按钮变为向下箭头，面板出现 |
| FM-002 | 点击已就绪的storyboard勾选框 | 勾选，颜色变绿 |
| FM-003 | 点击"全选"按钮 | 所有ready的storyboard被选中 |
| FM-004 | 点击"开始合并"（有选择） | 提交任务，面板切换为进度视图 |
| FM-005 | 合并100%完成后 | 显示播放器，按钮变为"下载" |
| FM-006 | 点击关闭面板 | 按钮重置为三角形，面板收起 |
| FM-007 | 合并中点击"取消任务" | 任务取消，面板恢复初始状态 |

### 8.2 边界测试

| 场景ID | 测试步骤 | 预期结果 |
|--------|----------|----------|
| BE-001 | 未选择任何storyboard，点击"开始合并" | 按钮disabled，显示错误提示 |
| BE-002 | 合并进行中，修改选择 | 警告提示，不允许修改 |
| BE-003 | 合并完成，立即关闭再打开面板 | 显示完成状态，可以重新预览 |
| BE-004 | 所有storyboard都"未开始"，点击合并 | 按钮disabled，引导用户生成video |
| BE-005 | 合并过程中网络断开 | 自动重连，进度持续更新 |

---

## 九、后续优化方向

### 9.1 短期优化（1-2周）

- [ ] 支持批量生成video
- [ ] 合并结果支持重新生成
- [ ] 历史合并记录查看

### 9.2 中期优化（1-2月）

- [ ] 合并参数自定义（转场效果、节奏调整）
- [ ] 多版本合并对比
- [ ] 合并任务队列管理

### 9.3 长期优化（3-6月）

- [ ] AI辅助调整合并策略
- [ ] 视频质量自动优化
- [ ] 云端自动同步合并进度

---

## 十、附录：关键文件清单

### 10.1 需要修改的文件

1. **src/app/ai/projects/scenes/page.tsx**
   - 新增mergeTask状态
   - 新增isMergePanelOpen状态
   - 新增selectedStoryboards状态
   - 新增toggleMergePanel函数
   - 新增handleStartMerge函数
   - 新增WebSocket事件处理

2. **src/app/ai/projects/scenes/components/scene-card.tsx**
   - 修改Merge按钮为三角形/向下箭头
   - 点击事件切换面板展开状态

3. **src/app/ai/projects/scenes/components/merge-panel.tsx** (新建)
   - 浮动面板主组件
   - 进度区组件
   - 清单区组件
   - 播放器组件

4. **src/app/ai/projects/scenes/components/storyboard-item.tsx** (新建)
   - 单个storyboard选择项组件

### 10.2 需要的样式文件

1. **styles/merge-panel.css**
   - 浮动面板样式
   - 按钮状态样式
   - 进度条样式
   - 动画样式

2. **styles/merge-status.css**
   - ready/processing/not-started状态样式
   - 播放器样式

---

## 十一、总结

本方案通过以下设计解决了用户的核心痛点：

1. **提前检查**：避免在部分未就绪的情况下提交任务
2. **透明可见**：实时显示进度和状态
3. **灵活选择**：用户可手动控制参与合并的storyboard
4. **容错能力**：支持部分失败自动跳过
5. **即时反馈**：完成后立即预览下载

核心创新点：
- 🎯 智能选择（自动选择已就绪）
- 📊 实时进度追踪
- 🎬 完成后自动预览
- 🔒 防止无效操作（disabled状态引导）
- 🔄 支持取消和重试

---

**文档结束**

*最后更新：2026-08-31*
*状态：✅ 等待开发评审*
