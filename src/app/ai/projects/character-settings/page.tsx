'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2, Pen, Trash } from 'lucide-react'
import { PromptDialog } from '../components/prompt-dialog'
import { ImageGrid } from '../components/image-grid'
import type { CharacterPrompt } from './types'
import Header from "../../header";

const characters = ['张三', '李四', '王五']

interface GeneratedImage {
  url: string;
  isSelected: boolean;
}

export default function CharacterSettings() {
  const [prompt, setPrompt] = useState<CharacterPrompt>({
    character: characters[0],
    description: ''
  })
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setImages([])
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setImages([
      { url: '/placeholder.svg?height=400&width=400', isSelected: false },
      { url: '/placeholder.svg?height=400&width=400', isSelected: false },
      { url: '/placeholder.svg?height=400&width=400', isSelected: false },
      { url: '/placeholder.svg?height=400&width=400', isSelected: false }
    ])
    setIsGenerating(false)
  }

  const handleImageSelect = (index: number) => {
    setImages(images.map((img, i) => ({
      ...img,
      isSelected: i === index
    })))
  }

  return (
    <>
   <Header
        title={
            "Projects"  }
      ></Header>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">角色</label>
          <Select
            value={prompt.character}
            onValueChange={(value) => setPrompt({ ...prompt, character: value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {characters.map(char => (
                <SelectItem key={char} value={char}>{char}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="relative">
            <textarea
              value={prompt.description}
              readOnly
              placeholder="Enter character description"
              className="w-full min-h-[120px] p-4 border rounded-lg resize-none"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPromptDialogOpen(true)}
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              size="icon"
              className="mr-auto"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              生成
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
            >
              保存
            </Button>
          </div>

          <div className="mt-4">
            <ImageGrid
              images={images}
              isLoading={isGenerating}
              onSelect={handleImageSelect}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            className="bg-green-600 hover:bg-green-700"
          >
            下一步
          </Button>
        </div>
      </div>

      <PromptDialog
        open={isPromptDialogOpen}
        onOpenChange={setIsPromptDialogOpen}
        initialValue={prompt.description}
        onSave={(value) => setPrompt({ ...prompt, description: value })}
      />
    </div>
    </>
  )
}

