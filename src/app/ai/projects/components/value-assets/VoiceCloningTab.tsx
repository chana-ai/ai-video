'use client'

import React, { useRef } from 'react'
import { Mic, Square, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface VoiceCloningTabProps {
    voiceConfig: any
    onVoiceConfigChange: (config: any) => void
    onSaveVoiceConfig: () => void
    projectDetail: any
    onAudioPreview: () => void
    isGeneratingAudio: boolean
    audioPreviewUrl: string
}

export const VoiceCloningTab: React.FC<VoiceCloningTabProps> = ({
    voiceConfig,
    onVoiceConfigChange,
    onSaveVoiceConfig,
    projectDetail,
    onAudioPreview,
    isGeneratingAudio,
    audioPreviewUrl
}) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const [isRecording, setIsRecording] = React.useState(false)
    const [recordedAudioUrl, setRecordedAudioUrl] = React.useState('')
    const [recordedText, setRecordedText] = React.useState('')
    const [recordingTime, setRecordingTime] = React.useState(0)
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
                const audioUrl = URL.createObjectURL(audioBlob)
                setRecordedAudioUrl(audioUrl)

                // Set recorded audio as the voice config
                onVoiceConfigChange({
                    ...voiceConfig,
                    voice: audioBlob,
                    voice_name: '克隆声音',
                    is_cloned: true
                })

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

    const saveRecordedVoice = () => {
        if (!recordedAudioUrl) {
            alert('请先录制声音')
            return
        }
        onSaveVoiceConfig()
    }

    return (
        <div className="space-y-4">
            {/* 录制区域 */}
            <div className="bg-gray-50 rounded-lg p-4 border">
                <Label className="text-sm font-medium mb-3 block">声音录制</Label>

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
                    <Label className="text-sm font-medium">录制时长</Label>
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
                    <Label className="text-sm font-medium mb-2 block">录制文本</Label>
                    <Textarea
                        value={recordedText}
                        onChange={(e) => setRecordedText(e.target.value)}
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
                    </div>
                )}
            </div>
        </div>
    )
}
