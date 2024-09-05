import axios from "axios";
import {getCredentials, getUserId, clearCache} from '@/lib/localcache';

// const HOST = "http://localhost:8080"

const HOST = process.env.PROD == "prod"?"":"http://localhost:8081";

export const instance = axios.create({
    baseURL: `${HOST}`,
    timeout: 20000,
});

// 请求拦截处理 请求拦截 在请求拦截中可以补充请求相关的配置
// interceptors axios的拦截器对象
instance.interceptors.request.use(config => {
    // config 请求的所有信息
    // console.log(config);
    // 响应成功的返回
    const  token  =  getCredentials();
    if(token !== ""){
        console.log("token "+token)
        config.headers['satoken'] = token
        config.headers['userId'] = getUserId()    
    }
    return config // 将配置完成的config对象返回出去 如果不返回 请求讲不会进行
}, err => {
    // 请求发生错误时的相关处理 抛出错误
    //  //响应失败的返回
    Promise.reject(err)
})

// 添加响应拦截器
instance.interceptors.response.use(function (response) {
    //Here HttpCode: 200
    if(response.data.code && response.data.code != 0){
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
