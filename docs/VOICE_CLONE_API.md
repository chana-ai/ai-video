# 声音克隆 API 定义

## 端点信息

- **URL**: `/api/v2/voice/clone`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Description**: 上传录制音频进行声音克隆

## 请求参数 (Input)

### FormData 参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `audio_file` | File | 是 | 录制的音频文件（WAV 格式推荐） |
| `project_id` | string | 是 | 项目 ID |
| `stage_id` | string | 是 | 阶段 ID |
| `asset_id` | string | 是 | 资源/角色 ID |
| `vendor` | string | 是 | 供应商，固定为 `qwen` |
| `emotion` | string | 是 | 情感，可选值：neutral, happy, sad, angry, fearful, disgust, surprised |

### 请求示例

```javascript
const formData = new FormData();
formData.append('audio_file', audioFile); // Blob 对象
formData.append('project_id', '123');
formData.append('stage_id', '456');
formData.append('asset_id', '789');
formData.append('vendor', 'qwen');
formData.append('emotion', 'neutral');

const response = await axios.post('/api/v2/voice/clone', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
```

## 响应数据 (Output)

### 成功响应 (200 OK)

```json
{
  "code": 0,
  "data": {
    "voice_path": "https://example.com/generated_voice.wav",
    "voice_url": "https://example.com/generated_voice.wav",
    "voice_name": "克隆声音",
    "duration": 5.23
  },
  "message": "success"
}
```

### 错误响应

**音频文件无效** (400 Bad Request)
```json
{
  "code": 400,
  "message": "Invalid audio file format",
  "data": null
}
```

**音频文件太短** (400 Bad Request)
```json
{
  "code": 400,
  "message": "Audio file is too short, minimum 3 seconds",
  "data": null
}
```

**音频文件太长** (400 Bad Request)
```json
{
  "code": 400,
  "message": "Audio file is too long, maximum 30 seconds",
  "data": null
}
```

**服务器错误** (500 Internal Server Error)
```json
{
  "code": 500,
  "message": "Failed to clone voice",
  "data": null
}
```

## 客户端处理示例

```typescript
const handleVoiceClone = async () => {
    if (!selectedAsset || !selectedAsset.voiceConfig?.voice) {
        alert('请先录制声音');
        return;
    }

    setIsGeneratingAudio(true);
    setAudioPreviewUrl('');

    try {
        const audioFile = selectedAsset.voiceConfig.voice as Blob;
        if (!audioFile) {
            alert('请先录制声音');
            setIsGeneratingAudio(false);
            return;
        }

        const formData = new FormData();
        formData.append('audio_file', audioFile);
        formData.append('project_id', projectId || '');
        formData.append('stage_id', stageId || '');
        formData.append('asset_id', selectedAsset.id.toString());
        formData.append('vendor', 'qwen');
        formData.append('emotion', selectedAsset.voiceConfig.emotion || 'neutral');

        const response = await instance.post('/api/v2/voice/clone', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data?.voice_path) {
            setAudioPreviewUrl(response.data.voice_path);
            // 更新 voiceConfig 以包含克隆的音频
            handleVoiceConfigChange({
                ...selectedAsset.voiceConfig,
                voice_url: response.data.voice_url || ''
            });
        } else {
            alert('声音克隆失败，未获取到音频链接');
        }
    } catch (err: any) {
        console.error('Failed to clone voice:', err);
        alert(`声音克隆失败: ${err.message || '未知错误'}`);
    } finally {
        setIsGeneratingAudio(false);
    }
};
```

## 注意事项

1. **音频格式**: 推荐使用 WAV 格式，其他格式（MP3、M4A 等）也可能被支持
2. **音频时长**:
   - 最小时长：建议 3-5 秒
   - 最大时长：建议 30 秒（根据供应商要求）
3. **音频质量**:
   - 建议使用干净的音频（无背景噪音）
   - 使用清晰的语音录制
4. **克隆时长**: 生成的音频时长应该与输入音频相似
5. **供应商**: 目前固定使用 Qwen 作为声音克隆供应商

## 返回数据说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `voice_path` | string | 生成的音频文件 URL |
| `voice_url` | string | 生成的音频文件 URL（备用字段） |
| `voice_name` | string | 声音名称，默认为"克隆声音" |
| `duration` | number | 音频时长（秒） |

## 与 TTS 的区别

| 特性 | TTS (语音合成) | 声音克隆 |
|------|----------------|----------|
| 输入 | 语音模型 + 文本 | 录制音频 |
| 供应商 | Azure / Qwen | Qwen |
| 声音质量 | 合成声音 | 与输入音频相似 |
| 灵活性 | 高（多种语音模型） | 低（需要录制） |
| 适用场景 | 通用语音合成 | 特定声音克隆 |

## 错误代码

| 代码 | 说明 | 解决方案 |
|------|------|----------|
| 400 | 请求参数错误或音频文件无效 | 检查音频格式、时长 |
| 401 | 未授权 | 检查用户登录状态 |
| 500 | 服务器内部错误 | 联系技术支持 |
| 503 | 服务不可用 | 稍后重试 |

## 更新记录

- **2026-08-15**: 创建 API 定义文档
