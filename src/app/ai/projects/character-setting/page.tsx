'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Select } from "antd"
import { Settings2, Pen, Trash } from 'lucide-react'
import { PromptDialog } from '../components/prompt-dialog'
import { ImageGrid } from '../components/image-grid'
import Header from "../../header"
import { instance } from '@/lib/axios'
import { useSearchParams } from 'next/navigation'
import { Character } from './types' 

interface GeneratedImage {
  url: string;
  isSelected: boolean;
}


export default function CharacterSettings() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  const stageId = searchParams.get('stage_id')

  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!projectId || !stageId) return;
    instance.post(`/api/v2/character/list`, {
      project_id: projectId,
      stage_id: stageId,
    }).then((res) => {
      const chars = res.data.characters;
      setCharacters(chars);
      if (chars.length > 0) {
        setSelectedCharacter(chars[0]);
        setDescription(chars[0].description || '');
      }
    }).catch(err => {
      console.error("Failed to fetch characters:", err);
    })
  }, [projectId, stageId]);

  const handleCharacterChange = (value: number) => {
    const selected = characters.find(char => char.id === value);
    if (selected) {
      setSelectedCharacter(selected);
      setDescription(selected.description || '');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setImages([]);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setImages([
      { url: '/placeholder.svg?height=400&width=400', isSelected: false },
      { url: '/placeholder.svg?height=400&width=400', isSelected: false },
      { url: '/placeholder.svg?height=400&width=400', isSelected: false },
      { url: '/placeholder.svg?height=400&width=400', isSelected: false }
    ]);
    setIsGenerating(false);
  };

  const handleImageSelect = (index: number) => {
    setImages(images.map((img, i) => ({
      ...img,
      isSelected: i === index
    })));
  };

  return (
    <>
      <Header title="Character Settings" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">角色</label>
            <Select
              style={{ width: 200 }}
              placeholder="Select a character"
              value={selectedCharacter?.id}
              onChange={handleCharacterChange}
              options={characters.map(char => ({
                value: char.id,
                label: char.name
              }))}
            />
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="relative">
              <textarea
                value={description}
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
          initialValue={description}
          onSave={setDescription}
        />
      </div>
    </>
  );
}

