import React, { useEffect, useState } from 'react';

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {instance} from '@/lib/axios'
import { Tags } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateVideo() {

    //控制变量
    const [showConfig, setShowConfig] = useState(false)

    const onConfigToggle = ()=>{
        setShowConfig(!showConfig);
    }

    //数据变量
    const [subject, setSubject] = useState('')
    const [script, setScript] = useState('')

    const [videoSetting, setVideoSetting] = useState({
        'size': "16:9",
        'source': '',
        'materialList': [] as string[]
    })

    const [tagList, setTagList] = useState(['abc', 'bcd'])
    const [materialList, setMaterialList] = useState([])
    const [selectedTags, setSelectedTags] = useState([])
    const [audioSetting, setAudioSetting] = useState({
        "synthesis": "",
        "backgroundMusic": ""
    })
    const [errorMessage, setErrorMessage] = useState('')
    const router = useRouter()

    useEffect(()=>{
        //init the tag list        

        //init material list

    }, [])

    useEffect(() => {
        if (videoSetting.source === 'materials' || videoSetting.source === 'mixed') {
          // 获取当前用户的所有的 tag list
          instance.get('/api/getTagList')
            .then(response => {
                setTagList(response.data)
            }).catch(error => {
                console.log(error)
            })
        } 
      }, [videoSetting.source]);


    const onScriptChange = (e) =>{
        setScript(e.target.value)
    }

    const onTagSelected = (event) => {
        console.log('---'+event.target)
        //TODO 前端如何渲染。
        const newSelectedOptions = Array.from(event.target.selectedOptions).map((option) => option.value);
        setTagList(newSelectedOptions)
      };

    const generateScript = ()=>{
        instance.post('/video/generateScript', {
            'subject': subject
        }).then(res =>{
            setScript(res.data)
        }).catch(error=>{
            console.error(error)
        })
    }

    
    //Advanced => Video Setting
    const onVideoSizeChange = (e)=>{
        alert(e.target.value)
        setVideoSetting({
            'size': e.target.value,
            'source': videoSetting.source,
            'materialList': videoSetting.materialList
        })
    }

    const onVideoSourceChange = (event) => {
        console.log("video source: "+event.target.value)
        setVideoSetting({
            'size': videoSetting.size,
            'source': event.target.value,
            'materialList': videoSetting.materialList
        })
    }

    const onSelectMaterials = (event) => {
        const selectedMaterials = Array.from(event.target.selectedOptions).map((option) => option.value);
        console.log('select materials: ' + selectedMaterials)
        setVideoSetting({
            'size': videoSetting.size,
            'source': videoSetting.source,
            'materialList': selectedMaterials as string[]
        })
    }

    

    const submitVideoTask = ()=>{
        let data = {
            "scriptDTO": {
                "subject": subject,
                "script": script,
                "tags": selectedTags,
            },
            "videoDTO": videoSetting,
            "audioDTO": audioSetting
        }
        instance.post('/video/addVideo', data)
            .then(res => {
                //router back to 
                router.push('/ai/videos')
            }).catch(error => {
                setErrorMessage(error.message)
            })
    }


    let config = ()=>{
        return (
           <div className="video-settings">
                <div className="video-setting-item">
                    <label>视频</label>
                    <div>
                        <label>画面比例</label>
                        <select value={videoSetting.size} onChange={onVideoSizeChange}>
                            <option value="16:9">16:9</option>
                            <option value="9:16">9:16</option>
                        </select>
                    </div>
                    <label></label>
                    <div>
                        <label>来源</label>
                        <select value={videoSetting.source} onChange={onVideoSourceChange}>
                            <option value="materials">自有素材</option>
                            <option value="ai">AI生成</option>
                            <option value='mixed'>自有素材+AI生成</option>
                        </select>
                        {videoSetting.source === 'materials' || videoSetting.source === 'mixed' ? (
                            <select multiple value={materialList} onChange={onSelectMaterials}>
                                {materialList.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                            ))}
                            </select>
                            ) : null}
                    </div>

                </div>
                <div className="video-setting-item"> 
                    <label>音频</label>
                    <div>
                        <label>配音声音</label>
                        <select>
                            <option value="option1">zh-CN-YunxiNeural-Male</option>
                        </select>
                    </div>
                    <label></label>
                    <div>
                        <label>背景音乐</label>
                        <select>
                            <option value="option1">无</option>
                            <option value="option1">AI自动</option>
                            <option value="option1">自有素材</option>
                        </select>

                    </div>
                </div>
            </div>
            )
    }


    return (
        <>
        <div>
          <div className="w-full bg-gray-100 rounded-xl my-7 p-10">
            <input type="text" value={subject} />
            <button onClick={generateScript}>生成文案</button>
          </div>
          <div/>
          <div>
            <label>标签</label>
                <select multiple  value={tagList} onChange={onTagSelected}>
                        {tagList.map(tag => (
                            <option key={tag} value={tag}>
                            {tag}
                            </option>
                        ))}
                </select>
           </div>
          <div className="w-full bg-gray-100 rounded-xl my-7 p-10">
            <Textarea
              id="script"
              placeholder="generate or input your script here"
              className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0" value={script} onChange={onScriptChange} />

            <button onClick={submitVideoTask}>生成视频</button>
          </div>
          
          <button onClick={onConfigToggle}>高级</button>
          {showConfig && (
            config()
          )}
        </div>
        </>
      );
}