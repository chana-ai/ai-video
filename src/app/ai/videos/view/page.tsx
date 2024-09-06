'use client'
import React, { useState, useEffect, Suspense } from 'react';
//import { Button } from "@/components/ui/button";
import { Link, Tags } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
//import { Input } from "@/components/ui/input";
import instance from '@/lib/axios';
import Header from "../../header";
import {
  Card,
  Input,
  Button,
  Space,
  Select,
  Collapse,
  Descriptions,
} from "antd";
import { Label } from '@radix-ui/react-dropdown-menu';

// interface VideoProps {
//   setVideoId: (id: string) => void;
interface VideoPropInitializationProps {
  setVideoId: (id: string) => void;
}

function VideoPropInitialization({ setVideoId }: VideoPropInitializationProps) {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('videoId') ?? '';

    useEffect(() => {
        if (typeof videoId === 'string') {
          setVideoId(videoId);
        }
    }, [videoId, setVideoId]);

    console.log(`video ID: ${videoId}`);
    console.log(`Search Params: ${searchParams}`);

    return (
        <div>
            {/* Your component content */}
        </div>
    );
}

export default function VideoDetail(){
    const [isEditing, setIsEditing] = useState(false);
    const [videoId, setVideoId] = useState('')
    const [video, setVideo] = useState({
      id: videoId,
      name: '',
      description: '',
      uris: [],
      tagNames: [],
      status: 1,
      createTime: '',
      completeTime: ''
    })

    useEffect(() => {
        if (!videoId){
          //console.error("Missing paraeter videoId, and stop")
          return 
        }

        instance.get(`/video/get?id=${videoId}`)
        .then(response => {
          setVideo(response.data);
        })
        .catch(error => {
          console.error('Error fetching video data:', error);
        });
       
      }, [videoId]);

    const onEditChange = ()=>{
        setIsEditing(!isEditing)
    }

    function buildVideo(param: any) {
      // 使用展开运算符和对象解构来合并对象
      let obj = {
        ...video,
        ...param,
      };
      setVideo(obj) 
    }

    const onSave =() => {
        onEditChange()
        instance.post('/video/updateVideo', video)
            .then( res => {
                console.log('update success')
                alert("Update success")
            }).catch(error =>{
                console.log("error "+error)
            })
    }

    const display = () =>{
      return <>
            <div>
            <Label style={{fontWeight: 'bold'}}>Name: </Label><h2 onDoubleClick={onEditChange}>{video.name}</h2>
            <div style={{height: '10px'}}></div>
            <Label style={{fontWeight: 'bold'}}>Description: </Label><p onDoubleClick={onEditChange}>{video.description}</p>
            <div style={{height: '10px'}}></div>
            <Label style={{fontWeight: 'bold'}}>标签 </Label>
            <div className="video-tags">
              {video.tagNames && video.tagNames.map((tag, index) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            </div>
          </>
    }

    const editDisplay = ()=>{
      return <>
          <div>
            <div>
              <Label >Name: </Label><Input placeholder={video.name} onChange={(e)=> buildVideo({'title': e.target.value})} />
              <div style={{height: '10px'}}></div>
              <Label>Description: </Label><p><Input placeholder={video.description}  onChange={(e)=> buildVideo({'description': e.target.value})}/></p>
              </div>
            
            <div>
              <Button onClick={onSave}>保存</Button><Button onClick={()=>onEditChange()}>取消</Button>
            </div>

            <div style={{height: '10px'}}></div>
            <div className="video-tags">
              {video.tagNames && video.tagNames.map((tag, index) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
          </>
    }

    return (
        <>
        <Header title="视频详情"></Header>
        <Suspense fallback={<div>Loading...</div>}>
              <VideoPropInitialization setVideoId={setVideoId} />
        {videoId ? (
          <div className="p-4 flex flex-col items-center"> {/* Centering the content */}
          <Card className="rounded-lg shadow-lg w-full max-w-3xl"> {/* Set max width for the card */}
            <div className="video-player mb-4"> {/* Added margin-bottom for spacing */}
              <div className="max-w-full mx-auto">
                <video controls className="w-full h-auto max-h-[50vh] mb-4 rounded-lg"> {/* Adjusted max height */}
                  {video.uris && video.uris.length > 0 && <source src={video.uris[0]} type="video/mp4" />}
                </video>
              </div>
            </div>
            <div className="content-container">
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="mb-4">
                  {isEditing ? editDisplay() : display()}
                </div>
                <div className="grid grid-cols-1 gap-4"> {/* Changed to single column layout */}
                  <div>
                    <p className="text-sm text-gray-600">Current Status:</p>
                    <p className="font-medium">{video.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">创建时间:</p>
                    <p className="font-medium">{video.createTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">完成时间 Date:</p>
                    <p className="font-medium">{video.completeTime}</p>
                  </div>
                  <div className="flex justify-center"> {/* Centering the download link */}
                    {/* <Link className="text-blue-500 hover:underline" href={video.url}>Download Video</Link> */}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        ) : null}
        </Suspense>
        </>
    );
    
}