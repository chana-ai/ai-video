"use client";

import Header from "../header";

import HelloEdit from '@/app/ai/test/edit';
import { Button } from "@/components/ui/button";
import { useState } from 'react';

export default function Hello() {
    const [message, setMessage] = useState('Hello world')
    const [flag, setFlag] = useState(false)
    //let flag = false

    const shouldShowEdit = true;

    const changeState = ()=>{
        setFlag(!flag)
    }

    return (
        <>
          <Header title="Test Page"></Header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div> { flag? <HelloEdit></HelloEdit>: "hello"}
                <div><Button onClick={changeState}>Click</Button></div>
            </div>
           </main>
        </>
      );
}