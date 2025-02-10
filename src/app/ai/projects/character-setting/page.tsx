'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Select } from "antd"
import { Settings2, Pen, Trash } from 'lucide-react'
import { PromptDialog } from '../components/prompt-dialog'
import { ImageGrid } from '../components/image-grid'
import Header from "../../header"
import { instance } from '@/lib/axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Character, ImageInfo } from './types' 

export default function CharacterSettings() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  const stageId = searchParams.get('stage_id')
  const router = useRouter()



  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<ImageInfo[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [promptChanged, setPromptChanged] = useState(false)
  const [errors, setErrors] = useState('')

  useEffect(() => {
    if (!projectId || !stageId) return;
    instance.get(`/api/v2/character/list?project_id=${projectId}&stage_id=${stageId}`).then((res) => {
      const chars = res.characters;
      setCharacters(chars);
      if (chars.length > 0) {
        setSelectedCharacter(chars[0]);
        setDescription(chars[0].description || '');
        setPrompt(chars[0].prompt || '');
        setPromptChanged(false);
        setImages(chars[0].images);
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
      setPrompt(selected.prompt || '');
      setPromptChanged(false);
      setImages(selected.images);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= 120) {
      setDescription(newValue);
      setPromptChanged(true)
    }
  };
  const handlePromptSave = (newValue: string) => {
    if (newValue.length <= 120) {
      setPrompt(newValue);
      setPromptChanged(true);
    }
  }

  const saveCharacter = async () => {

    await instance.post(`/api/v2/character/update`, {
      id: selectedCharacter?.id,
      project_id: projectId,
      stage_id: stageId,
      description: description,
      prompt: prompt,
    }).then(() => {
      //  setErrors('Successfully')
       setPromptChanged(false)
    }).catch(err => {
      console.error("Failed to save character:", err);
      setErrors(err.message)
      setPromptChanged(true)
    })
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    // const mockImageUrls = [
    //   'https://cdn.pixabay.com/photo/2022/10/07/07/30/china-7504392_1280.jpg',
    //   'https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072821_1280.jpg',
    //   'https://cdn.pixabay.com/photo/2022/10/07/07/30/china-7504392_1280.jpg',
    //   'https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072821_1280.jpg',
    // ];
    // setTimeout(() => {
    //   setImages(mockImageUrls.map((url: string, index:number) => ({ url, isSelected: index === 0 })));
    //   setIsGenerating(false);
    // }, 5000);
    await instance.post(`/api/v2/character/generate_images`, {
      character_id: selectedCharacter?.id,
      project_id: projectId,
      stage_id: stageId,
      description: description,
      prompt: prompt,
    }).then((res) => {
      const images = res.images;
      
      setImages(images);
      setIsGenerating(false);
       
    }).catch(err => {
      console.error("Failed to save character:", err);
      setErrors(err.message)
      setIsGenerating(false);
    })
   
  };

  const handleImageSelect = (index: number) => {
    setImages(images.map((img, i) => ({
      ...img,
      is_selected: img.id === index
    })));
    console.log("selected index", index)
    instance.post(`/api/v2/character/set_selected_image`, {
      character_id: selectedCharacter?.id,
      project_id: projectId,
      stage_id: stageId,
      image_id: index,
    }).then((res) => {
      console.log(res);
       
    }).catch(err => {
      console.error("Failed to save character:", err);
      setErrors(err.message)
    })
  };


  const handleNextClick = () =>{
    if (promptChanged) {
      alert('Please save your character and scene changes before proceeding.');
      return 
    }

    router.push(`/ai/projects/scenes?project_id=${projectId}&&stage_id=${stageId}`)
  }
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
              onChange={(value) => {
                if (promptChanged) {
                  if (confirm('You have unsaved changes. Please save first?')) {
                    return 
                  }
                } else {
                  handleCharacterChange(value);
                }
              }}
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
                onChange={handleDescriptionChange}
                placeholder="Enter character description (max 120 characters)"
                className="w-full min-h-[120px] p-4 border rounded-lg resize-none"
                maxLength={120}
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

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {description.length}/120 characters
                </span>
                {/* <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div> */}
                 {/* <Trash className="h-4 w-4" /> */}
                 {errors && (
                    <p className="text-red-500 mt-2 text-sm">{errors}</p>
                  )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-auto"
                >
                 
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
                  onClick={saveCharacter}
                  disabled={!promptChanged}
                >
                  保存
                </Button>
              </div>
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
              onClick={handleNextClick}
            >
              下一步
            </Button>
          </div>
        </div>

        <PromptDialog
          open={isPromptDialogOpen}
          onOpenChange={setIsPromptDialogOpen}
          initialValue={prompt}
          onSave={handlePromptSave}
        />
      </div>
    </>
  );
}

