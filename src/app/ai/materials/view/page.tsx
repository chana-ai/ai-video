'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instance from '@/lib/axios';

export default function MaterialView(){
    const [isEditing, setIsEditing] = useState(false);

    const searchParams = useSearchParams()
    const materialId = searchParams.get('materialId')
    const [material, setMaterial] = useState({
      id: 9, 
      name: '登山的视频',
      tagNames: ['登山，测试"'],
      description:'xxxx',
      config:{},
      uris: ["https://chana-video-dev.oss-cn-beijing.aliyuncs.com/1/material/2024-08-29/HuIdzZV7/exam9-2.png?Expires=1724938896&OSSAccessKeyId=LTAI5tRkoomnUcyefEXcP9nv&Signature=lnMJqo52eXgsRH4mjUwlzC4YLBQ%3D"],
      mode:'UPLOADED',
      createDate: '2024-01-01'
    })

    const [inputTags, setInputTags] = useState([])

    useEffect(() => {
        const fecthMaterialData = async () => {
          try {
            const response = await fetch(`/ai/materials/get?${materialId}`);
            const data = await response.json();
            
          } catch (error) {
            console.error('Error fetching video data:', error);
          }
        };
    
        if (materialId) {
          fecthMaterialData();
        }
      }, [materialId]);

    const onEditChange = ()=>{
        setIsEditing(!isEditing)
    }

    function buildMaterial(param: any) {
      // 使用展开运算符和对象解构来合并对象
      let obj = {
        ...material,
        ...param,
        tagNames: inputTags 
      };
      setMaterial(obj) 
    }

    const onSave =() => {
        onEditChange()
        instance.post('/material/update', material)
            .then( res => {
                console.log('update success')
                alert("Update success")
            }).catch(error =>{
                console.log("error "+error)
            })
    }

    const display = () =>{
      return <>
            <h2 onDoubleClick={onEditChange}>{material.name}</h2>
            <p  onDoubleClick={onEditChange}>{material.description}</p>
            <div className="material-tags">
              <h4>Tags:</h4>
              <div className="tag-list">
                {material.tagNames.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </>
    }

    const editDisplay = () => {
      return (
        <>
          <div>
            <h2><Input placeholder={material.name} onChange={(e) => buildMaterial({ 'name': e.target.value })} /></h2>
            <p><Input placeholder={material.description} onChange={(e) => buildMaterial({ 'description': e.target.value })} /></p>
           
          </div>
          <div className="material-tags">
            <h4>Tags:</h4>
            <Input
              type="text"
              className="tag-input"
              placeholder="Add tags separated by commas..."
              value={material.tagNames.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newTags = e.target.value.split(/[,，\s]+/).filter(tag => tag.trim() !== '');
                setInputTags(newTags)
                //buildMaterial({ tagNames: newTags });
              }}
            />
             <Button onClick={onSave}>保存</Button><></> <Button onClick={() => onEditChange()}>取消</Button>
          </div>
        </>
      );
    }

    return (
        <>
        {materialId?
          <div className="video-player">
          <div className="material-display">
            {material.uris && material.uris.length > 0 && (
              <div className={`grid grid-cols-${Math.min(material.uris.length, 2)} gap-4`}>
                {material.uris.map((uri, index) => (
                  <div key={index} className="material-item">
                      <img src={uri} alt={`Material ${index + 1}`} className="w-full h-auto object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="material-details">
            <div>
                {isEditing?editDisplay(): display()}
            </div>
          


            <h3>Material Details</h3>
            <div className="material-config">
              <h4>Config:</h4>
              <pre>{JSON.stringify(material.config, null, 2)}</pre>
            </div>
            <div className="material-mode">
              <h4>Mode:</h4>
              <p>{material.mode === 'UPLOADED' ? '人工上传' : 'AI生成'}</p>
            </div>    
          </div>
        
          <div><p className="video-createdate">创建时间：{material.createDate}</p></div>
        </div>:null
        }
        </>
      );
    
}