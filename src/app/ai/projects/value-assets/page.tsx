'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Package } from 'lucide-react'
import Header from "../../header"
import { instance } from '@/lib/axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Character, ImageInfo, ResourceAsset, VoiceConfig, AssetType, SelectedAsset } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AssetList } from '../components/value-assets/AssetList'
import { AssetDetail } from '../components/value-assets/AssetDetail'

export default function ValueAssets() {
    const searchParams = useSearchParams()
    const projectId = searchParams.get('project_id')
    const stageId = searchParams.get('stage_id')
    const router = useRouter()

    const [characters, setCharacters] = useState<Character[]>([])
    const [resourceAssets, setResourceAssets] = useState<ResourceAsset[]>([])
    const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [promptChanged, setPromptChanged] = useState(false)
    const [errors, setErrors] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)
    const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
    const [newResourceName, setNewResourceName] = useState('')
    const [voiceModels, setVoiceModels] = useState<any[]>([])
    const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)

    // Fetch characters on mount
    useEffect(() => {
        if (!projectId || !stageId) return;

        instance.get(`/api/v2/asset/list?project_id=${projectId}&stage_id=${stageId}`)
            .then((res: any) => {
                const assets = res.assets || [];

                setCharacters(assets.filter((assets: any) => assets.type === 0));
                if (assets.length > 0) {
                    selectAsset('character', assets[0]);
                }
                setResourceAssets(assets.filter((assets: any) => assets.type === 1));
            })
            .catch(err => {
                console.error("Failed to fetch characters:", err);
            });

        instance.get('/api/v2/voice/get_voice_meta')
            .then((res: any) => {
                setVoiceModels(res || []);
            })
            .catch(err => {
                console.error("Failed to fetch voice models:", err);
            });
    }, [projectId, stageId]);

    const selectAsset = (type: AssetType, asset: Character | ResourceAsset) => {
        if (type === 'character') {
            const char = asset as Character;
            // Load voice config if available, otherwise use defaults
            let config: any = {};
            if (char.config) {
                try {
                    config = typeof char.config === 'string' ? JSON.parse(char.config) : char.config;
                } catch (e) {
                    console.error("Failed to parse asset config:", e);
                }
            }


            setSelectedAsset({
                type: 'character',
                id: char.id,
                name: char.name,
                description: char.description || '',
                prompt: char.prompt || '',
                images: char.images || [],
                voiceConfig: config
            });
            setAudioPreviewUrl(config.voice_path);
        } else if (type === 'resource') {
            const resource = asset as ResourceAsset;
            setSelectedAsset({
                type: 'resource',
                id: resource.id,
                name: resource.name,
                description: resource.description || '',
                prompt: '',
                images: resource.images || []
            });
        }
        setSelectedRowIndex(null);
        setPromptChanged(false);
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
            await instance.post('/api/v2/voice/update_voice_config', {
                id: selectedAsset.id,
                project_id: Number(projectId),
                stage_id: Number(stageId),
                ...selectedAsset.voiceConfig
            });
            alert('语音配置保存成功！');
        } catch (err: any) {
            console.error('Failed to update voice config:', err);
            alert(`保存语音配置失败: ${err.message || '未知错误'}`);
        }
    };



    const handleGenerate = async () => {
        if (!selectedAsset) return;

        // Max 4 rows (12 images)
        if (selectedAsset.images.length >= 12) {
            setErrors('已达到最大图片限制 (4行)');
            return;
        }

        setIsGenerating(true);
        setErrors('');

        let initImageUrl = '';
        if (selectedRowIndex !== null) {
            // Check if first column of selected row has image
            const firstImgInRow = selectedAsset.images[selectedRowIndex * 3];
            if (firstImgInRow) {
                initImageUrl = firstImgInRow.oss_path || firstImgInRow.url;
            }
        }

        if (selectedAsset.type === 'character') {
            await instance.post(`/api/v2/asset/generate_images`, {
                asset_id: selectedAsset.id,
                project_id: projectId,
                stage_id: stageId,
                description: selectedAsset.description,
                prompt: selectedAsset.prompt,
                ...(initImageUrl && { init_image_url: initImageUrl })
            }).then((res: any) => {
                const generatedImages = res.images; // Expecting 1, 2 or 3 images

                setSelectedAsset(prev => {
                    if (!prev) return null;
                    let updatedImages = [...prev.images];

                    if (generatedImages.length === 1) {
                        // Place into first empty slot of current targeted row
                        if (selectedRowIndex !== null) {
                            // Target selected row
                            const startIdx = selectedRowIndex * 3;
                            for (let i = 0; i < 3; i++) {
                                if (!updatedImages[startIdx + i]) {
                                    updatedImages[startIdx + i] = generatedImages[0];
                                    break;
                                }
                            }
                        } else {
                            // Target "new" row
                            updatedImages.push(generatedImages[0]);
                        }
                    } else if (selectedRowIndex !== null) {
                        // Insert images starting from col 2 of the selected row
                        const startIdx = selectedRowIndex * 3 + 1;
                        if (generatedImages.length >= 1) updatedImages[startIdx] = generatedImages[0];
                        if (generatedImages.length >= 2) updatedImages[startIdx + 1] = generatedImages[1];
                    } else {
                        // No row selected: Append all images (usually 3)
                        updatedImages.push(...generatedImages);
                    }

                    // Filter out nulls if any were created by indexing, and cap at 12
                    return { ...prev, images: updatedImages.filter(Boolean).slice(0, 12) };
                });

                setIsGenerating(false);
            }).catch(err => {
                console.error("Failed to generate images:", err);
                setErrors(err.message);
                setIsGenerating(false);
            });
        } else {
            // Handle resource asset generation if needed
            setIsGenerating(false);
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

        if (selectedAsset.type === 'character') {
            formData.append('character_id', selectedAsset.id.toString());
        } else {
            formData.append('resource_id', selectedAsset.id.toString());
        }

        // TODO: Implement upload API endpoint
        // await instance.post('/api/v2/image/upload', formData, {
        //   headers: { 'Content-Type': 'multipart/form-data' }
        // }).then((res) => {
        //   setSelectedAsset(prev => prev ? { ...prev, images: [...prev.images, res.image] } : null);
        //   setUploadingImage(false);
        // }).catch(err => {
        //   console.error("Failed to upload image:", err);
        //   setErrors(err.message);
        //   setUploadingImage(false);
        // });

        setUploadingImage(false);
        alert('Image upload API not yet implemented');
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

        // TODO: Call API to save the resource when endpoint is ready
        // instance.post('/api/v2/resource/create', {
        //     project_id: projectId,
        //     stage_id: stageId,
        //     name: newResourceName
        // }).then((res: any) => {
        //     // Update with actual ID from server
        // }).catch(err => {
        //     console.error("Failed to create resource:", err);
        // });
    };

    const handleAudioPreview = async () => {
        if (!selectedAsset || !selectedAsset.voiceConfig?.voice) {
            alert('请先选择TTS引擎和语音模型');
            return;
        }

        setIsGeneratingAudio(true);
        setAudioPreviewUrl('');

        try {
            // TODO: Replace with actual API endpoint
            const response = await instance.post('/api/v2/voice/preview', {
                character_id: selectedAsset.id,
                project_id: projectId,
                stage_id: stageId,
                tts_engine: selectedAsset.voiceConfig.ttsEngine || 'qwen',
                voice: selectedAsset.voiceConfig.voice,
                gender: selectedAsset.voiceConfig.gender,
                voice_name: selectedAsset.voiceConfig.voice_name,
                desc: selectedAsset.voiceConfig.desc,
                emotion: selectedAsset.voiceConfig.emotion,
                extraDesc: selectedAsset.voiceConfig.extraDesc,
                // Sample text for preview
                text: '你好，这是语音试听效果。'
            });

            if (response.voice_path) {
                setAudioPreviewUrl(response.voice_path);
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

    return (
        <>
            <Header title="Value Assets" />
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">角色与资源设置</h1>

                    <div className="flex gap-6">
                        <AssetList
                            characters={characters}
                            resourceAssets={resourceAssets}
                            selectedAsset={selectedAsset}
                            onSelectAsset={selectAsset}
                            onAddResource={() => setIsResourceDialogOpen(true)}
                        />

                        <div className="flex-1">
                            <AssetDetail
                                selectedAsset={selectedAsset}
                                voiceModels={voiceModels}
                                isGenerating={isGenerating}
                                isGeneratingAudio={isGeneratingAudio}
                                audioPreviewUrl={audioPreviewUrl}
                                selectedRowIndex={selectedRowIndex}
                                errors={errors}
                                uploadingImage={uploadingImage}
                                onPromptChange={handlePromptChange}
                                onGenerateImages={handleGenerate}
                                onImageUpload={handleImageUpload}
                                onAudioPreview={handleAudioPreview}
                                onRowSelect={setSelectedRowIndex}
                                onNextClick={handleNextClick}
                                onSaveVoiceConfig={handleSaveVoiceConfig}
                                onVoiceConfigChange={handleVoiceConfigChange}
                            />
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
            </div >
        </>
    );
}
