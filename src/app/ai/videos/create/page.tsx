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

  //Initilization
  useEffect(() => {
    // 获取当前用户的所有的 tag list
    instance
      .get("/tags")
      .then((response) => {
        setTagList(response.data);
      })
      .catch((error) => {
        console.log(error);
      });

    instance.get('/audio/synthesis').then(res=>{
       setSynthesisList(res.data)
    }).catch(err => {
        console.error(err)
    })

    instance.get('/video/source').then(res=>{
        setVideoSourceList(res.data)
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
      setErrorMessage('subject can not be empty.')
    }
    setErrorMessage('')

    instance
      .post("/video/script", {
        subject: subject,
      })
      .then((res) => {
        setScript(res.data.script);
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(error)

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
      <div>
        <Collapse
          size="large"
          items={[
            {
              key: "1",
              label: "高级视频设置",
              children: (
                <>
                  <Descriptions>
                    <DescriptionsItem label="画面比例">
                      <select
                        value={videoSetting.size}
                        onChange={(e) => buildVideoSetting({ size: e.target.value })}
                      >
                        <option value="16:9">16 : 9</option>
                        <option value="9:16">9 : 16</option>
                      </select>
                    </DescriptionsItem>
                    <DescriptionsItem label="视频素材种类">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <select
                            value={videoSetting.source}
                            onChange={onSelectVideoSource}
                          >
                            {videoSourceList.map((source) => (
                              <option key={source.value} value={source.value}>
                                {source.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      
                      </div>
                    </DescriptionsItem>
                    <DescriptionsItem label="视频素材选择">
                    <div  style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ marginTop: '20px' }}>
                              {videoSetting.source === "local" ||
                              videoSetting.source === "mixed" ? (
                                <select
                                  multiple
                                  name="请选择一个或者多个素材"
                                  value={videoSetting.materialIds}
                                  onChange={(e) => {
                                       buildVideoSetting({ materialIds: Array.from(e.target.selectedOptions).map(option => option.value) })
                                  }}
                                >
                                  {materialList.map((option) => (
                                    <option
                                      key={option.id}
                                      value={option.id}
                                    >
                                      {option.name}
                                    </option>
                                  ))}
                                </select>
                              ) : null}
                            </div>
                    </div>
                    </DescriptionsItem>

                  </Descriptions>
                </>
              ),
            },
            {
              key: "2",
              label: "高级音频设置",
              children: (
                <>
                  <Descriptions>
                    <DescriptionsItem label="配音声音">
                      <select
                        value={audioSetting.synthesis || 'zh-CN-YunxiaNeural'} 
                        onChange={(e) => buildAudioSetting({ synthesis: e.target.value })}
                      >
                        {synthesisList.map((option, key) => {
                          return (
                            <option value={option.value} key={key}>
                              {option.label}
                            </option>
                          );
                        })}
                      </select>
                    </DescriptionsItem>
                    <DescriptionsItem label="背景音乐">
                      <select
                        value={audioSetting.bgm}
                        onChange={(e) => buildAudioSetting({ bgm: e.target.value })}
                      >
                        <option value="nobgm">无</option>
                        <option value="aibgm">AI自动</option>
                        {/* {musicList.map((option, key) => (
                          <option value={option.id} key={key}>
                            {option.name}{" "}
                          </option>
                        ))} */}
                      </select>
                    </DescriptionsItem>
                  </Descriptions>
                </>
              ),
            },
          ]}
        />
      </div>
  );
  }
  return (
    <>
      <Header title="Create Video"></Header>
      <div className="p-4">
        <Card title="快速生成视频">
          <Timeline
            items={[
              // {
              //   //color: "green",
              //   children: (
              //     <>
              //       <Card title="一、主题-(你可以跳过这部分直接在提示词里面输入视频文案)" bordered={false}>
              //         <Space
              //           size={15}
              //           direction="vertical"
              //           style={{ display: "flex" }}
              //         >
              //           <Input.TextArea
              //             placeholder="请用简单的一句话描述你的视频文案"
              //             value={subject}
              //             rows={1}
              //             onChange={(e) => setSubject(e.target.value)}
              //           />
              //           <div
              //             style={{
              //               display: "flex",
              //               flexDirection: "row-reverse",
              //             }}
              //           >
              //             <Button
              //               size="large"
              //               style={{ width: "200px", backgroundColor: "#000000", color: "#ffffff", border: "1px solid #d9d9d9" }}
              //               type="primary"
              //               onClick={generateScript}
              //             >
              //               生成文案
              //             </Button>
              //           </div>
              //         </Space>
              //       </Card>
              //     </>
              //   ),
              // },
              {
                children: (
                  <>
                  { /*<Card> */}
                    {/* <Card {title="二、视频文案" bordered={false}}> */}
                      <Space
                        size={15}
                        direction="vertical"
                        style={{ display: "flex" }}
                      >
                      <label>标题<label style={{ color: 'red' }}>*</label></label>
                      
                      <Input
                        id="title"
                        placeholder="请输入视频标题"
                        value={name}
                        onChange={(e) => setName(e.target.value.substring(0, 30))}
                        maxLength={30}
                        style={{ width: '30%' }}
                      />
                      <Space
                        size={15}
                        direction="vertical"
                        style={{ display: "flex" }}
                      ></Space>
                        <Space
                        size={15}
                        direction="vertical"
                        style={{ display: "flex" }}
                        >
                        <label> 文案提示词 </label>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Input.TextArea
                            placeholder="请用简单的一句话描述你的视频文案"
                            value={subject}
                            rows={1}
                            onChange={(e) => setSubject(e.target.value)}
                            style={{ flex: 1, marginRight: '10px' }}
                          />
                          <Button
                            size="large"
                            style={{ width: "200px", backgroundColor: "#000000", color: "#ffffff", border: "1px solid #d9d9d9" }}
                            type="primary"
                            onClick={generateScript}
                          >
                            生成文案
                          </Button>
                        </div>
                      </Space>
                       <label></label>
                       <label><label style={{ color: 'red' }}>*</label>文案(你可以直接编辑，也可以通过主题生成文案)</label> <Input.TextArea
                          id="script"
                          placeholder="generate or input your script here"
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                          rows={4}
                        />

                        <label>标签<label style={{ color: 'red' }}>*</label></label>
                        <Space className={styles.spaceBetween}>
                          
                          
                          <Select
                            mode="multiple"
                            allowClear
                            size="large"
                            style={{ width: "300px" }}
                            placeholder="Please select tags"
                            value={selectedTags}
                            onChange={(values) => setSelectedTags(values)}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                          >
                            {tagList.map((tag) => (
                              <Select.Option key={tag.id} value={tag.name}>
                                {tag.name}
                              </Select.Option>
                            ))}
                          </Select>
                          <label style={{ color: 'red' }}>{errorMessage}</label>
                          <Button
                            size="large"
                            style={{ width: "200px", backgroundColor: "#000000", color: "#ffffff", border: "1px solid #d9d9d9" }}
                            type="primary"
                            onClick={submitVideoTask}
                          >
                            生成视频
                          </Button>
                        </Space>
                        <div>
                            {(advancedSetting() )}

                        </div>
                      </Space>
                    { /*</Card>  */}
                  </>
                ),
              },
              
            ]}
          />
        </Card>
      </div>
    </>
  );
}
