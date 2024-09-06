'use client'
import React, { Suspense, useState, useEffect } from 'react';
//import { Button } from "@/components/ui/button";
import {Button} from "antd";
import { Link } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instance from '@/lib/axios';


interface MaterialIdProps {
  setMaterialId: (id: string) => void;
}

function MaterialInitialization({ setMaterialId }: MaterialIdProps) {
    const searchParams = useSearchParams();
    const materialId = searchParams.get('materialId') ?? '';

    useEffect(() => {
        if (typeof materialId === 'string') {
            setMaterialId(materialId);
        }
    }, [materialId, setMaterialId]);

    console.log(`Material ID: ${materialId}`);
    console.log(`Search Params: ${searchParams}`);

    return (
        <div>
            {/* Your component content */}
        </div>
    );
}

export default function MaterialView(){
    const [isEditing, setIsEditing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [materialId, setMaterialId] = useState('')
   
    const [material, setMaterial] = useState({
      id: -1, 
      name: '',
      tagNames: [],
      description:'',
      config:{},
      uris: [],
      mode:'UPLOADED',
      createDate: '2024-01-01'
    })

    const [inputTags, setInputTags] = useState('')

    useEffect(() => {
          if(!materialId){
              //setErrorMessage('material id should not be empty.')
              return
          }
          instance.get(`/material/get`, {
            params: { id: materialId }
          }).then( res => {
              setMaterial(res.data);
              setInputTags(material.tagNames.join(', '));
          }).catch(error => {
              setErrorMessage(error)
          })
       
      }, [materialId]);


    const onEditChange = () => {
      setIsEditing(!isEditing);
    }

    function buildMaterial(param: any) {
      // 使用展开运算符和对象解构来合并对象
      let obj = {
        ...material,
        ...param,
      };
      setMaterial(obj) 
    }

    const onSave =() => {
        onEditChange()
        const newTags = inputTags.split(/[,，\s]+/).filter(tag => tag.trim() !== '');
        buildMaterial({'tagNames': newTags})

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
           <div>
                <div><Label className="font-bold">标题  </Label><span onDoubleClick={onEditChange}>{material.name}</span></div>
                <div><Label className="font-bold">描述  </Label><span  onDoubleClick={onEditChange}>{material.description}</span></div>
           </div>
            
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
            <div><Label className="font-bold">标题</Label><span><Input placeholder={material.name} onChange={(e) => buildMaterial({ 'name': e.target.value })} /></span></div>
            <div><Label className="font-bold">描述</Label><span><Input placeholder={material.description} onChange={(e) => buildMaterial({ 'description': e.target.value })} /></span></div>
           
          </div>
          <div className="material-tags">
            <h4>Tags:</h4>
            <Input
              type="text"
              className="tag-input"
              value={material.tagNames.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setInputTags(e.target.value)
              }}
            />
             <Button onClick={onSave}>保存</Button><></> <Button onClick={() => onEditChange()}>取消</Button>
          </div>
        </>
      );
    }

    return (
        <>
        <Suspense fallback={<div>Loading...</div>}>
              <MaterialInitialization setMaterialId={setMaterialId} />
        {materialId?
          <div className="container mx-auto p-4">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Images</h3>
                  {material.uris && material.uris.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {material.uris.map((uri, index) => (
                        <div key={index} className="material-item relative">
                          <img 
                            src={uri} 
                            alt={`Material ${index + 1}`} 
                            className="w-full h-auto object-cover rounded-lg cursor-pointer"
                            loading="lazy"
                            onClick={() => {
                              const img = document.createElement('img');
                              img.src = uri;
                              img.className = 'fixed top-0 left-0 w-full h-full object-contain z-50 bg-black bg-opacity-75';
                              img.onclick = () => img.remove();
                              document.body.appendChild(img);
                            }}
                          />
                          <div className="absolute bottom-2 right-2 bg-white rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Details</h3>
                  {isEditing ? editDisplay() : display()}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Mode</h3>
                  <p>{material.mode === 'UPLOADED' ? '人工上传' : 'AI生成'}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Config</h3>
                  <div className="h-[200px] w-full rounded-md border p-4 overflow-auto">
                    <pre className="text-sm">
                      <code>{JSON.stringify(material.config, null, 2)}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Created</h3>
                  <p>{material.createDate}</p>
                </div>
              </div>
            </div>
          </div>
        :null}
        </Suspense>
        </>
      );
    
}