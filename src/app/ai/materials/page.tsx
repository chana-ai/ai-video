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
import { Label } from '@/components/ui/label';
import styles from "./materials.module.scss";

import instance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from 'next/navigation';

interface Material {
  id: string;
  name: string;
  tagNames: string[];
  mode: string;
  updateTime: string;
}

interface MaterialList {
  records: Material[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export default function Materials() {
  const router = useRouter();
  
  const [materials, setMaterials] = useState<MaterialList>({
    records: [],
    total: 0,
    size: 10,
    current: 1,
    pages: 1,
  });

  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    searchBytags(1);
  }, [tags]);

  // Delete a record
  const deleteMaterial = (materialId: string) => {
    // Use confirm to show confirmation dialog
    const isConfirmed = window.confirm("请确认是否需要删除当前记录?");

    // If user confirms, update items state to delete the item
    if (isConfirmed) {
      instance
        .get("/material/delete", { params: { id: materialId } })
        .then((res) => {
          console.log("Remove success..");
          const updatedItems = materials.records.filter(
            (item) => item.id !== materialId
          );
          setMaterials({
            ...materials,
            records: updatedItems,
            total: materials.total - 1
          });
        });
    } else {
      // If user cancels, do nothing
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
        setMaterials(res.data || res);
      });
  };

  const handleViewMaterial = (materialId: string) => {
    router.push(`/ai/materials/view?materialId=${materialId}`);
  };

  const MaterialRow = ({ material }: { material: Material }) => (
    <TableRow key={material.id}>
      <TableCell>
        <div className="font-medium">{material.id}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{material.name}</div>
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
          {material.mode === "UPLOADED" ? "自有" : "AI生成"}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{material?.updateTime}</div>
      </TableCell>
      <TableCell className={styles.tableActions}>
        <Button onClick={() => handleViewMaterial(material.id)}>查看</Button>
        <Button onClick={() => deleteMaterial(material.id)}>
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Header title="Materials"></Header>
      <main className="grid gap-4 overflow-auto p-4">
        <div className={styles.pageHeader}>
          <div className={styles.title}>
            <input 
              type="search" 
              className={styles.search} 
              placeholder="请使用空格或逗号分割标签 进行查找" 
              onChange={(e) => setTags(e.target.value.split(/[ ,]+/).filter(tag => tag !== ''))} 
            />
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
              {materials.records.map((material) => (
                <MaterialRow key={material.id} material={material} />
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              onClick={() => searchBytags(materials.current - 1)}
              disabled={materials.current === 1}
            >
              <span>上一页</span>
            </button>
            <span>
              <span>
                第{materials.current}页 / 共{Math.ceil(materials.total/materials.size)}页, 每页
                {materials.size}条
              </span>
            </span>
            <button
              onClick={() => searchBytags(materials.current + 1)}
              disabled={materials.current === materials.pages}
            >
              <span>下一页</span>
            </button>
          </div>
        </Card>
      </main>
    </>
  );
}
