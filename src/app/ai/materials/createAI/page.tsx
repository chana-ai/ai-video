"use client";

import { Bird, CornerDownLeft, Rabbit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
//import { Button } from "@/components/ui/button";
import {Button} from "antd";
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
import { SetStateAction, useState } from "react";
import { instance } from "@/lib/axios";
import { useRouter } from "next/navigation";
import Header from "../../header";

export default function CreateAIMaterial() {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [size, setSize] = useState("");
  const [inferenceSteps, setInferenceSteps] = useState(2);
  const [imageCount, setImageCount] = useState(1);
  const [promote, setPromote] = useState("A circular cosmetic product bottle rendered on the surface of water inside a cave, surrounded by flowers, with an organic computer (OC) rendering in Blender. The bottle could be reflecting the surrounding environment with a shimmering effect, and the flowers might have a delicate petal texture, creating a vibrant and visually striking composition. The cave walls could be adorned with lush greenery or stalactites, adding to the immersive and mystical atmosphere.");
  const [disableSendMessage, setDisableSendMessage] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

//   [
//     {
//         "key": "1/material/2024-08-29/dsLfddxd/0cfcf6b8-752c-426c-a620-8dbafb5f18b9_00001_.png",
//         "uri": "https://chana-video-dev.oss-cn-beijing.aliyuncs.com/1/material/2024-08-29/dsLfddxd/0cfcf6b8-752c-426c-a620-8dbafb5f18b9_00001_.png?Expires=1724933241&OSSAccessKeyId=LTAI5tRkoomnUcyefEXcP9nv&Signature=PMfQNUO3%2BkeKzHdjg6gmdqzN2qY%3D"
//     }
// ]
  //@TODO: Here for rendering， 如何进行render..
  const [images, setImages] = useState<{ uploadResults: { pathName: string; uri: string }[] }>({
    uploadResults: [],
  });
  const sizeMap = {
    "1:1": "1024x1024",
    "1:2": "512x1024",
    "3:2": "768x512",
    "3:4": "768x1024",
    "16:9": "1024x576",
    "9:16": "576x1024",
  };

  const router = useRouter();

  const getDefaultSize = (key: string) => (sizeMap as any)[key] || "512x1024";

  let onNameChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setName(e.target.value);
  };
  let onTagsChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setTags(e.target.value);
  };
  let onSizeChange = (size: string) => {
    console.log(`Size------: ${size}`);

    setSize(size);
  };
  let onInferenceStepChange = (e: any) => {
    setInferenceSteps(e.target.value);
  };
  let onImageCountChange = (e: any) => {
    setImageCount(e.target.value);
  };
  let onPromoteChange = (e: any) => {
    setPromote(e.target.value);
  };

  let generateImage = () => {
    if (!promote) {
      alert("提示词不能为空");
      //@TODO  这里的return 为什么直接就回到了list页面。
      return;
    }

    setDisableSendMessage(true)
    let textToImageRequest = {
      prompt: promote,
      imageSize: getDefaultSize(size),
      batchSize: imageCount,
      numberInferenceSteps: inferenceSteps,
    };

    /**
     * {
     *    "uploadResults": [ { key: ke1, uri: uri1}, {}]
     * }
     */
    instance
      .post("/material/text-to-images", textToImageRequest)
      .then((res) => {
        console.log("res.data: " + JSON.stringify(res.data));
        setImages({
          uploadResults: res.data.uploadResults
        });
        console.log(images.uploadResults);
        setDisableSendMessage(false);
      })
      .catch((error) => {
        setErrorMessage(error.message);
        setDisableSendMessage(false);
      });
      
    return;
  };

  const onCreateAIMaterial = () => {
    if (!name || !tags || images.uploadResults.length === 0) {
      setErrorMessage("请先填写参数以及生成图片");
      return;
    }
    let tagsNames = tags.split(/[,，\s]+/).filter(tag => tag.trim() !== '');
    let pathNames = images.uploadResults.map((item: {pathName: string, uri: string}) => item.pathName);
    //let keyList = ["1/material/2024-08-29/dsLfddxd/0cfcf6b8-752c-426c-a620-8dbafb5f18b9_00001_.png"]

    let createAIRequest = {
      name: name,
      tagNames: tagsNames,
      mode: 1,
      config: {
        prompt: promote,
        imageSize: getDefaultSize(size),
        batchSize: imageCount,
        numberInferenceSteps: inferenceSteps,
      },
      pathNames: pathNames,
      type: 'PICTURE'
    };

    instance
      .post("/material/add", createAIRequest)
      .then((res) => {
        window.location.href = "/ai/materials";
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  };

  return (
    <>
      <Header title="创建AI素材"></Header>
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
                <Input
                  id="name"
                  placeholder="Image Title"
                  onChange={onNameChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tags">标签</Label>
                <Input id="tags" placeholder="" onChange={onTagsChange} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="size">大小</Label>
                <Select>
                  <SelectTrigger
                    id="size"
                    className="items-start [&_[data-description]]:hidden"
                  >
                    <SelectValue placeholder="选择图片大小"  defaultValue="1:1"
 />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="1:1"
                      onSelect={() => onSizeChange("1:1")}
                    >
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Rabbit className="size-5" />
                        <div className="grid gap-0.5">
                          <p>1:1</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="1:2"
                      onSelect={() => onSizeChange("1:2")}
                    >
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Rabbit className="size-5" />
                        <div className="grid gap-0.5">
                          <p>1:2</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="3:2"
                      onSelect={() => onSizeChange("3:2")}
                    >
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Bird className="size-5" />
                        <div className="grid gap-0.5">
                          <p>3:2</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="3:4"
                      onSelect={() => onSizeChange("3:4")}
                    >
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Rabbit className="size-5" />
                        <div className="grid gap-0.5">
                          <p>3:4</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="16:9"
                      onSelect={() => onSizeChange("16:9")}
                    >
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Bird className="size-5" />
                        <div className="grid gap-0.5">
                          <p>16:9</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="inferenceSteps">Inference Steps</Label>
                  <Input
                    id="inferenceSteps"
                    type="number"
                    min="1"
                    max="4"
                    placeholder="1"
                    onChange={onInferenceStepChange}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="imageCount">图片张数</Label>
                  <Input
                    id="imageCount"
                    type="number"
                    min="1"
                    max="2"
                    placeholder="1"
                    onChange={onImageCountChange}
                  />
                </div>
              </div>
            </fieldset>
          </form>
          <div>
            <div style={{ color: "red" }}>{errorMessage} </div>
            <button onClick={onCreateAIMaterial}  style={{ width: "200px", backgroundColor: "#000000", color: "#ffffff", border: "1px solid #d9d9d9" }}
                 >创建素材</button>
          </div>
        </div>
        <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2">
          <Badge variant="outline" className="absolute right-3 top-3">
            Output
          </Badge>
          {images.uploadResults.length > 0 && (
          <div className="mt-4 flex justify-center items-center h-full">
            {images.uploadResults.length === 1 ? (
              <div className="w-full h-full flex justify-center items-center">
                <img
                  src={images.uploadResults[0].uri}
                  alt="Generated image"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : images.uploadResults.length === 2 ? (
              <div className="w-full h-full flex justify-between items-center">
                {images.uploadResults.map((image, idx) => (
                  <div key={idx} className="w-1/2 h-full flex justify-center items-center p-2">
                    <img
                      src={image.uri}
                      alt={`Generated image ${idx + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          )}
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
              placeholder=""
              value="A circular cosmetic product bottle rendered on the surface of water inside a cave, surrounded by flowers, with an organic computer (OC) rendering in Blender. The bottle could be reflecting the surrounding environment with a shimmering effect, and the flowers might have a delicate petal texture, creating a vibrant and visually striking composition. The cave walls could be adorned with lush greenery or stalactites, adding to the immersive and mystical atmosphere."
              className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
              onChange={onPromoteChange}
              
            />
            <div className="flex items-center p-3 pt-0">
              <Button
                className="ml-auto gap-1.5"
                onClick={() => {
                  generateImage();
                  setDisableSendMessage(true);
                  setTimeout(() => setDisableSendMessage(false), 20000);
                }}
                disabled={disableSendMessage}
              >
                生成图片
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
