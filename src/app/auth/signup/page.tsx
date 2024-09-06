"use client";

import Link from "next/link";

import { Button } from "antd";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SetStateAction, useEffect, useState } from "react";
import {instance } from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function LoginForm() {

  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter()

  const onPhoneChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setPhone(e.target.value)
  }

  const onEmailChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setEmail(e.target.value);
  }

  useEffect(()=>{
    if(confirmPassword != password){
      setErrorMessage("两次密码不一致")
    }else{
      setErrorMessage('');
    }

  }, [confirmPassword, password])
   
  const onConfirmPasswordChanged = (e: { target: { value: SetStateAction<string>; }; }) => {
    setConfirmPassword(e.target.value)
  }
  
  const onPasswordChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setPassword(e.target.value)
  }

  const createUser = async (event: { preventDefault: () => void; }) =>{
    event.preventDefault();
    if (password != confirmPassword) {
      setErrorMessage('两次密码不一致');
      return;
    }
    console.log("phone: "+ phone + " email: " + email + " password:"+ password)

    try{
      instance.post("/user/register", {
        "phoneNumber": phone,
        "password": password, 
        "email": email
      }).then(() => {
        alert("创建账号成功，点击确认")
        router.push('/auth/login')
      }).catch((error) => {
        setErrorMessage(error.message);
        console.log(error)
      });
      ;
    }catch(error){
      console.error(error)
      setErrorMessage("注册失败，请稍后再试")
    }
    

  }
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          请输入你的注册信息
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="grid grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">*手机号(以861开头)</Label>
              <Input id="phone" placeholder="手机号" onChange={onPhoneChange} required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email 地址</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              onChange={onEmailChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password(长度8~20之间)</Label>
            <Input id="password" type="password" onChange={onPasswordChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">重新输入一遍密码</Label>
            <Input id="confir" type="password" onChange={onConfirmPasswordChanged}/>
          
          </div>
          <div style={{ color: 'red' }}>{errorMessage} </div>
          <Button className="w-full" onClick={createUser}>
            Create an account
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
