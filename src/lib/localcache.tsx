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
// Theme and Style Cache
const THEME_MAP_KEY = 'themeMap'
const THEME_MAP_TIME_KEY = 'themeMap_time'
const STYLE_MAP_KEY = 'styleMap'
const STYLE_MAP_TIME_KEY = 'styleMap_time'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 1 day in milliseconds

export const getThemeMap = (): Record<string, any> => {
  if (typeof window !== 'undefined') {
    const cachedTimeString = localStorage.getItem(THEME_MAP_TIME_KEY)
    const cachedTime = cachedTimeString ? parseInt(cachedTimeString, 10) : null
    const now = Date.now()
    
    if (cachedTime && now - cachedTime < CACHE_DURATION) {
      const cacheValueString = localStorage.getItem(THEME_MAP_KEY)
      return cacheValueString ? JSON.parse(cacheValueString) : {}
    }
    return {}
  }
  return {}
}

export const setThemeMap = (themeMap: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_MAP_KEY, JSON.stringify(themeMap))
    localStorage.setItem(THEME_MAP_TIME_KEY, Date.now().toString())
  }
}

export const getStyleMap = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    const cachedTimeString = localStorage.getItem(STYLE_MAP_TIME_KEY)
    const cachedTime = cachedTimeString ? parseInt(cachedTimeString, 10) : null
    const now = Date.now()
    
    if (cachedTime && now - cachedTime < CACHE_DURATION) {
      const cacheValueString = localStorage.getItem(STYLE_MAP_KEY)
      return cacheValueString ? JSON.parse(cacheValueString) : {}
    }
    return {}
  }
  return {}
}

export const setStyleMap = (styleMap: Record<string, string>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STYLE_MAP_KEY, JSON.stringify(styleMap))
    localStorage.setItem(STYLE_MAP_TIME_KEY, Date.now().toString())
  }
}

export const clearThemeCache = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(THEME_MAP_KEY)
    localStorage.removeItem(THEME_MAP_TIME_KEY)
  }
}
