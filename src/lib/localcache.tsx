"use client";
import { useEffect, useState } from 'react';

const USER_ID = "userId";
const CREDENTIALS = "credentials";
const PHONE = "phone";
export const SetItem = (key: string, value: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
    }
};

export const setUserId = (userId: string) => SetItem(USER_ID, userId);
export const setCredentials = (credential: string) => SetItem(CREDENTIALS, credential);
export const setLoginPhone = (phone: string) => SetItem(PHONE, phone);

const GetItem = (key:string)=>{
  
        if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
        }
        return ""
  ;
}
const Clear = () => {
    console.log("1...........")
    if (typeof window !== 'undefined') {
        localStorage.clear();
        console.log("2...........")
    }
}
export const getUserId = () => GetItem(USER_ID);
export const getCredentials = () => GetItem(CREDENTIALS);
export const getPhone = () => GetItem(PHONE);
export const clearCache = () => Clear()

export const putCache = (cacheKey: string, value: Array<any>) => {
    const now = Date.now();
    localStorage.setItem(cacheKey, JSON.stringify(value));
    localStorage.setItem(`${cacheKey}-time`, now.toString());
}

// export const getCache = (cacheKey: string) => {
//     const cachedTimeString = localStorage.getItem(`${cacheKey}-time`);
//     const cachedTime = cachedTimeString ? parseInt(cachedTimeString, 10) : null;
//     const now = Date.now();
//     if (cachedTime && now - cachedTime < 30000) { // 30 seconds
//         const cacheValueString = localStorage.getItem(cacheKey);
//         return cacheValueString ? JSON.parse(cacheValueString) : null;
//     } else {
//         return null;
//     }
// }
// export const checkAndRemoveExpiredCache = () => {
//     const now = Date.now();
//     Object.keys(localStorage).forEach(key => {
//         console.log('check thread....')
//         if (key.endsWith('-time')) {
//             const cachedTime = parseInt(localStorage.getItem(key), 10);
//             if (cachedTime && now - cachedTime > 30000) { // 30 seconds
//                 const cacheKey = key.replace('-time', '');
//                 localStorage.removeItem(cacheKey);
//                 localStorage.removeItem(key);
//             }
//         }       
//     });
// }

// Initial code to launch check every 2 minutes in the browser
//setInterval(checkAndRemoveExpiredCache, 120000); // 120000ms = 2 minutes