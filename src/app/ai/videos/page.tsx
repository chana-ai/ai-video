"use client";

import Header from "../header";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardActions,
} from "@/components/ui/card";
import styles from "./page.module.scss";

import CreateVideo from "./create/page";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import instance from "@/lib/axios";
import Link from "next/link";

export default function Videos() {
  //Constroller data
  const [createFlag, setCreateFlag] = useState(false);
  const [viewFlag, setViewFlag] = useState(false);

  //Data for rendering
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    // instance.post('/video/searchVideos', {
    // }).then((res)=>{
    //   setVideos(res.data)
    // })
  }, []);

  const videoData = [
    {
      title: "Text to GenAI Video",
      status: "PROCESSING",
      tags: ["登山", "跑步"],
      createDate: "2024-01-01",
      description: "Generate script with Prompt AI or write your own.",
      image:
        "https://img1.baidu.com/it/u=1409313008,2874313835&fm=253&fmt=auto&app=138&f=PNG?w=350&h=265", // Replace with the actual image path
      buttonLabel: "Start",
    },
    {
      title: "Text to GenAI Video",
      status: "PROCESSING",
      tags: ["登山", "跑步"],
      createDate: "2024-01-01",
      description: "Generate script with Prompt AI or write your own.",
      image:
        "https://img1.baidu.com/it/u=1409313008,2874313835&fm=253&fmt=auto&app=138&f=PNG?w=350&h=265", // Replace with the actual image path
      buttonLabel: "Start",
    },
    // Add more video data objects as needed
  ];

  const cardRender = (video, index) => {
    return (
      <div>
        <Card x-chunk="dashboard-01-chunk-0">
          <CardContent className={styles.card}>
            <div className={styles.cardImage}>
              <img src={video.image} alt={video.title} />
            </div>
            <div className={styles.cardTitle}>{video.title}</div>
            <div className={styles.cardInfo}>
              <div className={styles.cardStatus}>{video.status}</div>
              <div className={styles.cardCreateTime}>{video.createDate}</div>
            </div>
            <div className={styles.cardTags}>
              {video.tags.map((item, index) => (
                <span key={index}>{item}</span>
              ))}
            </div>
          </CardContent>
          <CardActions className="flex justify-center pb-4 gap-4">
            <Button>查看</Button>
            <Button>删除</Button>
          </CardActions>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Header title="Videos"></Header>
      <div className="grid gap-4 overflow-auto p-4">
        <div className={styles.pageHeader}>
          <div className={styles.title}>视频列表</div>
          <div className={styles.action}>
            <Button
              onClick={() => {
                setCreateFlag(!createFlag);
              }}
            >
              <Link href={"/ai/videos/create"}>创建AI视频</Link>
            </Button>
          </div>
        </div>
        <main className="grid flex-1 gap-4 overflow-auto md:grid-cols-4 lg:grid-cols-5">
          {videoData.map(cardRender)}
        </main>
      </div>
    </>
  );
}
