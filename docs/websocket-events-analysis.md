# WebSocket 订阅事件分析

## 概述

本文档总结了 `use-video-actions.ts` 和 `merge-panel.tsx` 中的 WebSocket 订阅事件，以及消息体中 `request_id` 的使用情况。

## WebSocket 消息体结构

### WsMessage 接口定义

```typescript
export interface WsMessage {
  event: string
  request_id?: string          // 可选的请求ID
  data?: any
  message?: string
  code?: number
  task_id?: string             // 可选的任务ID
  result_url?: string          // 可选的结果URL
  result?: any                 // 可选的结果数据
  project_id?: string | number
  stage_id?: string | number
  scene_id?: string | number
  progress?: number            // 进度值 (0-100)
  processed?: number           // 已处理数量
  total?: number               // 总数量
  current_processing?: string  // 当前处理的场景标题
}
```

### request_id 的作用

`request_id` 用于：
1. **请求追踪**：关联客户端发送的请求和服务器返回的响应
2. **异步通信**：在异步 WebSocket 通信中保持请求-响应对应关系
3. **错误处理**：便于定位和排查特定请求的问题

### request_id 是否必需？

**不需要，因为：**

1. **WebSocket 是实时通信协议**：
   - 消息是事件驱动的（event-based）
   - 服务器主动推送消息，不需要客户端轮询
   - 每个消息本身就是对特定操作的响应

2. **task_id 已提供任务追踪**：
   - `task_id` 用于标识正在进行的任务
   - 所有相关的进度、完成、错误消息都会包含相同的 `task_id`
   - 客户端可以通过 `task_id` 跟踪任务全生命周期

3. **示例流程**：
   ```
   客户端发送请求 (无 request_id) → 服务器接受请求 (返回 task_id)
   服务器推送进度 (有 task_id) → 服务器推送完成 (有 task_id 和 result_url)
   ```

## 订阅事件详细列表

### 1. use-video-actions.ts 中的订阅事件

#### 视频片段生成

| 事件名称 | 事件类型 | 消息体字段 | request_id | task_id | 说明 |
|---------|---------|-----------|-----------|---------|------|
| `createVideoClipAccepted` | 接受 | scene_id, task_id | ❌ | ✅ | 视频生成任务已接受 |
| `createVideoClipProgress` | 进度 | scene_id, progress, processed, total | ❌ | ✅ | 视频生成进度更新 |
| `createVideoClipComplete` | 完成 | scene_id, result_url, task_id | ❌ | ✅ | 视频生成完成 |
| `createVideoClipError` | 错误 | scene_id, message | ❌ | ❌ | 视频生成失败 |

**说明**：
- `createVideoClip` 操作不使用 `request_id`，因为它是简单的一步操作
- 通过 `task_id` 可以追踪整个视频生成过程

#### 视频合并

| 事件名称 | 事件类型 | 消息体字段 | request_id | task_id | 说明 |
|---------|---------|-----------|-----------|---------|------|
| `createVideoCombinationAccepted` | 接受 | project_id, stage_id, task_id | ❌ | ✅ | 合并任务已接受 |
| `createVideoCombinationProgress` | 进度 | project_id, stage_id, progress, processed, total, current_processing | ❌ | ✅ | 合并进度更新 |
| `createVideoCombinationComplete` | 完成 | project_id, stage_id, result_url, task_id | ❌ | ✅ | 合并完成 |
| `createVideoCombinationError` | 错误 | project_id, stage_id, message | ❌ | ❌ | 合并失败 |

**说明**：
- `createVideoCombination` 操作同样不使用 `request_id`
- 通过 `task_id` 可以追踪整个合并过程
- `current_processing` 字段指示当前正在处理的故事板

### 2. merge-panel.tsx 中的订阅事件

| 事件名称 | 事件类型 | 消息体字段 | request_id | task_id | 说明 |
|---------|---------|-----------|-----------|---------|------|
| `createVideoCombinationAccepted` | 接受 | project_id, stage_id, task_id | ❌ | ✅ | 合并任务已接受，初始化合并状态 |
| `createVideoCombinationProgress` | 进度 | project_id, stage_id, progress, processed, total, current_processing | ❌ | ✅ | 实时更新合并进度 |
| `createVideoCombinationComplete` | 完成 | project_id, stage_id, result_url, task_id | ❌ | ✅ | 合并完成，显示预览和下载 |
| `createVideoCombinationError` | 错误 | project_id, stage_id, message | ❌ | ❌ | 合并失败，显示错误提示 |

## 总结

### request_id 使用情况

| 操作类型 | 使用 request_id | 主要追踪方式 | 使用场景 |
|---------|---------------|-------------|---------|
| 简单的一步操作 | ❌ 不使用 | task_id | createVideoClip |
| 复杂的多步操作 | ❌ 不使用 | task_id | createVideoCombination |

### 为什么不需要 request_id？

1. **WebSocket 事件驱动模型**：
   - 每条消息都是事件通知，不需要客户端请求-响应配对
   - 服务器主动推送消息，客户端只需监听事件

2. **task_id 足以追踪任务**：
   - `task_id` 是服务端生成的任务标识符
   - 所有相关消息都包含相同的 `task_id`
   - 客户端可以通过 `task_id` 关联所有消息

3. **现代 WebSocket 模式**：
   - 许多 WebSocket API 选择不使用 request_id
   - 更符合事件驱动架构的设计理念

### 建议

**当前实现是合理的**，因为：
- ✅ task_id 提供了完整的任务追踪
- ✅ WebSocket 事件模型不需要 request_id
- ✅ 减少了消息体大小
- ✅ 简化了客户端实现

如果未来需要请求追踪（例如需要知道哪个客户端发起了请求），可以考虑在消息体中添加 `client_id` 或其他标识符，但 `request_id` 不是必需的。
