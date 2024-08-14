"use client";

import React, { useState, ChangeEvent, useEffect } from 'react';
import { redirect } from 'react-router-dom';
import axios from 'axios';

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handlePhoneChange= (e) => {
      setPhone(e.target.value)
  }

  const handlePasswordChange = (e) => {
      setPassword(e.target.value)
  }

  // const handleLogin = () => {
  //   console.log("submit phone: " +  phone + "  password: "+ password)
  //   if(phone== '13671245484'){
  //     redirect("https://www.baidu.com")
  //   }else{
  //     redirect("https://www.sina.com")
  //   }
    
  // }


  return (
    <div>
     
      <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
          </div>
          <div className="grid gap-4">
        <div className="grid gap-2">
       <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="phone" value={phone} placeholder="136" onChange={handlePhoneChange} required /></div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            {/** href="/auth/find-password"  */}
            < Link  href=""  className="ml-auto inline-block text-sm underline"   > 
              <p title="忘记密码请email 联系 shijiexu@yahoo.com ">Forgot your password?</p>
            </Link > 
            </div>
            <Input id="password" type="password" value= {password}  onChange={handlePasswordChange}  required />
          </div>
          <Button type="submit" className="w-full" /*onClick={handleLogin} */>
            Login
          </Button>
        </div>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
