'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type Theme } from '@/app/ai/projects/types'
import instance from '@/lib/axios'
import { setThemeMap } from '@/lib/localcache'

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [projectName, setProjectName] = useState("")
  const [projectPurpose, setProjectPurpose] = useState("")
  const [selectedTheme, setSelectedTheme] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState("cinematic")
  const [selectedAudiences, setSelectedAudiences] = useState("KIDS")
  const [isNarration, setIsNarration] = useState(true)
  const [selectedAspect, setSelectedAspect] = useState("16:9")
  const [errorMessage, setErrorMessage] = useState("");
  const [backgroundInfo, setBackgroundInfo] = useState("");
  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoadingThemes, setIsLoadingThemes] = useState(false)
  const [styles, setStyles] = useState<any[]>([])
  const [isLoadingStyles, setIsLoadingStyles] = useState(false)

  // Fetch themes and styles on mount and populate cache
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res: any = await instance.get('/api/v2/project/themes')
        const fetchedThemes = res || []

        // Update local state
        setThemes(fetchedThemes)

        // Populate themeMap cache
        const themeMapData: Record<string, Theme> = {}
        fetchedThemes.forEach((theme: Theme) => {
          themeMapData[theme.value] = theme
        })
        setThemeMap(themeMapData)

        // Set initial background info from first theme
        if (fetchedThemes.length > 0) {
          const defaultTheme = fetchedThemes[0]
          if (defaultTheme) {
            setBackgroundInfo(defaultTheme.description)
          }
        }
      } catch (err) {
        console.error('Failed to fetch themes:', err)
        // Fallback to default
        setBackgroundInfo("请补充额外的一些信息，比如产品简洁，最重要的功能和卖点，产品使用场景，解决的痛点等")
      }
    }

    const fetchStyles = async () => {
      try {
        const res: any = await instance.get('/api/v2/project/styles')
        const fetchedStyles = res || []
        setStyles(fetchedStyles)
      } catch (err) {
        console.error('Failed to fetch styles:', err)
      }
    }

    if (open) {
      fetchThemes()
      fetchStyles()
    }
  }, [open])

  const aspectRatios = [
    { id: '1:1', label: '1:1', style: 'w-12 h-12' },
    { id: '1:2', label: '1:2', style: 'w-10 h-[80px]' },
    { id: '3:2', label: '3:2', style: 'w-[72px] h-12' },
    { id: '3:4', label: '3:4', style: 'w-11 h-[60px]' },
    { id: '16:9', label: '16:9', style: 'w-16 h-9' },
    { id: '9:16', label: '9:16', style: 'w-9 h-16' },
  ]

  useEffect(() => {
    setIsLoadingThemes(true)
    instance.get('/api/v2/project/themes')
      .then((res: any) => {
        const fetchedThemes = res || []
        setThemes(fetchedThemes)
        // Set initial background info from first theme
        if (fetchedThemes.length > 0) {
          const defaultTheme = fetchedThemes[0]
          if (defaultTheme) {
            setBackgroundInfo(defaultTheme.description)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch themes:', err)
        // Fallback to default
        setBackgroundInfo("请补充额外的一些信息，比如产品简洁，最重要的功能和卖点，产品使用场景，解决的痛点等")
      })
      .finally(() => {
        setIsLoadingThemes(false)
      })
  }, [])

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res: any = await instance.get('/api/v2/project/styles')
        const fetchedStyles = res || []
        setStyles(fetchedStyles)
      } catch (err) {
        console.error('Failed to fetch styles:', err)
      }
    }

    if (open) {
      fetchStyles()
    }
  }, [open])


  const handleSubmit = () => {
    console.log(' request body: ', { name: projectName, purpose: projectPurpose, theme: selectedTheme, style: selectedStyle, audiences: selectedAudiences, narration: isNarration, aspect: selectedAspect })

    if (!projectName || !projectPurpose) {
      setErrorMessage("Name and purpose must not be empty.");
      return;
    }

    const requestBody = {
      name: projectName,
      purpose: projectPurpose,
      theme: selectedTheme,
      style: selectedStyle,
      audiences: selectedAudiences,
      narration: isNarration,
      aspect: selectedAspect
    }

    instance.post('/api/v2/project/create', requestBody).then((res: any) => {
      console.log('res: ', res)  // {project_id， stage_id}

      // Redirect based on theme
      router.push(`/ai/projects/script-configuration?project_id=${res?.project_id}&stage_id=${res.stage_id}`)
    }).catch(error => {
      setErrorMessage(error.message)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">Create Project</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">名字</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme</label>
              <Select
                value={selectedTheme}
                onValueChange={(value) => {
                  setSelectedTheme(value)
                  const selectedThemeObj = themes.find((t: Theme) => t.value === value)
                  if (selectedThemeObj) {
                    setBackgroundInfo(selectedThemeObj.description)
                  }
                }}
                disabled={isLoadingThemes}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingThemes ? "Loading..." : "广告"} />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme: Theme) => (
                    <SelectItem key={theme.value} value={theme.value}>{theme.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">风格</label>
              <Select
                value={selectedStyle}
                onValueChange={(value) => setSelectedStyle(value)}
                disabled={isLoadingStyles}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingStyles ? "Loading..." : "disney pixar"} />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">画面比例</label>
              <Select
                value={selectedAspect}
                onValueChange={(value) => setSelectedAspect(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="16:9" />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.id} value={ratio.id}>{ratio.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">针对人群</label>
              <Select
                value={selectedAudiences}
                onValueChange={(value) => setSelectedAudiences(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="儿童" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KIDS">儿童</SelectItem>
                  <SelectItem value="ADULT">成人</SelectItem>
                </SelectContent>
              </Select>
            </div>



            <div>
              <label className="text-sm font-medium mb-2 block">Narration</label>
              <Select
                value={isNarration ? 'true' : 'false'}
                onValueChange={(value) => setIsNarration(value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="True" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">背景信息: (最多50字)</label>
            <Textarea
              placeholder={backgroundInfo}
              className="h-24"
              value={projectPurpose}
              onChange={(e) => {
                const text = e.target.value;
                if (text.length <= 70) {
                  setProjectPurpose(text);
                }
              }}
              maxLength={100}
            />
          </div>
        </div>
        <div><label style={{ color: 'red' }}>{errorMessage}</label></div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit}>
            下一步
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  )


}

