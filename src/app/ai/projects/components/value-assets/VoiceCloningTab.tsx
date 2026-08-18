'use client'

import React, { useRef } from 'react'
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { VoiceSetting } from '../../../value-assets/types'

interface VoiceCloningTabProps {
    voiceSetting: VoiceSetting
    audioPreviewUrl: string
    onVoiceSettingChange: (config: VoiceSetting) => void
    onSaveVoiceSetting: () => void
    onVoiceClone: (audioUrl: string, text: string) => Promise<void>
}

export const VoiceCloningTab: React.FC<VoiceCloningTabProps> = ({
    voiceSetting,
    audioPreviewUrl,
    onVoiceSettingChange,
    onSaveVoiceSetting,
    onVoiceClone
}) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const [isRecording, setIsRecording] = React.useState(false)
    const [recordedAudioUrl, setRecordedAudioUrl] = React.useState('')
    const [recordedText, setRecordedText] = React.useState('')
    const [recordingTime, setRecordingTime] = React.useState(0)
    const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false)
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Sync recordedText with voiceSetting.clone.desc when loaded
    React.useEffect(() => {
        if (voiceSetting.clone?.desc !== undefined && voiceSetting.clone?.desc !== recordedText) {
            setRecordedText(voiceSetting.clone.desc)
        }
    }, [voiceSetting.clone?.desc])

    // 将 AudioBuffer 转换为 WAV 格式的 Uint8Array（16-bit PCM）
    const bufferToWav = (buffer: any): Uint8Array => {
        const numChannels = buffer.numberOfChannels
        const sampleRate = buffer.sampleRate
        const format = 1 // PCM
        const bitDepth = 16

        const bytesPerSample = bitDepth / 8
        const blockAlign = numChannels * bytesPerSample

        const dataLength = buffer.length * blockAlign
        const headerLength = 44

        const bufferLength = headerLength + dataLength
        const arrayBuffer = new ArrayBuffer(bufferLength)
        const view = new DataView(arrayBuffer)

        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF')
        view.setUint32(4, 36 + dataLength, true) // 文件大小
        writeString(view, 8, 'WAVE')
        // fmt sub-chunk
        writeString(view, 12, 'fmt ')
        view.setUint32(16, 16, true) // chunk size
        view.setUint16(20, format, true) // PCM
        view.setUint16(22, numChannels, true) // 通道数
        view.setUint32(24, sampleRate, true) // 采样率
        view.setUint32(28, sampleRate * blockAlign, true) // bytes/second
        view.setUint16(32, blockAlign, true) // block align
        view.setUint16(34, bitDepth, true) // bits/sample
        // data sub-chunk
        writeString(view, 36, 'data')
        view.setUint32(40, dataLength, true) // data size

        // 写入音频数据
        const channels: any[] = []
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i))
        }

        let offset = 44
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, channels[channel][i]))
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
                view.setInt16(offset, intSample, true)
                offset += 2
            }
        }

        return new Uint8Array(arrayBuffer)
    }

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    // 将音频 blob 转换为 WAV 格式
    const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

            audioBlob.arrayBuffer()
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(buffer => {
                    const wavData = bufferToWav(buffer)
                    const wavBlob = new Blob([wavData], { type: 'audio/wav' })
                    resolve(wavBlob)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // 尝试使用支持的 MIME 类型
            const mimeTypeOptions = [
                'audio/webm',
                'audio/webm;codecs=opus',
                'audio/webm;codecs=pcm',
                'audio/ogg',
                'audio/ogg;codecs=opus',
                'audio/wav',
                'audio/mp4'
            ]

            let mimeType = mimeTypeOptions[0]
            let supportsWebM = false

            for (const type of mimeTypeOptions) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type
                    supportsWebM = type.includes('webm') || type.includes('ogg')
                    break
                }
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000 // 128kbps
            })
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                // 如果是 webm/ogg 格式，需要转换为 wav
                if (supportsWebM && audioChunksRef.current.length > 0) {
                    try {
                        const wavBlob = await convertToWav(new Blob(audioChunksRef.current, {
                            type: mimeType
                        }))
                        const audioUrl = URL.createObjectURL(wavBlob)
                        setRecordedAudioUrl(audioUrl)
                    } catch (err) {
                        console.error('Failed to convert to WAV:', err)
                        alert('音频转换失败，请重试')
                        return
                    }
                } else {
                    // 已经是 wav 格式
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
                    const audioUrl = URL.createObjectURL(audioBlob)
                    setRecordedAudioUrl(audioUrl)
                }

                // Clear timer
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current)
                    recordingTimerRef.current = null
                }
                setRecordingTime(0)
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            // Start 15-second timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 15) {
                        // Auto-stop at 15 seconds
                        stopRecording()
                        return 15
                    }
                    return prev + 1
                })
            }, 1000)
        } catch (err) {
            console.error('Failed to start recording:', err)
            alert('无法访问麦克风，请检查权限设置')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
            setIsRecording(false)

            // Clear timer
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
                recordingTimerRef.current = null
            }
            setRecordingTime(0)
        }
    }

    const saveRecordedVoice = async () => {
        if (!recordedAudioUrl) {
            alert('请先录制声音')
            return
        }

        setIsGeneratingAudio(true)

        try {
            // 调用父组件的 handleVoiceClone 方法，传递音频 URL 和文本
            await onVoiceClone(recordedAudioUrl, recordedText)
        } catch (err: any) {
            console.error('Failed to clone voice:', err)
            alert(`声音克隆失败: ${err.message || '未知错误'}`)
        } finally {
            setIsGeneratingAudio(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* 录制区域 */}
            <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="text-sm font-medium mb-3 block">声音录制</div>

                {/* 录制按钮 */}
                <div className="flex items-center gap-3 mb-4">
                    {!isRecording ? (
                        <Button
                            onClick={startRecording}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Mic className="w-4 h-4 mr-2" />
                            开始录制
                        </Button>
                    ) : (
                        <Button
                            onClick={stopRecording}
                            variant="destructive"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            停止录制
                        </Button>
                    )}
                </div>

                {/* 录制提示 */}
                {isRecording && (
                    <div className="flex items-center gap-2 text-sm mb-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span>正在录制...</span>
                    </div>
                )}

                {/* 计时器显示 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium">录制时长</div>
                    <div className={`flex items-center gap-2 ${recordingTime >= 15 ? 'text-red-600' : 'text-gray-600'}`}>
                        <AlertCircle className={`w-4 h-4 ${recordingTime >= 15 ? 'animate-pulse' : ''}`} />
                        <span className={`font-mono text-lg font-bold ${recordingTime >= 15 ? 'text-red-600' : ''}`}>
                            {recordingTime}/15
                        </span>
                        <span className="text-sm">秒</span>
                    </div>
                </div>

                {/* 录制文本输入 */}
                <div className="mb-4">
                    <div className="text-sm font-medium mb-2 block">录制文本</div>
                    <Textarea
                        value={recordedText}
                        onChange={(e) => {
                            setRecordedText(e.target.value)
                            onVoiceSettingChange({
                                ...voiceSetting,
                                clone: {
                                    voice: voiceSetting.clone?.voice || '',
                                    voice_name: voiceSetting.clone?.voice_name || '克隆声音',
                                    url: voiceSetting.clone?.url || '',
                                    desc: e.target.value
                                }
                            })
                        }}
                        placeholder="请输入用于录制声音的文本..."
                        className="w-full min-h-[80px] resize-none"
                        maxLength={500}
                    />
                </div>

                {/* 录制音频预览 */}
                {recordedAudioUrl && (
                    <div className="bg-white rounded-lg p-4 border">
                        <p className="text-sm font-medium mb-2">录制音频：</p>
                        <audio
                            controls
                            className="w-full"
                            src={recordedAudioUrl}
                        >
                            您的浏览器不支持音频播放。
                        </audio>

                        {/* 克隆声音按钮 */}
                        <div className="mt-4">
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                                onClick={saveRecordedVoice}
                                disabled={isGeneratingAudio}
                            >
                                {isGeneratingAudio ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        克隆中...
                                    </>
                                ) : (
                                    '克隆声音'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 克隆音频预览 */}
            {/* {audioPreviewUrl && (
                <div className="bg-gray-50 rounded-lg p-4 border mt-4">
                    <p className="text-sm font-medium mb-2 text-blue-600">克隆声音预览：</p>
                    <audio
                        controls
                        className="w-full"
                        src={audioPreviewUrl}
                        controlsList="nodownload"
                    >
                        您的浏览器不支持音频播放。
                    </audio>
                </div>
            )} */}
        </div>
    )
}
