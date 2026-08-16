'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Package } from 'lucide-react'
import Header from "../../header"
import { instance } from '@/lib/axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Asset, ResourceAsset, VoiceConfig, AssetType, SelectedAsset, Batch, ImageInfo } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AssetList } from '../components/value-assets/AssetList'
import { AssetDetail } from '../components/value-assets/AssetDetail'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ValueAssets() {
    const searchParams = useSearchParams()
    const projectId = searchParams.get('project_id')
    const stageId = searchParams.get('stage_id')
    const router = useRouter()

    const [characters, setCharacters] = useState<Asset[]>([])
    const [resourceAssets, setResourceAssets] = useState<ResourceAsset[]>([])
    const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [promptChanged, setPromptChanged] = useState(false)
    const [errors, setErrors] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)
    const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
    const [newResourceName, setNewResourceName] = useState('')
    const [voiceModels, setVoiceModels] = useState<any[]>([])
    const [audioPreviewUrl_tts, setAudioPreviewUrl_tts] = useState('')
    const [audioPreviewUrl_clone, setAudioPreviewUrl_clone] = useState('')
    const [mode, setMode] = useState<'tts' | 'clone'>('tts')
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
    const [history, setHistory] = useState<Batch[]>([])
    const [currentBatch, setCurrentBatch] = useState<Batch | null>(null)
    const [currentVendor, setCurrentVendor] = useState<string>('azure')
    const [projectDetail, setProjectDetail] = useState<any>(null)
    const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set())


    // Save history to localStorage (can be used as a local cache/fallback)
    useEffect(() => {
        if (!selectedAsset) return;
        const key = `history_${selectedAsset.type}_${selectedAsset.id}`;
        const cacheData = {
            timestamp: Date.now(),
            data: history
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    }, [history, selectedAsset?.id, selectedAsset?.type]);

    // Fetch project detail on mount
    useEffect(() => {
        if (!projectId) return;
        instance.get(`/api/v2/project/detail?project_id=${projectId}`)
            .then((res: any) => {
                setProjectDetail(res);
                if (res && res.config) {
                    setCurrentVendor(res.config.vendor || 'azure');
                }
            })
            .catch(err => {
                console.error("Failed to fetch project detail:", err);
            });
    }, [projectId]);

    // Fetch characters on mount
    useEffect(() => {
        if (!projectId || !stageId) return;

        instance.get(`/api/v2/asset/list?project_id=${projectId}&stage_id=${stageId}`)
            .then((res: any) => {
                const assets = res.assets || [];

                setCharacters(assets.filter((assets: any) => assets.type === 0));
                if (assets.length > 0) {
                    selectAsset('character', assets[0], true);
                }
                setResourceAssets(assets.filter((assets: any) => assets.type === 1));
            })
            .catch(err => {
                console.error("Failed to fetch characters:", err);
            });
    }, [projectId, stageId]);

    // Fetch voice metadata when vendor changes
    useEffect(() => {
        instance.get(`/api/v2/voice/get_voice_meta?vendor=${currentVendor}`)
            .then((res: any) => {
                setVoiceModels(res || []);
            })
            .catch(err => {
                console.error("Failed to fetch voice models:", err);
            });
    }, [currentVendor]);


    const selectAsset = async (type: AssetType, asset: Asset | ResourceAsset, forceRefresh: boolean = false) => {
        const scenario = type === 'character' ? 'CHARACTER' : 'RESOURCE';
        const referenceId = asset.id;
        const cacheKey = `history_${type}_${referenceId}`;

        // Reset state before fetching new asset data
        setHistory([]);
        setCurrentBatch(null);
        setPromptChanged(false);
        setSelectedRowIndex(null);
        setMode('tts');

        // Update selected asset basic info
        if (type === 'character') {
            const char = asset as Asset;
            let config: any = {};
            if (char.config) {
                try {
                    config = typeof char.config === 'string' ? JSON.parse(char.config) : char.config;
                } catch (e) {
                    console.error("Failed to parse asset config:", e);
                }
            }
            const initialSelected = new Set<number>();
            if (config.front) initialSelected.add(config.front);
            if (config.side) initialSelected.add(config.side);
            if (config.back) initialSelected.add(config.back);
            setSelectedImageIds(initialSelected);

            const ttsVoicePath = config.tts_voice_path || char.tts_voice_path || char.tts_voice_Path || '';
            const cloneVoicePath = config.clone_voice_path || char.clone_voice_path || '';
            const voiceSetting = { ...(config.voice_setting || {}) };
            delete voiceSetting.mode;

            setSelectedAsset({
                type: 'character',
                id: char.id,
                name: char.name,
                description: char.description || '',
                prompt: char.prompt || '',
                images: char.images || [],
                voiceConfig: {
                    voice: '',
                    voice_name: '',
                    desc: '',
                    gender: 'female',
                    emotion: 'neutral',
                    vendor: 'azure',
                    is_master: false,
                    ...voiceSetting,
                    tts_voice_path: ttsVoicePath,
                    clone_voice_path: cloneVoicePath
                }
            });
            setAudioPreviewUrl_tts(ttsVoicePath);
            setAudioPreviewUrl_clone(cloneVoicePath);
        } else {
            const resource = asset as ResourceAsset;
            setSelectedImageIds(new Set());
            setAudioPreviewUrl_tts('');
            setAudioPreviewUrl_clone('');
            setSelectedAsset({
                type: 'resource',
                id: resource.id,
                name: resource.name,
                description: resource.description || '',
                prompt: '',
                images: resource.images || []
            });
        }

        // Check cache first (2-hour TTL) unless forceRefresh is true
        if (forceRefresh) {
            localStorage.removeItem(cacheKey);
        }

        const stored = localStorage.getItem(cacheKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const { timestamp, data } = parsed;
                console.log(`[Cache] Found for ${cacheKey}:`, { timestamp, dataLen: data?.length, raw: stored });

                if (timestamp && data && Date.now() - timestamp < 2 * 60 * 60 * 1000) {
                    if (data.length > 0) {
                        setCurrentBatch(data[0]);
                        setHistory(data);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to parse cached history:", e);
            }
        }

        // Fetch history from backend
        try {
            const res: any = await instance.post('/api/v2/asset/list_asset_by_resource', {
                project_id: Number(projectId),
                scenarios: [scenario],
                reference_id: referenceId
            });

            const historyList = res[scenario] || []; // Expected format: [[resource1, resource2], [...]]
            if (historyList.length > 0) {
                // Map nested response to Batches
                const batches: Batch[] = historyList.map((group: any[]) => {
                    const first = group[0] || {};
                    return {
                        id: first.version || Date.now(), // Version as int ID
                        timestamp: new Date(first.create_time).getTime(),
                        images: group.map(r => ({
                            id: r.id,
                            url: r.signed_url || r.uri || r.image_url || r.url,
                            oss_path: r.oss_path,
                            is_selected: false
                        })),
                        version: first.version,
                        isStarred: false
                    };
                });

                if (batches.length > 0) {
                    setCurrentBatch(batches[0]);
                    setHistory(batches);

                    // Update cache
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        data: batches
                    }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch asset history:", err);
        }
    };

    const handlePromptChange = (value: string) => {
        if (value.length <= 120 && selectedAsset) {
            setSelectedAsset({ ...selectedAsset, prompt: value });
            setPromptChanged(true);
        }
    };

    const handleVoiceConfigChange = (config: VoiceConfig) => {
        if (selectedAsset) {
            setSelectedAsset({ ...selectedAsset, voiceConfig: config });
        }
    };

    const handleSaveVoiceConfig = async () => {
        if (!selectedAsset || !selectedAsset.voiceConfig) return;

        try {
            // 根据 mode 设置 voice_name
            let finalVoiceName = selectedAsset.voiceConfig.voice || '';
            if (mode === 'clone') {
                // Cloning 模式，如果已有 voice_name 则使用，否则为空
                finalVoiceName = selectedAsset.voiceConfig.voice_name || '克隆声音';
            }

            // 准备请求数据
            const requestConfig = {
                asset_id: selectedAsset.id,
                project_id: Number(projectId),
                stage_id: Number(stageId),
                voice: selectedAsset.voiceConfig.voice,
                voice_name: finalVoiceName,
                vendor: selectedAsset.voiceConfig.vendor,
                gender: selectedAsset.voiceConfig.gender,
                emotion: selectedAsset.voiceConfig.emotion,
                desc: selectedAsset.voiceConfig.desc,
                is_master: selectedAsset.voiceConfig.is_master,
                mode,
                voice_url: selectedAsset.voiceConfig.voice_url,
            };

            await instance.post('/api/v2/asset/update_voice_config', requestConfig);

        } catch (err: any) {
            console.error('Failed to update voice config:', err);
            alert(`保存语音配置失败: ${err.message || '未知错误'}`);
        }
    };



    const handleGenerate = async (options?: any) => {
        if (!selectedAsset) return;

        setIsGenerating(true);
        setErrors('');

        try {
            const requestBody: any = {
                asset_id: selectedAsset.id,
                project_id: Number(projectId),
                stage_id: Number(stageId),
                description: selectedAsset.description,
                prompt: selectedAsset.prompt,
                num: options?.num || 3
            };

            if (options?.sideBack) {
                requestBody.ref_image_id = options.refImageId;
                requestBody.init_image_url = options.refImageUrl;
            }

            const res: any = await instance.post(`/api/v2/asset/generate_images`, requestBody);

            const generatedImages = res.images || [];
            const mappedImages: ImageInfo[] = generatedImages.map((img: any) => ({
                id: img.id,
                url: img.signed_url || img.uri || img.url,
                oss_path: img.oss_path,
                is_selected: false
            }));

            // If sideBack is true, append to current batch; otherwise create new batch
            if (options?.sideBack && currentBatch) {
                const updatedBatch = {
                    ...currentBatch,
                    images: [...currentBatch.images, ...mappedImages]
                        .filter((img, index, self) => index === self.findIndex(t => t.id === img.id))
                        .slice(0, 8)
                };
                setCurrentBatch(updatedBatch);
                // Sync with history
                setHistory(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
            } else {
                const newBatch: Batch = {
                    id: Date.now(),
                    timestamp: Date.now(),
                    images: mappedImages,
                    version: res.version ? res.version : 0,
                    isStarred: false
                };
                setCurrentBatch(newBatch);
                setHistory(prev => [newBatch, ...prev].slice(0, 20));
            }

            // Invalidate cache on generation
            const cacheKey = `history_${selectedAsset.type}_${selectedAsset.id}`;
            localStorage.removeItem(cacheKey);

            setSelectedImageIds(new Set()); // Reset selection for new batch context
            setIsGenerating(false);

        } catch (err: any) {
            console.error("Failed to generate images:", err);
            setErrors(err.message || '生成失败');
            setIsGenerating(false);
        }
    };

    const handleSaveBatch = async () => {
        if (!selectedAsset || !currentBatch || selectedImageIds.size !== 3) return;

        try {
            const ids = Array.from(selectedImageIds);
            await instance.post('/api/v2/asset/save_selected_images', {
                project_id: Number(projectId),
                stage_id: Number(stageId),
                asset_id: selectedAsset.id,
                front_image_id: ids[0],
                side_image_id: ids[1],
                back_image_id: ids[2]
            });

            // Cache selected images to local storage
            // const selectedImages = currentBatch.images
            //     .filter(img => ids.includes(img.id))
            //     .map(img => ({ id: img.id, url: img.url }));

            // const cacheKey = 'selected_images_cache';
            // const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            // cache[selectedAsset.id] = selectedImages;
            // localStorage.setItem(cacheKey, JSON.stringify(cache));

            // alert('批次保存成功！');

        } catch (err: any) {
            console.error('Failed to save batch:', err);
            alert(`保存失败: ${err.message || '未知错误'}`);
        }
    };


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedAsset) return;

        setUploadingImage(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId || '');
        formData.append('stage_id', stageId || '');
        formData.append('reference_id', selectedAsset.id.toString());
        formData.append('scenario', selectedAsset.type === 'character' ? 'CHARACTER' : 'RESOURCE');

        try {
            const res: any = await instance.post('/api/v2/image/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newImg: ImageInfo = {
                id: res.id,
                url: res.signed_url || res.uri,
                oss_path: res.oss_path,
                is_selected: false
            };

            // Add new image to current batch
            if (currentBatch) {
                const updatedBatch = {
                    ...currentBatch,
                    images: [...currentBatch.images, newImg]
                        .filter((img, index, self) => index === self.findIndex(t => t.id === img.id))
                        .slice(0, 8)
                };
                setCurrentBatch(updatedBatch);
                // Sync with history
                setHistory(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
            } else {
                const newBatch: Batch = {
                    id: Date.now(),
                    timestamp: Date.now(),
                    images: [newImg]
                };
                setCurrentBatch(newBatch);
                setHistory(prev => [newBatch, ...prev].slice(0, 20));
            }
            setUploadingImage(false);
        } catch (err: any) {
            console.error("Failed to upload image:", err);
            setErrors(err.message || '上传失败');
            setUploadingImage(false);
            alert(`上传失败: ${err.message || '未知错误'}`);
        }
    };

    const handleNextClick = () => {
        if (promptChanged) {
            alert('Please save your changes before proceeding.');
            return;
        }

        router.push(`/ai/projects/scenes?project_id=${projectId}&&stage_id=${stageId}`);
    };

    const handleAddResource = () => {
        if (!newResourceName.trim()) {
            alert('请输入资源名称');
            return;
        }

        // Create a new resource asset locally
        const newResource: ResourceAsset = {
            id: Date.now(), // Temporary ID
            name: newResourceName,
            description: '',
            images: []
        };

        setResourceAssets([...resourceAssets, newResource]);
        setNewResourceName('');
        setIsResourceDialogOpen(false);

    };


    const handleAudioPreview = async () => {
        if (!selectedAsset || !selectedAsset.voiceConfig?.voice) {
            alert('请先选择TTS引擎和语音模型');
            return;
        }

        setIsGeneratingAudio(true);
        setAudioPreviewUrl_tts('');

        try {
            const response: any = await instance.post('/api/v2/voice/preview', {
                asset_id: selectedAsset.id,
                model: selectedAsset.voiceConfig.voice,
                vendor: selectedAsset.voiceConfig.vendor || 'azure',
                text: '你好，这是语音试听效果。',
                voice: selectedAsset.voiceConfig.voice,
                voice_name: selectedAsset.voiceConfig.voice_name,
                gender: selectedAsset.voiceConfig.gender,
                emotion: selectedAsset.voiceConfig.emotion,
                desc: selectedAsset.voiceConfig.desc,
            });

            // response 格式: { voice_path: oss_utils.get_oss_url(oss_voice_url), voice_oss_path: oss_voice_url, resource_id: resource.id }
            if (response.voice_path) {
                setAudioPreviewUrl_tts(response.voice_path);
                // 更新 voiceConfig
                handleVoiceConfigChange({
                    ...selectedAsset.voiceConfig,
                    voice_path: response.voice_path,
                    tts_voice_path: response.voice_path,
                    voice: selectedAsset.voiceConfig.voice,
                    voice_url: response.voice_oss_path,
                    gender: selectedAsset.voiceConfig.gender,
                    emotion: selectedAsset.voiceConfig.emotion,
                    desc: selectedAsset.voiceConfig.desc
                });
            } else {
                alert('生成音频失败，未获取到音频链接');
            }
        } catch (err: any) {
            console.error('Failed to generate audio preview:', err);
            alert(`生成音频失败: ${err.message || '未知错误'}`);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleVoiceClone = async (audioUrl: string, text: string) => {
        if (!selectedAsset) {
            alert('请先选择一个角色');
            return;
        }

        setIsGeneratingAudio(true);
        setAudioPreviewUrl_clone('');

        try {
            // 从音频 URL 获取音频文件
            const audioResponse = await fetch(audioUrl);

            // 检查响应状态
            if (!audioResponse.ok) {
                throw new Error(`HTTP error! status: ${audioResponse.status}`);
            }

            const arrayBuffer = await audioResponse.arrayBuffer();

            // 检查文件大小（不超过 7MB）
            const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
            if (fileSizeMB > 7) {
                throw new Error(`音频文件过大，最大支持 7MB，当前大小: ${fileSizeMB.toFixed(2)}MB`);
            }

            // 转换为 WAV 格式（确保是有效的 WAV）
            const wavBuffer = await convertToWav(arrayBuffer);

            // 再次检查大小
            const wavSizeMB = wavBuffer.byteLength / (1024 * 1024);
            if (wavSizeMB > 7) {
                throw new Error(`转换后的 WAV 文件过大，最大支持 7MB，当前大小: ${wavSizeMB.toFixed(2)}MB`);
            }

            // 转换为 Base64
            const base64Audio = uint8ArrayToBase64(wavBuffer);
            const base64Data = `data:audio/wav;base64,${base64Audio}`;

            const response: any = await instance.post('/api/v2/voice/clone', {
                voice_code: base64Data,
                project_id: projectId || '',
                stage_id: stageId || '',
                asset_id: selectedAsset.id.toString(),
                vendor: 'qwen',
                content: text || "这是语音测试效果",
                emotion: selectedAsset.voiceConfig?.emotion || 'neutral'
            });

            // response 格式: VoiceCloneResponse(voice_path, voice_oss_path, voice_name, voice)
            if (response.voice_path) {
                setAudioPreviewUrl_clone(response.voice_path);
                // 更新 voiceConfig 以包含克隆的音频
                handleVoiceConfigChange({
                    voice: response.voice || selectedAsset.voiceConfig?.voice || '', // 添加响应中的 voice 字段
                    clone_voice_path: response.voice_path,
                    voice_url: response.voice_oss_path,
                    voice_name: response.voice_name,
                    recorded_text: text,
                    desc: selectedAsset.voiceConfig?.desc || '',
                    gender: selectedAsset.voiceConfig?.gender || 'female',
                    emotion: selectedAsset.voiceConfig?.emotion || 'neutral',
                    vendor: selectedAsset.voiceConfig?.vendor || 'azure',
                    is_master: selectedAsset.voiceConfig?.is_master || false,
                    tts_voice_path: selectedAsset.voiceConfig?.tts_voice_path || '',
                    mode: 'clone'
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

    // 将 Uint8Array 转换为 Base64
    const uint8ArrayToBase64 = (uint8Array: Uint8Array): string => {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return window.btoa(binary);
    };

    // 将 ArrayBuffer 转换为 WAV 格式的 Uint8Array
    const convertToWav = async (audioBuffer: ArrayBuffer): Promise<Uint8Array> => {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            audioContext.decodeAudioData(audioBuffer)
                .then(buffer => {
                    const wavData = bufferToWav(buffer);
                    resolve(wavData);
                })
                .catch(err => {
                    reject(new Error(`解码音频失败: ${err.message}`));
                });
        });
    };

    // 将 AudioBuffer 转换为 WAV 格式的 Uint8Array（16-bit PCM）
    const bufferToWav = (buffer: any): Uint8Array => {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const dataLength = buffer.length * blockAlign;
        const headerLength = 44;

        const bufferLength = headerLength + dataLength;
        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);

        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true); // 文件大小
        writeString(view, 8, 'WAVE');
        // fmt sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // chunk size
        view.setUint16(20, format, true); // PCM
        view.setUint16(22, numChannels, true); // 通道数
        view.setUint32(24, sampleRate, true); // 采样率
        view.setUint32(28, sampleRate * blockAlign, true); // bytes/second
        view.setUint16(32, blockAlign, true); // block align
        view.setUint16(34, bitDepth, true); // bits/sample
        // data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true); // data size

        // 写入音频数据
        const channels: any[] = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, channels[channel][i]));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }

        return new Uint8Array(arrayBuffer);
    };

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Header title="Value Assets" />
                </div>
                <h1 className="text-3xl font-bold mb-6">角色与资源设置</h1>

                <div className="flex gap-6">
                    <AssetList
                        characters={characters}
                        resourceAssets={resourceAssets}
                        selectedAsset={selectedAsset}
                        onSelectAsset={selectAsset}
                        onAddResource={() => setIsResourceDialogOpen(true)}
                    />

                    <div className="flex-1 flex flex-col min-h-0">
                        <AssetDetail
                            selectedAsset={selectedAsset}
                            voiceModels={voiceModels}
                            isGenerating={isGenerating}
                            isGeneratingAudio={isGeneratingAudio}
                            audioPreviewUrl_tts={audioPreviewUrl_tts}
                            audioPreviewUrl_clone={audioPreviewUrl_clone}
                            mode={mode}
                            onModeChange={setMode}
                            selectedRowIndex={selectedRowIndex}
                            errors={errors}
                            uploadingImage={uploadingImage}
                            history={history}
                            currentBatch={currentBatch}
                            selectedImageIds={selectedImageIds}
                            projectDetail={projectDetail}
                            onVendorChange={setCurrentVendor}
                            onPromptChange={handlePromptChange}
                            onGenerateImages={handleGenerate}
                            onImageUpload={handleImageUpload}
                            onAudioPreview={handleAudioPreview}
                            onRowSelect={setSelectedRowIndex}
                            onSaveVoiceConfig={handleSaveVoiceConfig}
                            onVoiceConfigChange={handleVoiceConfigChange}
                            onSetSelectedImageIds={setSelectedImageIds}
                            onSaveBatch={handleSaveBatch}
                            onVoiceClone={handleVoiceClone}
                            onRefresh={() => {
                                if (selectedAsset) {
                                    selectAsset(selectedAsset.type, selectedAsset as any, true);
                                }
                            }}
                            onRestoreBatch={(batch) => {
                                setCurrentBatch(batch);
                                setSelectedImageIds(new Set()); // Reset selection when restoring
                            }}
                        />

                        <div className="mt-6 flex justify-end">
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 px-8 py-2 text-lg h-auto"
                                onClick={handleNextClick}
                            >
                                下一步
                            </Button>
                        </div>
                    </div>
                </div>

                <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>添加新资源</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">资源名称</label>
                            <Input
                                value={newResourceName}
                                onChange={(e) => setNewResourceName(e.target.value)}
                                placeholder="请输入资源名称"
                                maxLength={50}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddResource();
                                    }
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsResourceDialogOpen(false);
                                    setNewResourceName('');
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleAddResource}
                            >
                                确认
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
