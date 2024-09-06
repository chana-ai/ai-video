"use client";

import React, { useState, useRef } from "react";

import { instance } from "@/lib/axios";
import { useRouter } from "next/navigation";
import * as Form from "@radix-ui/react-form";
import Header from "../../header";
import styles from "./page.module.scss";
import {Button} from "antd";
export default function CreateMaterial() {
  const [name, setName] = useState("");
  const [tags, setTags] = useState(""); // 存储标签

  const [fileData, setFileData] = useState<[]>([]);
  const fileUpload: any = useRef<HTMLFormElement>(null);

  /**
   *   [{ key: 'file1Key', url: 'http://example.com/file1' },
    { key: 'file2Key', url: 'http://example.com/file2' },]
   */
  const [fileUploadStatus, setFileUploadStatus] = useState<any | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const maxFiles = 5; // 限制文件个数
  const maxSize = 10 * 1024 * 1024; // 限制总文件大小为10MB

  const handleNameChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setName(e.target.value);
  };

  // 处理标签输入
  const handleTagsChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setTags(e.target.value);
  };

  // 创建逻辑
  const handleSubmit = () => {
 
    let tagsNames = tags.split(/[,，\s]+/).filter(tag => tag.trim() !== '');

    if (!fileUploadStatus) {
      setErrorMessage("文件未上传");
      return;
    }
    let pathNames = fileUploadStatus.map((item: { pathName: string; }) => item.pathName);
    if (tagsNames.length == 0 || name == "" || !fileUploadStatus) {
      setErrorMessage("请填写参数");
      return;
    }
    instance
      .post("/material/add", {
        name: name,
        type: 'PICTURE',
        tagNames: tagsNames,
        mode: 0,
        pathNames: pathNames,
      })
      .then((res) => {
        console.log("create success...");
        window.location.href = "/ai/materials";
      })
      .catch((error) => {
        setErrorMessage(error);
      });
  };

  const handleCancel = () => {
    clear();
    //返回素材列表页面。
    router.push("/ai/materials");
  };

  //删除已经上传，但是不需要入库的文件。
  const clear = () => {};

  const handleFileUploadChange = (data: any) => {
    if (data.target.files) {
      console.log(`----- ${data.target.files}`);
      if (data.target.files.length > maxFiles) {
        alert("最多一次上传5个文件");
        return;
      }
      const selectedFiles = [...data.target.files];

      let total_size = selectedFiles.reduce((acc, file) => acc + file.size, 0);
      if (total_size > maxSize) {
        alert(`一次上传文件大小不能超过 ${maxSize / 1024 / 1024}MB`);
        return;
      }
      //re-enable upload button.
      setFileUploadStatus(false)
      if (data.target.files.length > 0) {
        let fileData: any = [];
        for (let index = 0; index < data.target.files.length; index++) {
          fileData.push({
            name: data.target.files[index].name,
            size: data.target.files[index].size,
          });
        }
        setFileData(fileData);
      }
    }
  };

  const handleFileUpload = async () => {
    if(fileData.length == 0){
        alert('请选定文件上传')
        return
    }

    const formData = new FormData();
    fileData.map((item: any, index: any) => {
      formData.append(
        "file",
        fileUpload.current.files[index],
        fileUpload.current.files[index].name
      );
    });

    const resultData = await instance.post('/material/upload', formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("resultData", resultData);
    if (resultData.code == "0" && resultData.data.length == fileData.length) {
      setFileUploadStatus(resultData.data);
    }
    setErrorMessage("")
  }

  return (
    <>
      <Header title="创建素材"></Header>

      <div className="max-w-screen-xl mx-auto my-5">
        <div className="w-full text-3xl">
          <h1>上传素材</h1>
        </div>

        <div className="w-full bg-gray-100 rounded-xl my-7 p-10">
          <Form.Root className={styles.Root}>
            <Form.Field className={styles.Field} name="email">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <Form.Label className={styles.Label}>Name</Form.Label>
                <Form.Message className={styles.Message} match="valueMissing">
                  Please enter your email
                </Form.Message>
                <Form.Message className={styles.Message} match="typeMismatch">
                  Please provide a valid email
                </Form.Message>
              </div>
              <Form.Control asChild>
                <input
                  type="text"
                  className={styles.Input}
                  value={name}
                  onChange={handleNameChange}
                />
              </Form.Control>
            </Form.Field>
            <Form.Field className={styles.Field} name="question">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <Form.Label className={styles.Label}>标签(用,区分)</Form.Label>
                <Form.Message className={styles.Message} match="valueMissing">
                  Please enter tag
                </Form.Message>
              </div>
              <Form.Control asChild>
                <input
                  type="text"
                  required
                  value={tags}
                  className={styles.Input}
                  onChange={handleTagsChange}
                />
              </Form.Control>
            </Form.Field>
            <Form.Field className={styles.Field} name="question">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <Form.Label className={styles.Label}>上传文件</Form.Label>
                <Form.Message className={styles.Message} match="valueMissing">
                  Please enter tag
                </Form.Message>
              </div>
              <Form.Control asChild>
                <input
                  className={styles.Input}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUploadChange}
                  ref={fileUpload}
                />
                
              </Form.Control>
              <div className="mt-5">
              <Button
                onClick={handleFileUpload}
                size="large"
                style={{ width: "200px", backgroundColor: "#000000", color: "#ffffff", border: "1px solid #d9d9d9" }}
                type="primary"
                disabled={fileUploadStatus || !fileData || fileData.length === 0}              >
                上传文件
              </Button>
                {fileData &&
                  fileData.length > 0 &&
                  fileData.map((item: any, index: any) => {
                    return (
                      <div key={index}>
                        {index + 1} - {item.name} -{" "}
                        {fileUploadStatus &&
                          fileUploadStatus.length &&
                          "File Uploaded"}{" "}
                      </div>
                    );
                  })}
              </div>
            </Form.Field>
            <div className={styles.buttons}>

             <div style={{ color: 'red' }}>{errorMessage} </div>
              <Form.Submit asChild>
                <Button
                  onClick={handleSubmit}
                  className={styles.Button}
                  style={{ marginTop: 10 }}
                >
                  提交
                </Button>
              </Form.Submit>

              <Button
                onClick={handleCancel}
                className={styles.Button}
                style={{ marginTop: 10 }}
              >
                取消
              </Button>

            </div>
          </Form.Root>
        </div>
      </div>
    </>
  );
}
