'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X } from 'lucide-react'
import type { ProjectFormData } from '@/app/ai/projects/types'
import instance from '@/lib/axios'

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    aspect: '1:1',
    theme: 'ad',
    style: 'cinimation',
    audiences: 'KIDS',
    narration: true,
    purpose: ''
  })
  
  const [errorMessage, setErrorMessage] = useState("");

  const aspectRatios = [
    { id: '1:1', label: '1:1', style: 'w-12 h-12' },
    { id: '1:2', label: '1:2', style: 'w-10 h-[80px]' },
    { id: '3:2', label: '3:2', style: 'w-[72px] h-12' },
    { id: '3:4', label: '3:4', style: 'w-11 h-[60px]' },
    { id: '16:9', label: '16:9', style: 'w-16 h-9' },
    { id: '9:16', label: '9:16', style: 'w-9 h-16' },
  ]

  const handleSubmit = () => {
    console.log(' formData: '+JSON.stringify(formData))
    if (!formData.name || !formData.purpose) {
      setErrorMessage("Name and purpose must not be empty.");
      return;
    }
    instance.post('/api/v2/project/create', formData).then(res => {
      console.log('res: '+JSON.stringify(res))  // {project_id， stage_id}

      router.push(`/ai/projects/script-configuration?projectId=${res.project_id}&stageId=${res.stage_id}`)
    }).catch(error => {
      setErrorMessage(error.message)
    })
    //router.push(`/ai/projects/script-configuration?projectId=1`)
  }

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

          <div>
            <label className="text-sm font-medium mb-2 block">屏幕比例</label>
            <RadioGroup 
              defaultValue="1:1" 
              className="flex justify-center gap-4 mt-2"
              value={formData.aspect}
              onValueChange={(value) => setFormData(prev => ({ ...prev, aspect: value }))}
            >
              {aspectRatios.map((ratio) => (
                <div key={ratio.id} className="text-center">
                  <label
                    className={`
                      block cursor-pointer transition-all duration-200
                      ${formData.aspect === ratio.id ? 'text-primary' : 'text-gray-600'}
                    `}
                  >
                    <div 
                      className={`
                        mb-2 mx-auto border-2 rounded-sm transition-all duration-200
                        ${formData.aspect === ratio.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-dashed border-gray-400'
                        }
                        ${ratio.style}
                      `}
                    />
                    <div className="text-sm">{ratio.label}</div>
                    <RadioGroupItem 
                      value={ratio.id} 
                      className="sr-only"
                      aria-label={`Aspect ratio ${ratio.label}`}
                    />
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme</label>
              <Select 
                value={formData.theme}
                onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="广告" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ad">广告</SelectItem>
                  <SelectItem value="promotion">推广</SelectItem>
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
                  <SelectItem value="cinimation">cinimation</SelectItem>
                  <SelectItem value="disney pixar">disney pixar</SelectItem>
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
            <label className="text-sm font-medium mb-2 block">其它信息:</label>
            <Textarea 
              placeholder="想要的效果" 
              className="h-24"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
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

