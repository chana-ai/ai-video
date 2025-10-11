'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw } from 'lucide-react'
import { Input } from "@/components/ui/input"
import type { ScriptGenerationData, ProjectMetaInfo } from '../types'
import Header from "../../header";
import instance from "@/lib/axios";
import { set } from 'date-fns'
import { themeMap, styleMap } from '../types'

export default function ScriptConfiguration() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') 
  const stageId = searchParams.get('stage_id')
  
  const [generationType, setGenerationType] = useState<'subject' | 'script'>('subject')
  const [subject, setSubject] = useState('')
  const [script, setScript] = useState('')
  const [characters, setCharacters] = useState('')
  const [scenes, setScenes] = useState('')
  const [character_changed, setCharacterChanged] = useState(false)
  const [scene_changed, setSceneChanged] = useState(false)
  const [errors, setErrors] = useState({ characters: '', scenes: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [subjectWordCount, setSubjectWordCount] = useState(0)
  const [scriptWordCount, setScriptWordCount] = useState(0)
  const [disableChange, setDisableChange] = useState(false)
  const [projectMetaInfo, setProjectMetaInfo] = useState<ProjectMetaInfo>({})
  const [allowSave, setAllowSave] = useState(false)
  const [docId, setDocId] = useState("")

  // const [savingScene, setSavingScene] = useState(false)
  // const [savingCharacter, setSavingCharacter] = useState(false)
  // const [savingScript, setSavingScript] = useState(false)

  console.log('projectId: '+projectId + ' stageId: '+stageId)
  
  useEffect(() => {
    if (!projectId || !stageId) {
      console.error('Project ID or Stage ID is missing');
      return;
    }

    // Fetch project details
    instance.get(`/api/v2/project/get_raw_project?project_id=${projectId}`).then((res) => {
      console.log('Project details: ' + JSON.stringify(res))
      if (res) {
        setProjectMetaInfo({
          name: res.name|| '',
          audience: res.audiences || '',
          theme: res.theme || '',
          style: res.style || '',
          purpose:  res.purpose || '',
          aspect:  res.aspect || '',
          narration:  res.narration || true
        })
      }
    }).catch(err => {
      console.error('Failed to fetch project details:', err)
    })
    

    instance.get("/api/v2/script/getScriptInitResult", {
      params: {
        project_id: projectId,
        stage_id: stageId
      }
    }).then((res) => {
      console.log('res: '+JSON.stringify(res))
      if(!res || Object.keys(res).length === 0){
        setSubject('')
        setScript('')
        setCharacters('')
        setScenes('')
        setDisableChange(false)
        setAllowSave(true)
        return 
      }
      
      setSubject(res.title)
      setCharacters(JSON.stringify(res.characters || [], null, 2))
      setScenes(JSON.stringify(res.scenes || [], null, 2))
      setDisableChange(!res.init)
      setAllowSave(res.init)
      setDocId(res.doc_id)
    }).catch((err)=>{
      console.error('Error fetching script init result:', err.message)
      setDisableChange(false)
      setAllowSave(false)
    })
  },
    [projectId, stageId]
  )


  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  const validateJSON = (json: string): boolean => {
    if (json === '' || json === null || json === undefined) return false
    try {
      JSON.parse(json)
      return true
    } catch {
      return false
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrors({
      characters: '',
      scenes: ''
    })  
    instance.post('/api/v2/script/generateScript', {
      generation_type: generationType,
      content: generationType ==='subject'? subject : script,
      project_id: projectId,
      stage_id: stageId
    }).then((res)=>{
      console.log('res: '+JSON.stringify(res))
      setSubjectWordCount(countWords(subject))
      setScriptWordCount(countWords(script))
      setCharacters(JSON.stringify(res.characters || [], null, 2));
      setScenes(JSON.stringify(res.scenes || [], null, 2));
      setCharacterChanged(true)
      setSceneChanged(true)
      setIsGenerating(false)
      }).catch((err)=>{
        console.error('Error generating script:', err.message)
        setIsGenerating(false)
      })
  };

  const saveCharacterAndScenes = async ()=> {
    const charactersValid = validateJSON(characters)
    const scenesValid = validateJSON(scenes)

    setErrors({
      characters: charactersValid ? '' : 'Invalid JSON format',
      scenes: scenesValid ? '' : 'Invalid JSON format'
    })
   
    if (!charactersValid || !scenesValid) return

    instance.post('/api/v2/script/saveScript', {
      project_id: projectId,
      stage_id: stageId,
      doc_id: docId,
      characters: JSON.parse(characters),
      scenes: JSON.parse(scenes),
      script_changed: character_changed || scene_changed
      
    }).then((res)=>{
      console.log('Version update response: '+JSON.stringify(res))
      setAllowSave(false)
      setCharacterChanged(false)
      setSceneChanged(false)
    }).catch((error)=>{
      console.error('Error updating version:', error);
      setErrors({
        characters: error.characters,
        scenes: error.scenes
      })
    });
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
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Script Generation</h1>

      <div className="flex gap-8">
        {/* Project Meta Information Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Project Information</h2>
            <div className="space-y-4">
              {projectMetaInfo.name && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Project Name</label>
                  <div className="text-gray-800 bg-white px-3 py-2 rounded border">{projectMetaInfo.name}</div>
                </div>
              )}
              {projectMetaInfo.audience && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Target Audience</label>
                  <div className="text-gray-800 bg-white px-3 py-2 rounded border">{projectMetaInfo.audience}</div>
                </div>
              )}
              {projectMetaInfo.theme && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">主题 </label>
                  <div className="text-gray-800 bg-white px-3 py-2 rounded border">{themeMap[projectMetaInfo.theme as keyof typeof themeMap]?.name || projectMetaInfo.theme}</div>
                </div>
              )}
              {projectMetaInfo.style && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">风格</label>
                  <div className="text-gray-800 bg-white px-3 py-2 rounded border">{styleMap[projectMetaInfo.style as keyof typeof styleMap] || projectMetaInfo.style}</div>
                </div>
              )}
              {projectMetaInfo.aspect && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Aspect Ratio</label>
                  <div className="text-gray-800 bg-white px-3 py-2 rounded border">{projectMetaInfo.aspect}</div>
                </div>
              )}
              {projectMetaInfo.purpose && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Purpose</label>
                  <div className="text-gray-800 bg-white px-3 py-2 rounded border text-sm">{projectMetaInfo.purpose}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Narration</label>
                <div className="text-gray-800 bg-white px-3 py-2 rounded border">
                  {projectMetaInfo.narration ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
        <Select
          value={generationType}
          onValueChange={(value: 'subject' | 'script') => setGenerationType(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="subject">Generate from Subject</SelectItem>
            {/* <SelectItem value="script">Generate from Script</SelectItem> */}
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
                  disabled={disableChange}
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
                  disabled={disableChange}
                />
                <p className="text-sm text-gray-500">{scriptWordCount}/500 words</p>
              </>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || disableChange || !allowSave}
              className={`bg-green-600 hover:bg-green-700 w-full sm:w-auto ${isGenerating ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"/>
                  Generating
                </div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xl font-semibold mb-2 block">Characters</label>
            <Textarea
              value={characters}
              disabled={disableChange}
              onChange={(e) => setCharacters(e.target.value)}
              placeholder="Character JSON will appear here"
              className="font-mono h-80"
              
            />
            {errors.characters && (
              <p className="text-red-500 mt-2 text-sm">{errors.characters}</p>
            )}
          </div>

          <div>
            <label className="text-xl font-semibold mb-2 block">Scene/Stage</label>
            <Textarea
              value={scenes}
              disabled={disableChange}
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
            disabled={!allowSave}
          >
            保存
          </Button>
          <Button
            onClick={handleNext}
            disabled={!characters || !scenes || allowSave}
            className="bg-green-600 hover:bg-green-700"
          >
            下一步
          </Button>
        </div>
        </div>
      </div>
    </div>
    </>
  )
}

