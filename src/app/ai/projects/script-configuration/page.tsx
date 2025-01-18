'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw } from 'lucide-react'
import { Input } from "@/components/ui/input"
import type { ScriptGenerationData } from '../types'
import Header from "../../header";
import instance from "@/lib/axios";
import { set } from 'date-fns'

export default function ScriptConfiguration() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const stageId = searchParams.get('stageId')

  const [generationType, setGenerationType] = useState<'subject' | 'script'>('subject')
  const [subject, setSubject] = useState('')
  const [script, setScript] = useState('')
  const [characters, setCharacters] = useState('')
  const [scenes, setScenes] = useState('')
  const [character_changed, setCharacterChanged] = useState(true)
  const [scene_changed, setSceneChanged] = useState(true)
  const [errors, setErrors] = useState({ characters: '', scenes: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [subjectWordCount, setSubjectWordCount] = useState(0)
  const [scriptWordCount, setScriptWordCount] = useState(0)

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  const validateJSON = (json: string): boolean => {
    try {
      JSON.parse(json)
      return true
    } catch {
      return false
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      instance.post('/api/v2/script/generateScript', {
        generation_type: generationType,
        content: generationType ==='subject'? subject : script,
        project_id: projectId,
        stage_id: stageId
      }).then((res)=>{
        console.log('res: '+JSON.stringify(res))
        setSubjectWordCount(countWords(subject))
        setScriptWordCount(countWords(script))
        setCharacters(JSON.stringify(res.characters, null, 2));
        setScenes(JSON.stringify(res.scenes, null, 2));
        setCharacterChanged(true)
        setSceneChanged(true)
  
      })

    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCharacterAndScenes = async ()=> {
    const charactersValid = validateJSON(characters)
    const scenesValid = validateJSON(scenes)

    setErrors({
      characters: charactersValid ? '' : 'Invalid JSON format',
      scenes: scenesValid ? '' : 'Invalid JSON format'
    })

    if (!charactersValid || !scenesValid) return

    if (character_changed) {
      instance.post('/api/v2/character/create_batch', {
        characters: JSON.parse(characters),
        project_id: projectId,
        stage_id: stageId
      }).then((res)=>{
        console.log('res: '+JSON.stringify(res))
        setCharacterChanged(false)
      }).catch(err =>{
        console.error('Error creating characters:', err.message)
        setErrors(prevErrors => ({...prevErrors, characters: err.message}))
      }
      )
    }
    
    if(scene_changed){
        instance.post('/api/v2/scene/create_batch', {
            scenes: JSON.parse(scenes),
            project_id: projectId,
            stage_id: stageId
        }).then((res)=>{
          console.log('Scenes creation response: '+JSON.stringify(res))
          setSceneChanged(false)
        }).catch((error)=>{
          console.error('Error creating scenes:', error);
          setErrors(prevErrors => ({...prevErrors, scenes: error.message}));
        });
    }
    
  }


  const handleNext = () => {
    if (character_changed || scene_changed) {
      alert('Please save your character and scene changes before proceeding.');
      return 
    }

    router.push(`/ai/projects/character-setting?project_id=${projectId}&&stage_id=${stageId}`)
  }

  return (
    <>
   <Header
        title={
            "Projects"  }
      ></Header>
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Script Generation</h1>

      <div className="space-y-6">
        <Select
          value={generationType}
          onValueChange={(value: 'subject' | 'script') => setGenerationType(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="subject">Generate from Subject</SelectItem>
            <SelectItem value="script">Generate from Script</SelectItem>
          </SelectContent>
        </Select>

        <div>
          <label className="text-xl font-semibold mb-2 block">
            {generationType === 'subject' ? 'Subject' : 'Script'}
          </label>
          <div className="flex flex-col gap-2">
            {generationType === 'subject' ? (
              <>
                <Input
                  value={subject}
                  onChange={(e) => {
                    const newSubject = e.target.value.slice(0, 100);
                    setSubject(newSubject);
                    setSubjectWordCount(countWords(newSubject));
                  }}
                  placeholder="Enter your subject (max 100 words)"
                  className="w-full"
                />
                <p className="text-sm text-gray-500">{subjectWordCount}/100 words</p>
              </>
            ) : (
              <>
                <Textarea
                  value={script}
                  onChange={(e) => {
                    const newScript = e.target.value.slice(0, 500);
                    setScript(newScript);
                    setScriptWordCount(countWords(newScript));
                  }}
                  placeholder="Enter your script (max 500 words)"
                  className="h-32"
                />
                <p className="text-sm text-gray-500">{scriptWordCount}/500 words</p>
              </>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (generationType === 'subject' ? !subject : !script)}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xl font-semibold mb-2 block">Characters</label>
            <Textarea
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              placeholder="Character JSON will appear here"
              className="font-mono h-80"
              readOnly
            />
            {errors.characters && (
              <p className="text-red-500 mt-2 text-sm">{errors.characters}</p>
            )}
          </div>

          <div>
            <label className="text-xl font-semibold mb-2 block">Scene/Stage</label>
            <Textarea
              value={scenes}
              onChange={(e) => {
                  setScenes(e.target.value)
                  setSceneChanged(false)
                }
              }
              placeholder="Scene JSON will appear here"
              className="font-mono h-80"
            />
            {errors.scenes && (
              <p className="text-red-500 mt-2 text-sm">{errors.scenes}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={saveCharacterAndScenes}
            className="bg-green-600 hover:bg-green-700"
          >
            保存
          </Button>
          <Button
            onClick={handleNext}
            disabled={!characters || !scenes}
            className="bg-green-600 hover:bg-green-700"
          >
            下一步
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}

