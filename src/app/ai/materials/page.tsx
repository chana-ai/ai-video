"use client";

import { useEffect } from "react";
import Header from "../header";

import axios from 'axios';

export default function Materials() {

useEffect(()=>{
  axios.post('/material/search', {})
  .then((res)=>{
    console.log("get result")
  })
}, []);


  return (
    <>
      <Header title="Materials"></Header>
      <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
        <h2 className="text-lg font-semibold">Materials</h2>
      </main>
    </>
  );
}
