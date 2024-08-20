"use client";

import { useEffect, useState } from "react";
import Header from "../header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import instance from '@/lib/axios';
import CreateMaterial from './create';

import Link from "next/link";
import { Currency } from "lucide-react";



export default function Materials() {

  const [materials, setMaterials] = useState({
    records: [],
    total: 1,
    size: 10,
    current: 1,
    pages: 1
  })

  const [tags, setTags] = useState([])

  const [createFlag, setCreateFlag] = useState(false);
  const [createAIFlag, setCreatAIFlag] = useState(false);


  useEffect(()=>{
    instance.post('/material/search', {
    }).then((res)=>{
      console.log("get result " + JSON.stringify(res.data))
      setMaterials(res.data)
    })
  }, []);


  //删除某一条记录
  const deleteMaterial= (materialId)=>{
      // 使用confirm弹出确认对话框
      const isConfirmed = window.confirm('请确认是否需要删除当前记录?');
      
      // 如果用户确认，更新items状态来删除项
      if (isConfirmed) {
        
        instance.get('/material/delete', { params: { id: materialId } })
            .then(res => {
              console.log("Remove success..")
              const updatedItems = materials.records.filter((item) => item.id !== materialId);
              let updateMaterials = {
                  records: updatedItems, 
                  total: materials.total,
                  size: 10, 
                  current: materials.current,
                  pages: materials.pages
              }

              setMaterials(updateMaterials);
        })

        
      } else {
        // 如果用户取消，不执行任何操作
        console.log('Deletion canceled by the user.');
      }
  }

  //分页使用 TODO 测试。
  const handlePageChange = (index)=> {
      instance.post('/material/search', {
          "tagNames": tags,
          "size": 10,
          "current": index
      }).then((res)=>{
          console.log("get result " + JSON.stringify(res.data))
          setMaterials(res.data)
      })
  }

  const handleCreateMaterial = ()=>{
    alert("Test...")
    setCreateFlag(!createFlag);
  }

  const handleCreateAIMaterial = ()=>{
    alert ("AI")
  }
  return (
    <>
      <Header title= { !createFlag&&!createAIFlag?"Materials":createFlag?"创建素材":"创建AI素材"}></Header>
      <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
      {
          !createFlag && !createAIFlag?
          (<><div className="text-lg font-semibold">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>素材名</TableHead>
                    <TableHead>
                      标签列表
                    </TableHead>
                    <TableHead>
                      类型
                    </TableHead>
                    <TableHead>
                      最后更新日期
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.records.map((material, index) => (
                    <TableRow>
                      <TableCell><div className="font-medium"> {material.id}</div></TableCell>
                      <TableCell><div className="font-medium"> {material.name}</div></TableCell>
                      <TableCell><div className="font-medium"> {material.tagNames}</div></TableCell>
                      <TableCell><div className="font-medium"> {material.mode == "UPLOADED" ? "自有" : "AI生成"}</div></TableCell>
                      <TableCell><div className="font-medium"> {material.updateTime}</div></TableCell>
                      <TableCell> <Button> Edit</Button>  <Button onClick={() => deleteMaterial(material.id)}>Delete</Button></TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页控件 */}
              <div className="pagifont-mediumation">
                <button onClick={() => handlePageChange(materials.current - 1)} disabled={materials.current === 1}>
                  上一页
                </button>
                <span>
                  第{materials.current}页 / 共{materials.total}页, 每页{materials.size}条
                </span>
                <button onClick={() => handlePageChange(materials.current + 1)} disabled={materials.current === materials.total}>
                  下一页
                </button>
              </div>
            </div><div>
                <a>
                  <Button onClick={handleCreateMaterial}>创建</Button>
                </a>
              </div><div><Button onClick={handleCreateAIMaterial}>新建AI素材</Button></div></>): (<CreateMaterial></CreateMaterial>)
      }

     

   
       
      </main>
    </>
  );
}
