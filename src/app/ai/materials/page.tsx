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
import { Button } from "@/components/ui/button";
import {Label} from '@/components/ui/label';
import styles from "./materials.module.scss";

import instance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { uptime } from "process";

export default function Materials() {
  const router = useRouter();
  const [materials, setMaterials] = useState({
    records: [] as {id: string; name: string; tagNames: string[]; mode: string; updateTime:string}[],
    total: 0,
    size: 10,
    current: 1,
    pages: 1,
  });

  const [tags, setTags] = useState<string[]>([]);

  useEffect( ()=>{
     searchBytags(0)
  }, [tags])

  //删除某一条记录
  const deleteMaterial = (materialId: string) => {
    // 使用confirm弹出确认对话框
    const isConfirmed = window.confirm("请确认是否需要删除当前记录?");

    // 如果用户确认，更新items状态来删除项
    if (isConfirmed) {
      instance
        .get("/material/delete", { params: { id: materialId } })
        .then((res) => {
          console.log("Remove success..");
          const updatedItems = materials.records.filter(
            (item) => item.id.toString() !== materialId
          );
          let updateMaterials = {
            records: updatedItems,
            total: materials.total,
            size: 10,
            current: materials.current,
            pages: materials.pages,
          };

          setMaterials(updateMaterials);
        });
    } else {
      // 如果用户取消，不执行任何操作
      console.log("Deletion canceled by the user.");
    }
  };

  const searchBytags = (index: number) => {
    instance
    .post("/material/search", {
      tagNames: tags,
      size: 10,
      current: index,
      
    })
    .then((res) => {
      console.log("get result " + JSON.stringify(res.data));
      setMaterials(res.data);
    });
  }

  const handleViewMaterial = (materialId: string) => {
    router.push(`/ai/materials/view?materialId=${materialId}`);
  };



  const displayTable = () => {
    return (
      <>
        <div className={styles.pageHeader}>
          <div className={styles.title}>
            
            <input type="search" className={styles.search} placeholder="请使用空格或逗号分割标签 进行查找" onChange={(e) => setTags(e.target.value.split(/[ ,]+/).filter(tag => tag !== ''))} />
            {/* <button type="button" className={styles.searchButton} onClick={() => searchBytags(Array.from(tags), 1)}>
              搜索
            </button> */}
          </div>
          <div className={styles.actions}>
            <Link href={`/ai/materials/create`}>创建</Link>
            <Link href={`/ai/materials/createAI`}>新建AI素材</Link>
          </div>
        </div>
        <Card className="text-lg font-semibold">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>素材名</TableHead>
                <TableHead>标签列表</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>最后更新日期</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.records.map((material, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium"> {material.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium"> {material.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium relative group">
                      {(() => {
                        const tags = material?.tagNames;
                        const displayTags = tags.slice(0, 2).join(', ');
                        return (
                          <>
                            {displayTags}
                            {tags.length > 2 && '...'}
                            {tags.length > 2 && (
                              <div className="absolute left-0 top-full mt-1 p-2 bg-white shadow-md rounded hidden group-hover:block z-10">
                                {tags.join(', ')}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {material.mode == "UPLOADED" ? "自有" : "AI生成"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium"> {material?.updateTime}</div>
                  </TableCell>
                  <TableCell className={styles.tableActions}>
                    <Button onClick={() => handleViewMaterial(String(material.id))}> 查看</Button>
                    <Button onClick={() => deleteMaterial(String(material.id))}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页控件 */}
          <div className={styles.pagination}>
            <button
              onClick={() => searchBytags(materials.current - 1)}
              disabled={materials.current === 1}
            >
              <span >上一页</span>
            </button>
            <span>
              <span >
                第{materials.current}页 / 共{Math.ceil(materials.total/materials.size)}页, 每页
                {materials.size}条
              </span>
            </span>
            <button
              onClick={() => searchBytags(materials.current + 1)}
              disabled={materials.current === materials.pages}
            >
              <span >下一页</span>
            </button>
          </div>
        </Card>
      </>
    );
  };

 
  return (
    <>
      <Header
        title={
            "Materials"  }
      ></Header>
      <main className="grid gap-4 overflow-auto p-4">{displayTable()}</main>
    </>
  );
}
