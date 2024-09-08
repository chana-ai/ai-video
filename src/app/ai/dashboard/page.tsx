"use client";

import { Card, Descriptions } from "antd";
import Header from "../header";
import { useEffect, useState } from "react";
import instance from "@/lib/axios";
import {getPhone} from '@/lib/localcache';


export default function Dashboard() {
  const [summary, setSummary] = useState({
    queuing:0,
    completed: 0,
    processing: 0,
    fail: 0,
    total: 0,
  });

  const [balance, setBalance] = useState(0.0);

  useEffect(() => {
  
    instance.get('/dashboard/video-summary').then((res) => {
        setSummary(res.data)
        console.log("UserSummary is: "+ JSON.stringify(res.data))
    }).catch(error => {
      console.log(error);
    });
  }, []);

  useEffect(() => {
   
    setBalance(4.0);
    instance.get('/user/getCredits').then((res) => {
        console.log("getCredit is: "+ JSON.stringify(res));
        setBalance(res.data.credit?res.data.credit:0.0);
    }).catch(error => {
        console.log(error)
    });
  }, []);

  return (
    <>
      <Header title="Dashboard"></Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div>Hello </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card title="视频总数">
            <Descriptions title={`Total: ${summary.total?summary.total:0}`} colon={false}>
              <Descriptions.Item label="排队中" span={3}>
                {summary.processing?summary.queuing:0}
              </Descriptions.Item>
              <Descriptions.Item label="进行中" span={3}>
                {summary.processing?summary.processing:0}
              </Descriptions.Item>
              <Descriptions.Item label="成功完成" span={3}>
                {summary.completed?summary.completed:0}
              </Descriptions.Item>
              <Descriptions.Item span={3} label="失败">
                {summary.fail?summary.fail:0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="余额">
            <Descriptions colon={false}>
              <Descriptions.Item label="余额" span={3}>
                {balance}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </main>
    </>
  );
}
