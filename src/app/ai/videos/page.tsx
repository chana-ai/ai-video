'use client'

import Header from "../header";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardActions
} from "@/components/ui/card";


import CreateVideo from './create'
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import instance from '@/lib/axios';


export default function Videos() {

  //Constroller data
  const [createFlag, setCreateFlag] = useState(false)
  const [viewFlag, setViewFlag] = useState(false)


  //Data for rendering
  const [videos, setVideos] = useState([])

  useEffect(()=>{
    // instance.post('/video/searchVideos', {
    // }).then((res)=>{
    //   setVideos(res.data)
    // })
  }, []);

  const videoData = [
    {
      title: 'Text to GenAI Video',
      status: 'PROCESSING',
      tags: ['登山', '跑步'],
      createDate: '2024-01-01',
      description: 'Generate script with Prompt AI or write your own.',
      image: 'path/to/video1.png', // Replace with the actual image path
      buttonLabel: 'Start'
    },
    // Add more video data objects as needed
  ];

  const cardRender= (video, index) =>{
    
      return (<div> 
           <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4"><div><Button onClick={ () => {
            setCreateFlag(!createFlag);
          } }>创建AI视频</Button></div></div>

          <Card x-chunk="dashboard-01-chunk-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-bold">
                  <div className="text-2xl font-bold">{video.title}</div> 
              </CardTitle>
              </CardHeader>
              <CardContent>
                 <div><img src={video.image} alt={video.title} /></div>
                 <div>{video.status}</div><div>{video.createDate}</div>
                 <div>{video.tags}</div>
             </CardContent>
             <CardActions className="flex justify-center">
                    <Button>查看</Button>
                    <Button>删除</Button>
              </CardActions>
          </Card>
          
      </div>)
  }

  const createButtonDiv = ()=>{
    return 
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4"><div><Button onClick={ () => {
      setCreateFlag(!createFlag);
    } }>创建AI视频</Button></div></div>
  }

  return (
    <>
      <Header title="Videos"></Header>
      
      <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
          {
              createFlag?<CreateVideo></CreateVideo>: ( videoData.map(cardRender))
          }
      </main>
    </>
  );
}
