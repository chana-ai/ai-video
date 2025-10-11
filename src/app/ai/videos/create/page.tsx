"use client";
import React, { useEffect, useState } from "react";

import Header from "../../header";

import { instance } from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
  Card,
  Timeline,
  Input,
  Button,
  Space,
  Select,
  Collapse,
  Descriptions,
} from "antd";
import styles from "./page.module.scss";
import DescriptionsItem from "antd/es/descriptions/Item";


export default function CreateVideo() {
  
  //数据变量
  const [name, setName] = useState('');
  const [subject, setSubject] = useState("");
  const [script, setScript] = useState("");

  /// 所有tag 列表, 前端显示使用
  /// List({id: 9, name: ' 可爱'})
  const [tagList, setTagList] = useState([{id: 0, name: ""}]);
  const [synthesisList, setSynthesisList] = useState([{'value':"", 'label':""}])
  /// 选中的tag.组装请求使用。
  const [selectedTags, setSelectedTags] = useState([]);

  /// videoSetting中的 显示 素材链表的，前端显示使用
  const [materialList, setMaterialList] = useState([{'id':"", 'name': ''}]);
  const [videoSourceList, setVideoSourceList] = useState([{"value": "", "label":""}]);

  //显示使用
  const [musicList, setMusicList] = useState([]);

  const [disableScriptGeneration, setDisableScripGeneration] = useState(false);

  const [videoSetting, setVideoSetting] = useState({
    size: "16:9",
    source: 'ai',
    materialIds: [] as string[], /// 选中的素材列表。
  });

  const [audioSetting, setAudioSetting] = useState({
    synthesis: null,
    bgm: 0,
  });
 

  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(true);

  //Initilization
  useEffect(() => {
    // 获取当前用户的所有的 tag list
    instance
      .get("/tags")
      .then((response) => {
        setTagList(response.data|| response);
      })
      .catch((error) => {
        console.log(error);
      });

    instance.get('/audio/synthesis').then(res=>{
       setSynthesisList(res.data|| res)
    }).catch(err => {
        console.error(err)
    })

    instance.get('/video/source').then(res=>{
        setVideoSourceList(res.data|| res)
    }).catch(err => {
        console.error(err)
    })
  }, []);


  const onSelectVideoSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    buildVideoSetting({ source: e.target.value });
    if (e.target.value === 'ai') {
      console.log("Selected source is AI or no tags are selected.");
    } else {
       const cacheKey = JSON.stringify(selectedTags.sort());
      // const cachedMaterials = getCache(cacheKey);

      // if (cachedMaterials) {
      //   setMaterialList(cachedMaterials);
      // } else {
        instance
          .post("/material/search", {
            tagNames: selectedTags,
          })
          .then((res) => {
            const filteredRecords = res.data.records.map(({ id, name }: { id: string; name: string }) => ({ id, name }));
            console.log(JSON.stringify(filteredRecords));
            setMaterialList(filteredRecords);
            //putCache(cacheKey, res.data.records);
          })
          .catch((error) => {});
      //}
    }
  };
 
  const generateScript = () => {
    
    if (!subject){
      alert('文案提示词不能为空')
      return
    }
    setErrorMessage('')
    setDisableScripGeneration(true)

    instance
      .post("/video/script", {
        subject: subject,
      })
      .then((res) => {
        setScript(res.script);
        setDisableScripGeneration(false)
      })
      .catch((error) => {
        setDisableScripGeneration(false)
        console.error(error.message);
        setErrorMessage(error.message)
      });
      
  };

  const buildVideoSetting = (param: { source?: any; size?: any; materialIds?: any; }) =>{
      console.log("---", param)
      const newVideoSetting = {
        size: param.size || videoSetting.size,
        source: param.source || videoSetting.source,
        materialIds: param.materialIds || videoSetting.materialIds,
      };

      setVideoSetting(newVideoSetting);
  }

  const buildAudioSetting = (param: { synthesis?: any; bgm?: any; }) =>{
      const newAudioSetting = {
        synthesis: param.synthesis || audioSetting.synthesis,
        bgm: param.bgm || audioSetting.bgm,
      };

      setAudioSetting(newAudioSetting);
  }

  const submitVideoTask = () => {
    setErrorMessage('')
    if (!name) {
      setErrorMessage('Name cannot be empty.');
      return;
    }
    let data = {
      name: name,
      script: {
        subject: subject,
        script: script,
        tagNames: selectedTags,
      },
      video: videoSetting,
      audio: audioSetting,
    };
    instance
      .post("/video/add", data)
      .then((res) => {
        //router back to
        router.push("/ai/videos");
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  };

  const advancedSetting= ()=>{

    return (
      <div className="flex flex-row gap-8 bg-[#232425] rounded-lg p-6 mb-8 w-full max-w-3xl mx-auto">
      {/* 视频设置 */}
      <div className="flex-1 min-w-[180px] max-w-xs">
        <div className="text-white font-semibold mb-2">视频</div>
        <div className="flex gap-2 mb-4">
            <Button className={`border border-green-500 rounded-lg text-base font-medium py-2 px-6 ${videoSetting.size === '16:9' ? 'bg-green-500 text-white' : 'bg-white text-blank-600'}`} onClick={() => buildVideoSetting({ size: '16:9' })}>16:9</Button>
            <Button className={`border border-green-500 rounded-lg text-base font-medium py-2 px-6 ${videoSetting.size === '9:16' ? 'bg-green-500 text-white' : 'bg-white text-blank-600'}`} onClick={() => buildVideoSetting({ size: '9:16' })}>9:16</Button>
        </div>
      </div>
      {/* 音频设置 */}
      <div className="flex-1 min-w-[180px] max-w-xs">
        <div className="text-white font-semibold mb-2">音频</div>
        <div className="mb-2">
          <label className="text-gray-400 mr-2">配音声音</label>
          <select 
            className="bg-[#232425] border border-[#444] text-white rounded px-2 py-1 w-full max-w-xs"
            value={audioSetting.voice}
            onChange={(e) => buildAudioSetting({ voice: e.target.value })}
          >
            {synthesisList.map((item, index) => (
              <option key={index} value={item.value} selected={item.value === audioSetting.synthesis}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-400 mr-2">背景音乐</label>
          <select className="bg-[#232425] border border-[#444] text-white rounded px-2 py-1 w-full max-w-xs">
            <option>自动匹配</option>
          </select>
        </div>
      </div>
      {/* 字幕设置 */}
      {/* <div className="flex-1 min-w-[180px] max-w-xs">
        <div className="flex items-center mb-2">
          <input type="checkbox" checked readOnly className="accent-green-500 mr-2" />
          <span className="text-white font-semibold">字幕</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <select className="bg-[#232425] border border-[#444] text-white rounded px-2 py-1 w-24">
            <option>微软雅黑</option>
          </select>
          <select className="bg-[#232425] border border-[#444] text-white rounded px-2 py-1 w-20">
            <option>40px</option>
          </select>
          <input type="color" value="#FFFFFF" className="w-8 h-8 border border-[#444] rounded" readOnly />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <input type="color" value="#333333" className="w-8 h-8 border border-[#444] rounded" readOnly />
          <select className="bg-[#232425] border border-[#444] text-white rounded px-2 py-1 w-16">
            <option>1px</option>
          </select>
        </div>
        <div>
          <select className="bg-[#232425] border border-[#444] text-white rounded px-2 py-1 w-24">
            <option>底部</option>
          </select>
        </div>
      </div> */}
    </div>
  );
  }
  return (
    <>
      <Header title="Create Video"></Header>
      <div className="p-4 flex flex-col items-center">

        {/* Title and script generation controls (restored) */}
        <div className="mb-4 w-full max-w-3xl flex flex-col items-center">
          <div className="flex w-full items-center mb-2">
            <label className="w-32 text-left">标题<span style={{ color: 'red' }}>*</span></label>
            <Input
              id="title"
              placeholder="请输入视频标题"
              value={name}
              onChange={(e) => setName(e.target.value.substring(0, 30))}
              maxLength={30}
              className="flex-1"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="mb-4 w-full max-w-3xl flex flex-col items-center">
          <div className="flex w-full items-center mb-2">
            <label className="w-32 text-left">文案提示词</label>
            <Input
              placeholder="请用简单的一句话描述你的视频文案"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1"
              style={{ width: '100%' }}
            />
            <Button
              className="ml-4 bg-white border border-green-500 text-blank-600 rounded-lg text-base font-medium py-2 px-6"
              style={{ width: 200 }}
              onClick={generateScript}
              disabled={disableScriptGeneration ? disableScriptGeneration : false}
            >
              生成文案
            </Button>
          </div>
        </div>
        <div className="mb-4 w-full max-w-3xl flex flex-col items-center">
          <div className="flex w-full items-center mb-2">
            <label className="w-32 text-left"><span style={{ color: 'red' }}>*</span>文案</label>
            <Input.TextArea
              id="script"
              placeholder="generate or input your script here"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={6}
              maxLength={800}
              className="flex-1"
              style={{ width: '100%' }}
            />
          </div>
          <div className="text-right text-xs text-gray-400 w-full max-w-3xl pr-4">{script.length}/800</div>
          <div className="flex items-center gap-2 mb-2 mt-6 cursor-pointer select-none w-full max-w-3xl mx-auto" onClick={() => setShowSettings((v) => !v)}>
          <span className="text-blank-500"></span>
          <span className="text-blank-500 font-semibold text-lg">设置</span>
          <span className="ml-2 text-gray-400">{showSettings ?  '▲' : '▼'}</span>
        </div>
        {showSettings && (
          advancedSetting()
        )}
        </div>

        {/* Settings section with fold/unfold */}
       

        {/* Generate button and cost indicator */}
        <div className="flex w-full max-w-3xl mx-auto mt-4 justify-end">
          <Button className="bg-white border border-green-500 text-blank-600 rounded-lg text-base font-medium py-2 px-6" style={{ width: 200 } } onClick={submitVideoTask}>生成</Button>
        </div>
      </div>
    </>
  );
}
