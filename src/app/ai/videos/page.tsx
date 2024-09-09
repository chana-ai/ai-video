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

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import instance from "@/lib/axios";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function Videos() {
  //Constroller data
  // const [createFlag, setCreateFlag] = useState(false);
  // const [viewFlag, setViewFlag] = useState(false);
  const router = useRouter()

  //Data for rendering
  const [videos, setVideos] = useState({
    records: [] as { id: string; name: string; status: string; createTime: string; tagNames: string[]; screenshotUri: string; }[],
    size: 10,
    total: 0,
    current: 1,
    pages: 1
  });
  // {
  //   records: [], 
  //   size: 1
  //   total: 1
  //   current: 1
  // }
  useEffect(() => {
    searchVideos(0)
  }, []);


  const searchVideos = (index: number)=>{
    instance.post('/video/search', {
      tagNames: [],
      size: 10,
      current: index,
    }).then((res)=>{
      setVideos(res.data)
    })
  }

  const videoDetail = (videoId: string) =>{
      let path = `/ai/videos/view?videoId=${videoId}`
      router.push(path)
  }

  const updateVideos = (param: { size?: number; records?: any[]; total?: number; current?: number; }) =>{
    console.log("---", param)
    const recordsSize = param.records ? param.records.length : videos.records.length;
    const newVideos = {
      ...videos,
      size: param.size || videos.size,
      records: param.records || videos.records,
      total: recordsSize,
      current: param.current || videos.current,
    };
    setVideos({ ...newVideos, records: newVideos.records as any[] });
}

  const removeVideo = (videoId: string) => {
      const isConfirmed = window.confirm("请确认是否需要删除当前记录?");
      if (!isConfirmed) {
        return
      }
       //Remove video. 
      instance.get('/video/delete', {params: {id: videoId}})
        .then(res=>{
          const updatedVideos = videos.records.filter((video: { id: string }) => video.id !== videoId);
          updateVideos({'records': updatedVideos});
        }).catch(error =>{
            alert(error)
        })
      alert('Remove success')
  } 

  const cardRender = (video: { id: string; name: string; status: string; createTime: string; tagNames: string[]; screenshotUri: string; }, index: number) => {
    return (
      <div>
        <Card x-chunk="dashboard-01-chunk-0">
          <CardContent className={styles.card}>
            <div className={styles.cardImage}>
              <img src={video.screenshotUri} alt={video.name} style={{ width: '100%', height: 'auto' }} />
            </div>
            <div className={styles.cardTitle}>{video.name}</div>
            <div className={styles.cardInfo}>
              <div className={styles.cardStatus}>{video.status}</div>
              <div className={styles.cardCreateTime}>{video.createTime}</div>
            </div>
            <div className={styles.cardTags}>
              {video.tagNames.map((item, index) => (
                <span key={index}>{item}</span>
              ))}
            </div>
          </CardContent>
          <CardActions className="flex justify-center pb-4 gap-4">
            <Button onClick={()=>{videoDetail(video.id)}}>查看</Button>
            <Button onClick={()=>{removeVideo(video.id)}}>删除</Button>
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
              <Link href={"/ai/videos/create"}>创建AI视频</Link>
          </div>
        </div>
        <main className="grid flex-1 gap-4 overflow-auto md:grid-cols-4 lg:grid-cols-5">
          <div className={styles.pagination} style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', background: 'white', padding: '10px', boxSizing: 'border-box', boxShadow: '0 -2px 4px rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => searchVideos(videos.current - 1)}
              disabled={videos.current === 1}
            >
              <span >上一页</span>
            </button>
            <span>
              <span >
                第{videos.current}页 / 共{Math.ceil(videos.total/videos.size)}页, 每页
                {videos.size}条
              </span>
            </span>
            <button
              onClick={() => searchVideos(videos.current + 1)}
              disabled={videos.current +1 >= videos.pages}
            >
              <span >下一页</span>
            </button>
          </div>
          {Array.isArray(videos.records) && videos.records.map((video, index) => cardRender(video, index))}
        </main>
        
      </div>
    </>
  );
}
