import axios from "axios";
import config  from '@/app/settings/config';
import {getCredentials, getUserId, clearCache} from '@/lib/localcache';
import { configConsumerProps } from "antd/es/config-provider";

export const instance = axios.create({
    baseURL: `${config.host}`,
    timeout: 20000,
});

console.log(`Axios instance created with baseURL: ${instance.defaults.baseURL} and the config.host:  ${config.host}` );
// 请求拦截处理 请求拦截 在请求拦截中可以补充请求相关的配置
// interceptors axios的拦截器对象
instance.interceptors.request.use( httpRequestConfig => {
    const  token  =  getCredentials();
    if(token !== ""){
        console.log("token "+token)
        httpRequestConfig.headers['satoken'] = token
        if(httpRequestConfig.method === 'post'){
            httpRequestConfig.headers['userId'] = getUserId()
        } else if(httpRequestConfig.method === 'get'){
            if(!httpRequestConfig.params){
                httpRequestConfig.params = {}
            }
            httpRequestConfig.params['user_id'] = getUserId()
        }
    }
    
    return httpRequestConfig;
}, err => {
    // 请求发生错误时的相关处理 抛出错误
    //  //响应失败的返回
    Promise.reject(err)
})

// 添加响应拦截器
instance.interceptors.response.use(function (response) {
    //Here HttpCode: 200
    if(response.data.code && response.data.code != 0 && response.data.code !=200){
        //Monitor non-200 code response in the body, including system runtime error. 
        /**  
         * switch(response.data.code){
         *  case 60x: 
         *  case 61x: 
         *  case 62x:
         * }
         */
        console.log("Some business exception: " + JSON.stringify(response.data));
        if(response.data.code === '401') {
            clearCache();
            window.location.href = "/auth/login";
        }
        return Promise.reject({'message': response.data.message});
    }

	return response.data;
  }, function (error) {
	// This error refers to network error (e.g., Readtimeout exceptio, connectionTimeout..)       
    if (error.message.includes("RR_NETWORK")) {
        localStorage.clear();
    }                                                                                                                                                                                                                                                                                                                                                                                                                
	return Promise.reject(error);
  });

  export default instance;
