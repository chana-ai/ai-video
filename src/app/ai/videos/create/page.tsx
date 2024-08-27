"use client";
import React, { useEffect, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
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
  //控制变量
  const [showConfig, setShowConfig] = useState(false);

  const onConfigToggle = () => {
    setShowConfig(!showConfig);
  };

  //数据变量
  const [subject, setSubject] = useState("");
  const [script, setScript] = useState("");

  /// 所有tag 列表, 前端显示使用
  const [tagList, setTagList] = useState(["abc", "bcd"]);
  /// 选中的tag.组装请求使用。
  const [selectedTags, setSelectedTags] = useState([]);

  const [videoSetting, setVideoSetting] = useState({
    size: "16:9",
    source: "",
    materialList: [] as string[], /// 选中的素材列表。
  });

  /// videoSetting中的 显示 素材链表的，前端显示使用
  const [materialList, setMaterialList] = useState([]);

  ///
  const [musicList, setMusicList] = useState([]);
  let synthesisList = [
    {
      name: "zh-CN-XiaoxiaoNeural",
      cnName: "晓晓神经网络",
      gender: "Female",
    },
    {
      name: "zh-CN-XiaoyiNeural",
      cnName: "小怡神经网络",
      gender: "Female",
    },
    {
      name: "zh-CN-YunjianNeural",
      cnName: "云剑神经网络",
      gender: "Male",
    },
    {
      name: "zh-CN-YunxiNeural",
      cnName: "云熙神经网络",
      gender: "Male",
    },
    {
      name: "zh-CN-YunxiaNeural",
      cnName: "云夏神经网络",
      gender: "Male",
    },
    {
      name: "zh-CN-YunyangNeural",
      cnName: "云阳神经网络",
      gender: "Male",
    },
    {
      name: "zh-CN-liaoning-XiaobeiNeural",
      cnName: "辽宁小北神经网络",
      gender: "Female",
    },
    {
      name: "zh-CN-shaanxi-XiaoniNeural",
      cnName: "陕西小妮神经网络",
      gender: "Female",
    },
    {
      name: "zh-HK-HiuGaaiNeural",
      cnName: "晓佳神经网络",
      gender: "Female",
    },
    {
      name: "zh-HK-HiuMaanNeural",
      cnName: "晓满神经网络",
      gender: "Female",
    },
    {
      name: "zh-HK-WanLungNeural",
      cnName: "云龙神经网络",
      gender: "Male",
    },
    {
      name: "zh-TW-HsiaoChenNeural",
      cnName: "晓晨神经网络",
      gender: "Female",
    },
    {
      name: "zh-TW-HsiaoYuNeural",
      cnName: "晓语神经网络",
      gender: "Female",
    },
    {
      name: "zh-TW-YunJheNeural",
      cnName: "云杰神经网络",
      gender: "Male",
    },
  ];

  const [audioSetting, setAudioSetting] = useState({
    synthesis: synthesisList[0].name + "-" + synthesisList[0].gender,
    bgm: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  //Init tag list
  useEffect(() => {
    // 获取当前用户的所有的 tag list
    instance
      .get("/api/getTagList")
      .then((response) => {
        setTagList(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [tagList]);

  useEffect(() => {
    //init material list
    if (
      videoSetting.source === "materials" ||
      videoSetting.source === "mixed"
    ) {
      instance
        .post("/material/search", {
          tagNames: selectedTags,
        })
        .then((res) => {
          console.log("" + JSON.stringify(res.data.records));
          let data = res.data.records;
          setMaterialList(res.data.records);
        })
        .catch((error) => {});
    }
  }, [videoSetting.source]);

  useEffect(() => {
    //Init the background music list
    instance
      .post("/material/musicList", {
        tagNames: selectedTags,
      })
      .then((res) => {
        console.log("" + JSON.stringify(res.data.records));
        setMusicList(res.data.records);
      })
      .catch((error) => {
        console.log("music list " + JSON.stringify(error));
      });
  }, []);

  const onScriptChange = (e) => {
    setScript(e.target.value);
  };

  const onTagSelected = (event) => {
    console.log("---" + event.target);
    //TODO 前端如何渲染。
    const newSelectedOptions = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );
    setTagList(newSelectedOptions);
  };

  const generateScript = () => {
    instance
      .post("/video/generateScript", {
        subject: subject,
      })
      .then((res) => {
        setScript(res.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  //Advanced => Video Setting
  const onVideoSizeChange = (e) => {
    alert(e.target.value);
    setVideoSetting({
      size: e.target.value,
      source: videoSetting.source,
      materialList: videoSetting.materialList,
    });
  };

  const onVideoSourceChange = (event) => {
    console.log("video source: " + event.target.value);
    setVideoSetting({
      size: videoSetting.size,
      source: event.target.value,
      materialList: videoSetting.materialList,
    });
  };

  const onSelectMaterials = (event) => {
    const selectedMaterials = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );
    console.log("select materials: " + selectedMaterials);
    setVideoSetting({
      size: videoSetting.size,
      source: videoSetting.source,
      materialList: selectedMaterials as string[],
    });
  };

  const onselectedBMG = (event) => {
    setAudioSetting({
      synthesis: audioSetting.synthesis,
      bgm: event.target.value,
    });

    console.log("message: " + JSON.stringify(audioSetting));
  };

  const onSelectSynthesis = (event) => {
    setAudioSetting({
      synthesis: event.target.value,
      bgm: audioSetting.bgm,
    });
    console.log("select Synthesis " + JSON.stringify(audioSetting));
  };

  const submitVideoTask = () => {
    let data = {
      scriptDTO: {
        subject: subject,
        script: script,
        tags: selectedTags,
      },
      videoDTO: videoSetting,
      audioDTO: audioSetting,
    };
    instance
      .post("/video/addVideo", data)
      .then((res) => {
        //router back to
        router.push("/ai/videos");
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  };

  let config = () => {
    return (
      <div className="video-settings">
        <div className="video-setting-item"></div>
        <div className="video-setting-item"></div>
      </div>
    );
  };

  const description = "This is a description.";
  return (
    <>
      <Header title="Create Video"></Header>
      <div className="p-4">
        <Card title="快速生成视频">
          <Timeline
            items={[
              {
                color: "green",
                children: (
                  <>
                    <Card title="一、视频文案" bordered={false}>
                      <Space
                        size={15}
                        direction="vertical"
                        style={{ display: "flex" }}
                      >
                        <Input.TextArea
                          placeholder="请填写生成视频的文案..."
                          value={subject}
                          rows={4}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row-reverse",
                          }}
                        >
                          <Button
                            size="large"
                            style={{ width: "200px" }}
                            type="primary"
                            onClick={generateScript}
                          >
                            生成文案
                          </Button>
                        </div>
                      </Space>
                    </Card>
                  </>
                ),
              },
              {
                color: "green",
                children: (
                  <>
                    <Card title="二、生成视频" bordered={false}>
                      <Space
                        size={15}
                        direction="vertical"
                        style={{ display: "flex" }}
                      >
                        <Input.TextArea
                          id="script"
                          placeholder="generate or input your script here"
                          value={script}
                          onChange={onScriptChange}
                          rows={4}
                        />

                        <Space className={styles.spaceBetween}>
                          <Select
                            mode="multiple"
                            allowClear
                            size="large"
                            style={{ width: "300px" }}
                            placeholder="Please select"
                            defaultValue={["a10", "c12"]}
                            value={tagList}
                            onChange={onTagSelected}
                          >
                            {tagList.map((tag) => (
                              <Select.Option key={tag} value={tag}>
                                {tag}
                              </Select.Option>
                            ))}
                          </Select>
                          <Button
                            size="large"
                            style={{ width: "200px" }}
                            type="primary"
                            onClick={submitVideoTask}
                          >
                            生成视频
                          </Button>
                        </Space>
                      </Space>
                    </Card>
                  </>
                ),
              },
              {
                color: "green",
                children: (
                  <>
                    <Card title="三、高级设置" bordered={false}>
                      <Collapse
                        size="large"
                        items={[
                          {
                            key: "1",
                            label: "视频设置",
                            children: (
                              <>
                                <Descriptions>
                                  <DescriptionsItem label="画面比例">
                                    <select
                                      value={videoSetting.size}
                                      onChange={onVideoSizeChange}
                                    >
                                      <option value="16:9">16:9</option>
                                      <option value="9:16">9:16</option>
                                    </select>
                                  </DescriptionsItem>
                                  <DescriptionsItem label="来源">
                                    <select
                                      value={videoSetting.source}
                                      onChange={onVideoSourceChange}
                                    >
                                      <option value="materials">
                                        自有素材
                                      </option>
                                      <option value="ai">AI生成</option>
                                      <option value="mixed">
                                        自有素材+AI生成
                                      </option>
                                    </select>
                                    {videoSetting.source === "materials" ||
                                    videoSetting.source === "mixed" ? (
                                      <select
                                        multiple
                                        value={videoSetting.materialList}
                                        onChange={onSelectMaterials}
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
                                  </DescriptionsItem>
                                </Descriptions>
                              </>
                            ),
                          },
                          {
                            key: "2",
                            label: "音频设置",
                            children: (
                              <>
                                <Descriptions>
                                  <DescriptionsItem label="配音声音">
                                    <select
                                      value={audioSetting.synthesis}
                                      onChange={onSelectSynthesis}
                                    >
                                      {synthesisList.map((option, key) => {
                                        const index =
                                          option.name + "-" + option.gender;
                                        return (
                                          <option value={index} key={key}>
                                            {option.cnName}-{option.gender}{" "}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </DescriptionsItem>
                                  <DescriptionsItem label="背景音乐">
                                    <select
                                      value={audioSetting.bgm}
                                      onChange={onselectedBMG}
                                    >
                                      <option value="nobgm">无</option>
                                      <option value="aibgm">AI自动</option>
                                      {musicList.map((option, key) => (
                                        <option value={option.id} key={key}>
                                          {option.name}{" "}
                                        </option>
                                      ))}
                                    </select>
                                  </DescriptionsItem>
                                </Descriptions>
                              </>
                            ),
                          },
                        ]}
                      />
                    </Card>
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
