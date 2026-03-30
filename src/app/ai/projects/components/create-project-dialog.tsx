'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X } from 'lucide-react'
import { ProjectFormData, themeMap, styleMap } from '@/app/ai/projects/types'
import instance from '@/lib/axios'

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    aspect: '16:9',
    theme: 'advertise',
    style: 'cinimation',
    audiences: 'KIDS',
    narration: true,
    purpose: ''
  })

  const [errorMessage, setErrorMessage] = useState("");
  const [backgroundInfo, setBackgroundInfo] = useState("");
  const aspectRatios = [
    { id: '1:1', label: '1:1', style: 'w-12 h-12' },
    { id: '1:2', label: '1:2', style: 'w-10 h-[80px]' },
    { id: '3:2', label: '3:2', style: 'w-[72px] h-12' },
    { id: '3:4', label: '3:4', style: 'w-11 h-[60px]' },
    { id: '16:9', label: '16:9', style: 'w-16 h-9' },
    { id: '9:16', label: '9:16', style: 'w-9 h-16' },
  ]

  const handleSubmit = () => {
    console.log(' formData: ' + JSON.stringify(formData))
    if (!formData.name || !formData.purpose) {
      setErrorMessage("Name and purpose must not be empty.");
      return;
    }
    instance.post('/api/v2/project/create', formData).then(res => {
      console.log('res: ' + JSON.stringify(res))  // {project_id， stage_id}

      router.push(`/ai/projects/script-configuration?project_id=${res.project_id}&stage_id=${res.stage_id}`)
    }).catch(error => {
      setErrorMessage(error.message)
    })
    //router.push(`/ai/projects/script-configuration?projectId=1`)
  }

  useEffect(() => {
    setBackgroundInfo(themeMap['advertise'].description)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">Create Project</DialogTitle>
            {/* <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">名字</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme</label>
              <Select
                value={formData.theme}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, theme: value }))
                  setBackgroundInfo(themeMap[value as keyof typeof themeMap].description)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="广告" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(themeMap).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">风格</label>
              <Select
                value={formData.style}
                onValueChange={(value) => setFormData(prev => ({ ...prev, style: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="disney pixar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cinematic">cinematic</SelectItem>
                  <SelectItem value="animation_ghibli">吉卜力</SelectItem>
                  {/* <SelectItem value="disney pixar">迪士尼皮克斯</SelectItem>
                  <SelectItem value="dreamworks">梦工厂</SelectItem>
                  <SelectItem value="other">其他</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">针对人群</label>
              <Select
                value={formData.audiences}
                onValueChange={(value) => setFormData(prev => ({ ...prev, audiences: value }))}
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
                value={formData.narration ? 'true' : 'false'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, narration: value === 'true' }))}
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
              value={formData.purpose}
              onChange={(e) => {
                const text = e.target.value;
                if (text.length <= 70) {
                  setFormData(prev => ({ ...prev, purpose: text }));
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

