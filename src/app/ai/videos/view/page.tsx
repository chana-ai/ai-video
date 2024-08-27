'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instance from '@/lib/axios';


export default function VideoDetail(){
    const [isEditing, setIsEditing] = useState(false);



    const searchParams = useSearchParams()
    const videoId = searchParams.get('videoId')
    const [video, setVideo] = useState({
        url: "http://www.baidu.com", 
        title: "视频题目",
        description: "测试用的",
        tags: ['travel', 'moutaining'],
        downlink: '',
        status: 'comeplete',
        createDate: '2024-01-01 20:08:00',
        completeDate: '2024-01-02 20:10:00 '
    })

    useEffect(() => {
        const fetchVideoData = async () => {
          try {
            const response = await fetch(`/ai/videos/get?${videoId}`);
            const data = await response.json();
            setVideo(data);
          } catch (error) {
            console.error('Error fetching video data:', error);
          }
        };
    
        if (videoId) {
          fetchVideoData();
        }
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
            <h2 onDoubleClick={onEditChange}>{video.title}</h2>
            <p  onDoubleClick={onEditChange}>{video.description}</p>
            <div className="video-tags">
              {video.tags.map((tag, index) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </>
    }

    const editDisplay = ()=>{
      return <>
          <div>
              <h2><Input placeholder={video.title} onChange={(e)=> buildVideo({'title': e.target.value})} /></h2>
              <p><Input placeholder={video.description}  onChange={(e)=> buildVideo({'description': e.target.value})}/></p>
              <Button onClick={onSave}>保存</Button><></> <Button onClick={()=>onEditChange()}>取消</Button>
          </div>
              <div className="video-tags">
                {video.tags.map((tag, index) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
          </>
    }


    return (
        <>
        {videoId?
          <div className="video-player">
          <video controls>
            <source src={video.url} type="video/mp4" />
          </video>
          <div className="video-info">
            <div>
                {isEditing?editDisplay(): display()}
            </div>
            
            <div className="video-actions">
              <Link href={video.url}>下载</Link>
            </div>
          </div>
          <div><p className="video-createdate">当前状态：{video.status}</p></div>
          <div><p className="video-createdate">创建时间：{video.createDate}</p></div>
          <div><p className="video-createdate">完成时间：{video.completeDate}</p></div>
        </div>:null
        }
        </>
      );
    
}