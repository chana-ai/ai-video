'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Package, Loader2, Plus, Volume2, Image as ImageIcon } from 'lucide-react'
import { ValueAssetsImageGrid } from '../components/value-assets-image-grid'
import Header from "../../header"
import { instance } from '@/lib/axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Character, ImageInfo, ResourceAsset, VoiceConfig } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type AssetType = 'character' | 'resource'

interface SelectedAsset {
    type: AssetType
    id: number
    name: string
    description: string
    images: ImageInfo[]
}

export default function ValueAssets() {
    const searchParams = useSearchParams()
    const projectId = searchParams.get('project_id')
    const stageId = searchParams.get('stage_id')
    const router = useRouter()

    const [characters, setCharacters] = useState<Character[]>([])
    const [resourceAssets, setResourceAssets] = useState<ResourceAsset[]>([])
    const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null)
    const [description, setDescription] = useState('')
    const [prompt, setPrompt] = useState('')
    const [images, setImages] = useState<ImageInfo[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [promptChanged, setPromptChanged] = useState(false)
    const [errors, setErrors] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)
    const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
    const [newResourceName, setNewResourceName] = useState('')
    const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
        gender: '女',
        voiceCharacteristic: '清脆',
        voiceDescription: '',
        ttsEngine: '',
        voiceModel: ''
    })
    const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

    // Fetch characters on mount
    useEffect(() => {
        if (!projectId || !stageId) return;

        instance.get(`/api/v2/character/list?project_id=${projectId}&stage_id=${stageId}`)
            .then((res) => {
                const chars = res.characters;
                setCharacters(chars);
                if (chars.length > 0) {
                    selectAsset('character', chars[0]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch characters:", err);
            });

        // TODO: Fetch resource assets when API is ready
        // instance.get(`/api/v2/resource/list?project_id=${projectId}&stage_id=${stageId}`)
        //   .then((res) => {
        //     setResourceAssets(res.resources);
        //   })
        //   .catch(err => {
        //     console.error("Failed to fetch resource assets:", err);
        //   });
    }, [projectId, stageId]);

    const selectAsset = (type: AssetType, asset: Character | ResourceAsset) => {
        if (type === 'character') {
            const char = asset as Character;
            setSelectedAsset({
                type: 'character',
                id: char.id,
                name: char.name,
                description: char.description || '',
                images: char.images || []
            });
            setDescription(char.description || '');
            setPrompt((char as Character).prompt || '');
            setImages(char.images || []);
            // Load voice config if available, otherwise use defaults
            if (char.voiceConfig) {
                setVoiceConfig(char.voiceConfig);
            } else {
                setVoiceConfig({
                    gender: '女',
                    voiceCharacteristic: '清脆',
                    voiceDescription: '',
                    ttsEngine: '',
                    voiceModel: ''
                });
            }
        } else {
            const resource = asset as ResourceAsset;
            setSelectedAsset({
                type: 'resource',
                id: resource.id,
                name: resource.name,
                description: resource.description || '',
                images: resource.images || []
            });
            setDescription(resource.description || '');
            setPrompt('');
            setImages(resource.images || []);
        }
        setPromptChanged(false);
    };



    const handleGenerate = async () => {
        if (!selectedAsset) return;

        setIsGenerating(true);

        if (selectedAsset.type === 'character') {
            await instance.post(`/api/v2/character/generate_images`, {
                character_id: selectedAsset.id,
                project_id: projectId,
                stage_id: stageId,
                description: description,
                prompt: prompt,
            }).then((res) => {
                const newImages = res.images;
                setImages(newImages);
                setIsGenerating(false);
            }).catch(err => {
                console.error("Failed to generate images:", err);
                setErrors(err.message);
                setIsGenerating(false);
            });
        } else {
            // TODO: Handle resource asset image generation when API is ready
            setIsGenerating(false);
        }
    };

    const handleImageSelect = (index: number) => {
        if (!selectedAsset) return;

        setImages(images.map((img) => ({
            ...img,
            is_selected: img.id === index
        })));

        if (selectedAsset.type === 'character') {
            instance.post(`/api/v2/character/set_selected_image`, {
                character_id: selectedAsset.id,
                project_id: projectId,
                stage_id: stageId,
                image_id: index,
            }).then((res) => {
                console.log(res);
            }).catch(err => {
                console.error("Failed to set selected image:", err);
                setErrors(err.message);
            });
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
        //   setImages([...images, res.image]);
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
        // }).then((res) => {
        //     // Update with actual ID from server
        // }).catch(err => {
        //     console.error("Failed to create resource:", err);
        // });
    };

    const handleAudioPreview = async () => {
        if (!selectedAsset || !voiceConfig.ttsEngine || !voiceConfig.voiceModel) {
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
                tts_engine: voiceConfig.ttsEngine,
                voice_model: voiceConfig.voiceModel,
                gender: voiceConfig.gender,
                voice_characteristic: voiceConfig.voiceCharacteristic,
                voice_description: voiceConfig.voiceDescription,
                // Sample text for preview
                text: '你好，这是语音试听效果。'
            });

            if (response.audio_url) {
                setAudioPreviewUrl(response.audio_url);
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
                        {/* Left Panel */}
                        <div className="w-80 flex-shrink-0 space-y-4">
                            {/* Character List */}
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-4 border-b bg-gray-50">
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-500" />
                                        角色列表
                                    </h2>
                                </div>
                                <div className="p-2 max-h-64 overflow-y-auto">
                                    {characters.map((char) => (
                                        <div
                                            key={char.id}
                                            onClick={() => selectAsset('character', char)}
                                            className={`p-3 rounded-md cursor-pointer transition-all mb-1 ${selectedAsset?.type === 'character' && selectedAsset.id === char.id
                                                ? 'bg-blue-100 border-2 border-blue-500'
                                                : 'hover:bg-gray-100 border-2 border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium text-sm">{char.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {characters.length === 0 && (
                                        <div className="p-4 text-center text-gray-400 text-sm">
                                            暂无角色
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resource Assets */}
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-4 border-b bg-gray-50">
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        <Package className="w-5 h-5 text-green-500" />
                                        资源素材
                                    </h2>
                                </div>
                                <div className="p-2 max-h-64 overflow-y-auto">
                                    {resourceAssets.map((resource) => (
                                        <div
                                            key={resource.id}
                                            onClick={() => selectAsset('resource', resource)}
                                            className={`p-3 rounded-md cursor-pointer transition-all mb-1 ${selectedAsset?.type === 'resource' && selectedAsset.id === resource.id
                                                ? 'bg-green-100 border-2 border-green-500'
                                                : 'hover:bg-gray-100 border-2 border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium text-sm">{resource.name}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Resource Button */}
                                    <div
                                        onClick={() => setIsResourceDialogOpen(true)}
                                        className="p-3 rounded-md cursor-pointer transition-all mb-1 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50"
                                    >
                                        <div className="flex items-center gap-2 justify-center text-gray-500 hover:text-green-600">
                                            <Plus className="w-4 h-4" />
                                            <span className="font-medium text-sm">添加资源</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="flex-1">
                            {selectedAsset ? (
                                <div className="bg-white rounded-lg border shadow-sm">
                                    {/* Header */}
                                    <div className="p-6 border-b">
                                        <h3 className="text-lg font-semibold mb-2">
                                            {selectedAsset.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {selectedAsset.description || '暂无描述'}
                                        </p>
                                    </div>

                                    {/* Tabs for Characters, Single view for Resources */}
                                    {selectedAsset.type === 'character' ? (
                                        <Tabs defaultValue="image" className="w-full">
                                            <div className="px-6 pt-4">
                                                <TabsList className="grid w-full grid-cols-2">
                                                    <TabsTrigger value="image" className="flex items-center gap-2">
                                                        <ImageIcon className="w-4 h-4" />
                                                        图片设置
                                                    </TabsTrigger>
                                                    <TabsTrigger value="audio" className="flex items-center gap-2">
                                                        <Volume2 className="w-4 h-4" />
                                                        音频配置
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>

                                            {/* Image Settings Tab */}
                                            <TabsContent value="image" className="p-6 space-y-6">
                                                {/* Prompt Input */}
                                                <div>
                                                    <Label className="text-sm font-medium mb-2 block">提示词</Label>
                                                    <textarea
                                                        value={prompt}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value;
                                                            if (newValue.length <= 120) {
                                                                setPrompt(newValue);
                                                                setPromptChanged(true);
                                                            }
                                                        }}
                                                        placeholder="输入提示词 (最多120字符)"
                                                        className="w-full min-h-[120px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        maxLength={120}
                                                    />
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-sm text-gray-500">
                                                            {prompt.length}/120 字符
                                                        </span>
                                                        <Button
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={handleGenerate}
                                                            disabled={isGenerating}
                                                        >
                                                            {isGenerating ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    生成中...
                                                                </>
                                                            ) : (
                                                                '生成图像'
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {errors && (
                                                        <p className="text-red-500 mt-2 text-sm">{errors}</p>
                                                    )}
                                                </div>

                                                {/* Image Grid */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-semibold">图像列表</h4>
                                                        <input
                                                            type="file"
                                                            id="image-upload"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                            disabled={uploadingImage}
                                                        />
                                                    </div>
                                                    <ValueAssetsImageGrid
                                                        images={images}
                                                        isLoading={isGenerating}
                                                        onSelect={handleImageSelect}
                                                        onUploadClick={() => document.getElementById('image-upload')?.click()}
                                                    />
                                                </div>

                                                <div className="flex justify-end">
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={handleNextClick}
                                                    >
                                                        下一步
                                                    </Button>
                                                </div>
                                            </TabsContent>

                                            {/* Audio Configuration Tab */}
                                            <TabsContent value="audio" className="p-6">
                                                <div className="space-y-4">
                                                    {/* Gender Selection */}
                                                    <div>
                                                        <Label className="text-sm font-medium mb-2 block">性别</Label>
                                                        <RadioGroup
                                                            value={voiceConfig.gender}
                                                            onValueChange={(value: '男' | '女' | '中性') =>
                                                                setVoiceConfig({ ...voiceConfig, gender: value })
                                                            }
                                                            className="flex gap-4"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="男" id="gender-male" />
                                                                <Label htmlFor="gender-male" className="cursor-pointer">男</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="女" id="gender-female" />
                                                                <Label htmlFor="gender-female" className="cursor-pointer">女</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="中性" id="gender-neutral" />
                                                                <Label htmlFor="gender-neutral" className="cursor-pointer">中性</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>

                                                    {/* Voice Characteristic */}
                                                    <div>
                                                        <Label className="text-sm font-medium mb-2 block">音色特征</Label>
                                                        <Select
                                                            value={voiceConfig.voiceCharacteristic}
                                                            onValueChange={(value: '温柔' | '沙哑' | '清脆' | '浑厚' | '甜美' | '稚嫩') =>
                                                                setVoiceConfig({ ...voiceConfig, voiceCharacteristic: value })
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="选择音色特征" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="温柔">温柔</SelectItem>
                                                                <SelectItem value="沙哑">沙哑</SelectItem>
                                                                <SelectItem value="清脆">清脆</SelectItem>
                                                                <SelectItem value="浑厚">浑厚</SelectItem>
                                                                <SelectItem value="甜美">甜美</SelectItem>
                                                                <SelectItem value="稚嫩">稚嫩</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Voice Description */}
                                                    <div>
                                                        <Label className="text-sm font-medium mb-2 block">音色描述</Label>
                                                        <Textarea
                                                            value={voiceConfig.voiceDescription}
                                                            onChange={(e) =>
                                                                setVoiceConfig({ ...voiceConfig, voiceDescription: e.target.value })
                                                            }
                                                            placeholder="描述语音的具体特点，例如音调、节奏、情感等..."
                                                            className="w-full min-h-[80px] resize-none"
                                                            maxLength={200}
                                                        />
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {voiceConfig.voiceDescription.length}/200 字符
                                                        </div>
                                                    </div>

                                                    {/* TTS Engine - Changed to Select */}
                                                    <div>
                                                        <Label className="text-sm font-medium mb-2 block">TTS引擎</Label>
                                                        <Select
                                                            value={voiceConfig.ttsEngine}
                                                            onValueChange={(value) =>
                                                                setVoiceConfig({ ...voiceConfig, ttsEngine: value })
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="选择TTS引擎" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Azure TTS">Azure TTS</SelectItem>
                                                                <SelectItem value="Google TTS">Google TTS</SelectItem>
                                                                <SelectItem value="阿里云TTS">阿里云TTS</SelectItem>
                                                                <SelectItem value="腾讯云TTS">腾讯云TTS</SelectItem>
                                                                <SelectItem value="百度TTS">百度TTS</SelectItem>
                                                                <SelectItem value="讯飞TTS">讯飞TTS</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Voice Model - Changed to Select */}
                                                    <div>
                                                        <Label className="text-sm font-medium mb-2 block">语音模型</Label>
                                                        <Select
                                                            value={voiceConfig.voiceModel}
                                                            onValueChange={(value) =>
                                                                setVoiceConfig({ ...voiceConfig, voiceModel: value })
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="选择语音模型" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="zh-CN-XiaoxiaoNeural">zh-CN-XiaoxiaoNeural (晓晓)</SelectItem>
                                                                <SelectItem value="zh-CN-YunxiNeural">zh-CN-YunxiNeural (云希)</SelectItem>
                                                                <SelectItem value="zh-CN-YunyangNeural">zh-CN-YunyangNeural (云扬)</SelectItem>
                                                                <SelectItem value="zh-CN-XiaoyiNeural">zh-CN-XiaoyiNeural (晓伊)</SelectItem>
                                                                <SelectItem value="zh-CN-YunjianNeural">zh-CN-YunjianNeural (云健)</SelectItem>
                                                                <SelectItem value="zh-CN-XiaochenNeural">zh-CN-XiaochenNeural (晓辰)</SelectItem>
                                                                <SelectItem value="zh-CN-XiaohanNeural">zh-CN-XiaohanNeural (晓涵)</SelectItem>
                                                                <SelectItem value="zh-CN-XiaomengNeural">zh-CN-XiaomengNeural (晓梦)</SelectItem>
                                                                <SelectItem value="zh-CN-XiaomoNeural">zh-CN-XiaomoNeural (晓墨)</SelectItem>
                                                                <SelectItem value="zh-CN-XiaoqiuNeural">zh-CN-XiaoqiuNeural (晓秋)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Preview Audio Section */}
                                                    <div className="border-t pt-4 mt-6">
                                                        <Label className="text-sm font-medium mb-3 block">试听效果</Label>
                                                        <div className="space-y-3">
                                                            <Button
                                                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                                                onClick={handleAudioPreview}
                                                                disabled={isGeneratingAudio || !voiceConfig.ttsEngine || !voiceConfig.voiceModel}
                                                            >
                                                                {isGeneratingAudio ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                        生成中...
                                                                    </>
                                                                ) : (
                                                                    '生成试听音频'
                                                                )}
                                                            </Button>

                                                            {audioPreviewUrl && (
                                                                <div className="bg-gray-50 rounded-lg p-4 border">
                                                                    <p className="text-sm text-gray-600 mb-2">试听音频：</p>
                                                                    <audio
                                                                        controls
                                                                        className="w-full"
                                                                        src={audioPreviewUrl}
                                                                        controlsList="nodownload"
                                                                    >
                                                                        您的浏览器不支持音频播放。
                                                                    </audio>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Save Button */}
                                                    <div className="flex justify-end pt-4 mt-4 border-t">
                                                        <Button
                                                            className="bg-purple-600 hover:bg-purple-700"
                                                            onClick={() => {
                                                                // TODO: Save voice config to backend
                                                                // instance.post('/api/v2/character/update_voice_config', {
                                                                //     character_id: selectedAsset.id,
                                                                //     voiceConfig: voiceConfig
                                                                // })
                                                                alert('语音配置保存成功！');
                                                            }}
                                                        >
                                                            保存语音配置
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    ) : (
                                        /* Resource Assets - Single View */
                                        <div className="p-6 space-y-6">
                                            {/* Prompt Input */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">提示词</Label>
                                                <textarea
                                                    value={prompt}
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        if (newValue.length <= 120) {
                                                            setPrompt(newValue);
                                                            setPromptChanged(true);
                                                        }
                                                    }}
                                                    placeholder="输入提示词 (最多120字符)"
                                                    className="w-full min-h-[120px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    maxLength={120}
                                                />
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm text-gray-500">
                                                        {prompt.length}/120 字符
                                                    </span>
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={handleGenerate}
                                                        disabled={isGenerating}
                                                    >
                                                        {isGenerating ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                生成中...
                                                            </>
                                                        ) : (
                                                            '生成图像'
                                                        )}
                                                    </Button>
                                                </div>
                                                {errors && (
                                                    <p className="text-red-500 mt-2 text-sm">{errors}</p>
                                                )}
                                            </div>

                                            {/* Image Grid */}
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-semibold">图像列表</h4>
                                                    <input
                                                        type="file"
                                                        id="image-upload"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        disabled={uploadingImage}
                                                    />
                                                </div>
                                                <ValueAssetsImageGrid
                                                    images={images}
                                                    isLoading={isGenerating}
                                                    onSelect={handleImageSelect}
                                                    onUploadClick={() => document.getElementById('image-upload')?.click()}
                                                />
                                            </div>

                                            <div className="flex justify-end">
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={handleNextClick}
                                                >
                                                    下一步
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg p-12 border shadow-sm">
                                    <div className="text-center text-gray-400">
                                        <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p>请从左侧选择一个角色或资源素材</p>
                                    </div>
                                </div>
                            )}
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
        </>
    );
}
