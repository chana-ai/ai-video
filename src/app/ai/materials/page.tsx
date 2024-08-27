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
import styles from "./materials.module.scss";

import instance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function Materials() {
  const [materials, setMaterials] = useState({
    records: [
      {
        id: 1,
        name: "登山的照片",
        tagName: "登山",
        mode: "UPLOADED",
      },
    ],
    total: 1,
    size: 10,
    current: 1,
    pages: 1,
  });

  const [tags, setTags] = useState([]);

  const [createFlag, setCreateFlag] = useState(false);
  const [createAIFlag, setCreatAIFlag] = useState(false);

  useEffect(() => {
    //TODO: debug 影藏初始化
    // instance.post('/material/search', {
    // }).then((res)=>{
    //   console.log("get result " + JSON.stringify(res.data))
    //   setMaterials(res.data)
    // })
  }, []);

  //删除某一条记录
  const deleteMaterial = (materialId) => {
    // 使用confirm弹出确认对话框
    const isConfirmed = window.confirm("请确认是否需要删除当前记录?");

    // 如果用户确认，更新items状态来删除项
    if (isConfirmed) {
      instance
        .get("/material/delete", { params: { id: materialId } })
        .then((res) => {
          console.log("Remove success..");
          const updatedItems = materials.records.filter(
            (item) => item.id !== materialId
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

  //分页使用 TODO 测试。
  const handlePageChange = (index: any) => {
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
  };

  const handleCreateMaterial = () => {
    setCreateFlag(!createFlag);
  };

  const handleCreateAIMaterial = () => {
    setCreatAIFlag(!createAIFlag);
  };

  const displayTable = () => {
    return (
      <>
        <div className={styles.pageHeader}>
          <div className={styles.title}>
            <input type="search" className={styles.search} />
            <button type="button" className={styles.searchButton}>
              搜索
            </button>
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
              {materials.records.map((material, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium"> {material.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium"> {material.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium"> {material?.tagNames}</div>
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
                    <Button> Edit</Button>
                    <Button onClick={() => deleteMaterial(material.id)}>
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
              onClick={() => handlePageChange(materials.current - 1)}
              disabled={materials.current === 1}
            >
              <span size="2">上一页</span>
            </button>
            <span>
              <span size="2">
                第{materials.current}页 / 共{materials.total}页, 每页
                {materials.size}条
              </span>
            </span>
            <button
              onClick={() => handlePageChange(materials.current + 1)}
              disabled={materials.current === materials.total}
            >
              <span size="2">下一页</span>
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
          !createFlag && !createAIFlag
            ? "Materials"
            : createFlag
            ? "创建素材"
            : "创建AI素材"
        }
      ></Header>
      <main className="grid gap-4 overflow-auto p-4">{displayTable()}</main>
    </>
  );
}
