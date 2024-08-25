import {
  Bird,
  CornerDownLeft,
  Rabbit,
 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { instance } from '@/lib/axios'
import { useRouter } from 'next/navigation';



export default function CreateAIMaterial() {

  const [name, setName] = useState('')
  const [tags, setTags] = useState('')
  const [size, setSize] = useState('')
  const [inferenceSteps, setInferenceSteps] = useState(12)
  const [imageCount, setImageCount] = useState(1)
  const [promote, setPromote] = useState('')
 
  const [errorMessage, setErrorMessage] = useState('')

  //@TODO: Here for rendering， 如何进行render..
  const [images, setImages] = useState({
      "uploadResults": []
  })

  const sizeMap = {
    "1:1": "1024x1024",
    "1:2": "512x1024",
    "3:2": "768x512",
    "3:4": "768x1024",
    "16:9": "1024x576",
    "9:16": "576x1024"
  }

  const router =useRouter()

  const getDefaultSize = (key: string) => sizeMap[key] || '1024x1024'

  let onNameChange = (e)=>{
      setName(e.target.value)
  }
  let onTagsChange = (e) =>{
      setTags(e.target.value)
  }
  let onSizeChange = (size: string) => {
     console.log(`Size------: ${size}` )

      setSize(size)
  }
  let onInferenceStepChange = (e)=>{
      setInferenceSteps(e.target.value)
  }
  let onImageCountChange = (e) => {
      setImageCount(e.target.value)
  }
  let onPromoteChange = (e)=>{
      setPromote(e.target.value)
  }


  let generateImage = () =>{
      if(!promote){
          alert('提示词不能为空');
          //@TODO  这里的return 为什么直接就回到了list页面。
          return 
      }

      let textToImageRequest = {
          'prompt': promote, 
          'imageSize': getDefaultSize(size), 
          'batchSize': imageCount, 
          'numberInferenceSteps': inferenceSteps
      }

      /**
       * {
       *    "uploadResults": [ { key: ke1, uri: uri1}, {}]
       * }
       */
      instance.post('/material/text-to-images', textToImageRequest).then(res => {
          console.log('res.data: '+res.data)
          setImages(res.data)
      }).catch(error => {
          setErrorMessage(error)
      })
      return 
  }

  let onCreateAIMaterial = () =>{
      
      let tagsNames = tags.split(',');
      let keyList = images.map(item => item.key)

      let createAIRequest = {
        'name': name, 
        'tagNames': tagsNames, 
        'mode': 1,
        'config': {
            'prompt': promote, 
            'imageSize': getDefaultSize(size), 
            'batchSize': imageCount, 
            'numberInferenceSteps': inferenceSteps
        }, 
        'keys': keyList
      }

      instance.post('/material/add', createAIRequest).then(res=>{
          //Router to list页面。 

      }).catch(error =>{
          setErrorMessage(error.message)
      })

  }

  return (
    <>
      <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          className="relative hidden flex-col items-start gap-8 md:flex"
          x-chunk="dashboard-03-chunk-0"
        >
          <form className="grid w-full items-start gap-6">
            <fieldset className="grid gap-6 rounded-lg border p-4">
              <legend className="-ml-1 px-1 text-sm font-medium">
                Settings
              </legend>
              <div className="grid gap-3">
                <Label htmlFor="name">名字</Label>
                <Input id="name" placeholder="Your Name" onChange={onNameChange} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tags">标签</Label>
                <Input id="tags"  placeholder="" onChange={onTagsChange}/>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="size">大小</Label>
                <Select >
                  <SelectTrigger
                    id="size"
                    className="items-start [&_[data-description]]:hidden"
                  >
                    <SelectValue placeholder="选择图片大小" value={size}  />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="1:1"  onSelect= { () => onSizeChange("1:1")}>
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Rabbit className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                           1:1
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="1:2" onSelect= { () => onSizeChange("1:2")}>
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Rabbit className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                           1:2
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="3:2" onSelect= { () => onSizeChange("3:2")}>
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Bird className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                            3:2
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="3:4" onSelect= { () => onSizeChange("3:4")}>
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Rabbit className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                           3:4
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="16:9"  onSelect= { () => onSizeChange("16:9")}>
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Bird className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                            16:9
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="inferenceSteps">Inference Steps</Label>
                  <Input id="inferenceSteps" type="number" min="10" max="20" placeholder= "12" onChange={onInferenceStepChange}/>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="imageCount">图片张数</Label>
                  <Input id="imageCount" type="number" min="1" max="4" placeholder="1" onChange={onImageCountChange}/>
                </div>
              </div>
            </fieldset>
          </form>
          <div>
              <Label> 确保图片不为空 </Label>
              <div style={{ color: 'red' }}>{errorMessage} </div>
              <Button onChange={onCreateAIMaterial} >创建素材</Button>
          </div>
        </div>
        <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2">
          <Badge variant="outline" className="absolute right-3 top-3">
            Output
          </Badge>
          <div className="flex-1" />
          <form
            className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
            x-chunk="dashboard-03-chunk-1"
          >
            <Label htmlFor="message" className="sr-only">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0" onChange={onPromoteChange}
            />
            <div className="flex items-center p-3 pt-0">
              <Button  size="sm" className="ml-auto gap-1.5" onClick={generateImage}>
                Send Message
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
