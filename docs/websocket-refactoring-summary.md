# WebSocket 重构总结

## 重构目标
将项目中分散的三个 WebSocket 封装统一为一个，简化代码结构，减少混乱。

## 删除的文件
- `src/lib/websocket-enhanced.tsx` - 增强的 WebSocket 管理器
- `src/lib/websocket-manager.tsx` - 统一的 WebSocket 管理器 Hook
- `src/lib/websocket.tsx` - 旧的 WebSocket 实现

## 保留的核心文件
- `src/lib/websocket.ts` - 统一的 WebSocket 客户端实现

## WebSocket API 变更

### 旧 API
```typescript
// createVideoCombination 不需要场景ID
wsManagerEnhanced.sendCreateVideoCombination(project_id, stage_id)

// executeAction 内部处理重试
await wsManagerEnhanced.executeAction('videoCombination', payload, options)
```

### 新 API
```typescript
// createVideoCombination 需要 sceneIds 参数
wsManager.createVideoCombination(sceneIds: number[])

// executeAction 保持不变
await wsManager.executeAction(actionType, payload, options)
```

## 修改的文件

### 1. `src/app/ai/projects/scenes/hooks/use-video-actions.ts`
- 从 `wsManagerEnhanced` 迁移到 `wsManager`
- 使用 `executeAction` 方法
- 更新所有订阅代码

### 2. `src/app/ai/projects/scenes/page.tsx`
- 移除重复的 WebSocket 连接代码
- 删除 `useWebSocketManager` Hook 使用
- 连接由 `layout.tsx` 中的 `WebSocketProvider` 统一管理

### 3. `src/app/ai/projects/scenes/components/merge-panel.tsx`
- 从 `wsClient` (不存在) 迁移到 `wsManager`
- 使用 `createVideoCombination(selectedStoryboards.map(s => s.id))`
- 更新所有订阅代码

### 4. `src/app/ai/projects/scenes/hooks/use-merge-adapter.ts`
- 更新 `createVideoCombination` 调用
- 从 `sendCreateVideoCombination` 迁移到 `createVideoCombination`

### 5. `src/app/ai/projects/scenes/components/video-component.tsx`
- 从 `sendCreateVideoClip` 迁移到 `createVideoClip`
- 修正参数数量

## 使用场景

### 场景 1: Storyboard 生成
**位置**: `video-component.tsx`
**流程**:
1. 组件调用 `wsManager.createVideoClip(sceneId, videoPrompt, imageId)`
2. 订阅事件: `createVideoClipAccepted`, `createVideoClipComplete`, `createVideoClipError`
3. 收到响应后更新 UI 显示

### 场景 2: 视频合并
**位置**: `merge-panel.tsx` 和 `use-merge-adapter.ts`
**流程**:
1. 用户选择已就绪的 storyboards
2. 调用 `wsManager.createVideoCombination(sceneIds)`
3. 订阅事件: `createVideoCombinationAccepted`, `createVideoCombinationProgress`, `createVideoCombinationComplete`, `createVideoCombinationError`
4. 显示合并进度和结果

### 场景 3: 通用操作
**位置**: `use-video-actions.ts`
**流程**:
1. 使用 `wsManager.executeAction()` 方法
2. 内部自动处理重试逻辑
3. 支持订阅所有相关事件

## WebSocket 连接管理

### 全局连接
- 在 `src/app/layout.tsx` 中使用 `WebSocketProvider` 包裹应用
- 根据 URL 参数 `project_id` 和 `stage_id` 自动连接
- 连接由 Provider 统一管理，不需要组件手动调用 `connect()`

### 组件内订阅
- 各组件通过 `wsManager.subscribe()` 订阅特定事件
- 订阅在 `useEffect` 中设置，`useEffect` 清理函数中取消订阅
- 保持事件响应式更新

## 优势

1. **单一数据源**: 所有 WebSocket 逻辑集中在一个文件中
2. **简化使用**: 移除了多个相似的封装，减少理解成本
3. **统一 API**: 所有地方使用相同的接口
4. **自动重连**: 统一的重连机制，避免多次重连
5. **连接管理**: Provider 模式确保连接状态一致
