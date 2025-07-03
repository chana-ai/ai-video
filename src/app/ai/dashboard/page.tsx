"use client";

import { Card, Descriptions } from "antd";
import Header from "../header";
import { useEffect, useState } from "react";
import instance from "@/lib/axios";
import {getPhone} from '@/lib/localcache';
import { useRouter } from "next/navigation";
import { Modal, Button as AntButton } from "antd";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    summary: {
      NOT_SUBMIT: 0,
      QUEUEING: 0,
      COMPLETE: 0,
      PROCESSING: 0,
      FAIL: 0,
      UNKNOWN: 0,
    },
    total: 0,
  });

  const [balance, setBalance] = useState(0.0);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
  
    instance.get('/dashboard/video-summary').then((res) => {
        setSummary(res.data)
        console.log("UserSummary is: "+ JSON.stringify(res.data))
    }).catch(error => {
      console.log(error);
    });
  }, []);

  useEffect(() => {
   
    setBalance(0.0);
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
        <div className="grid gap-4 md:grid-cols-2 md:gap-8">
          <Card title="视频总数">
            <Descriptions title={`Total: ${summary.total?summary.total:0}`} colon={false}>
            <Descriptions.Item label="排队等待中" span={3}>
                {summary.summary.NOT_SUBMIT?summary.summary.NOT_SUBMIT:0 + summary.summary.QUEUEING?summary.summary.QUEUEING:0}
              </Descriptions.Item>
              <Descriptions.Item label="进行中" span={3}>
                {summary.summary.PROCESSING?summary.summary.PROCESSING:0}
              </Descriptions.Item>
              <Descriptions.Item label="成功完成" span={3}>
                {summary.summary.COMPLETE?summary.summary.COMPLETE:0}
              </Descriptions.Item>
              <Descriptions.Item span={3} label="失败">
                {summary.summary.FAIL?summary.summary.FAIL:0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="余额">
            <Descriptions colon={false}>
              <Descriptions.Item label="余额" span={3}>
                {balance}
              </Descriptions.Item>
            </Descriptions>
            <div className="flex flex-row gap-2 mt-4 items-center">
              <AntButton type="primary" onClick={() => router.push("/ai/balance-bill")}>充值</AntButton>
              <AntButton onClick={() => setWithdrawVisible(true)}>提现</AntButton>
            </div>
            <Modal
              open={withdrawVisible}
              onCancel={() => setWithdrawVisible(false)}
              footer={null}
              title="联系客服提现"
            >
              <div className="flex flex-col items-center">
                <img src="/wechat-group.png" alt="WeChat Group" className="w-48 h-48 object-contain mb-4" />
                <div>请扫码添加客服微信，进行提现操作(仅仅支持原路退回)</div>
              </div>
            </Modal>
          </Card>
          
          <Card title="Recent events">
            <Descriptions colon={false}>
            </Descriptions>
          </Card>
          <Card title="即将推出">
            <Descriptions colon={false}>
              <Descriptions.Item label="1. 支持动画,影视风格以及使用场景的视频生成" span={3}>
                {""}
              </Descriptions.Item>
              <Descriptions.Item label="2. 支持用户自定义角色,和故事情节的视频生成" span={3}>
                {""}
              </Descriptions.Item>
            </Descriptions>
          </Card>

        </div>
      </main>
    </>
  );
}
