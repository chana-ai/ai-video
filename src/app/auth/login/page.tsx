"use client";

import React, { useState, ChangeEvent, useEffect } from 'react';
import instance from '@/lib/axios';
import { setUserId, setCredentials, setLoginPhone, getCredentials} from '@/lib/localcache';

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {useRouter} from 'next/navigation';


export default function Login() {

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();

  const handlePhoneChange= (e) => {
      setPhone(e.target.value)
  }
  useEffect(() => {
    const credentials = getCredentials();
    if (credentials) {
      router.push('/ai/dashboard');
    }
  }, [router]);
  
  const handlePasswordChange = (e) => {
      setPassword(e.target.value)
  }

  const handleLogin = (event) => {
    event.preventDefault();
    if (!phone || !password) {
      setErrorMessage("请输入手机号和密码");
      return;
    }

    console.log("submit phone: " +  phone + "  password: "+ password)
    instance.post('/user/login', {
        'phoneNumber': phone, 
        'password': password      
    }).then(res => {
        console.log('login success '+ res.data);
        const data = res.data;
        const rPhone = data.phoneNumber;
        const rUserId = data.userId
        const rToken = data.token
        setCredentials(rToken)
        setUserId(rUserId);
        setLoginPhone(rPhone);
        router.push('/ai/dashboard')
        
    }).catch( error => {
        console.log('Not success login with message '+ JSON.stringify(error));

        setErrorMessage(error.message)
    })
  }


  return (
    <div>
     
      <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Chana视频生成系统</h1>
          </div>
          <div className="grid gap-4">
        <div className="grid gap-2">
       <Label htmlFor="phone">手机号(86开头)</Label>
          <Input id="phone" type="phone" value={phone} placeholder="86" onChange={handlePhoneChange} required /></div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
            <Label htmlFor="password">密码</Label>
            {/** href="/auth/find-password"  */}
            < Link  href=""  className="ml-auto inline-block text-sm underline"   > 
              <p title="忘记密码请email 联系 shijiexu@yahoo.com ">忘记密码?</p>
            </Link > 
            </div>
            <Input id="password" type="password" value= {password}  onChange={handlePasswordChange}  required />
          </div>
          <div style={{ color: 'red' }}>{errorMessage} </div>
          <Button type="submit" className="w-full"  onClick={handleLogin} >
            登录
          </Button>
        </div>
      <div className="mt-4 text-center text-sm">
        没有账号?{" "}
        <Link href="/auth/signup" className="underline">
          注册
        </Link>
      </div>
    </div>
  );
}
