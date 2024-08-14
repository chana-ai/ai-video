import axios from "axios";
import {getCredentials, getUserId} from '@/lib/localcache';

// const HOST = "http://localhost:8080"

const HOST = process.env.PROD == "prod"?"":"http://localhost:8080";

export const openAxios = axios.create({
    baseURL: `${HOST}`,
    timeout: 10000,
    headers: {'x-chana': 'web-client'}  
});

export const instance = axios.create({
    baseURL: `${HOST}`,
    timeout: 10000,
});

// 请求拦截处理 请求拦截 在请求拦截中可以补充请求相关的配置
// interceptors axios的拦截器对象
instance.interceptors.request.use(config => {
    // config 请求的所有信息
    // console.log(config);
    // 响应成功的返回
    config.headers['access-token'] = getCredentials();
    config.headers['userId'] = getUserId()
    return config // 将配置完成的config对象返回出去 如果不返回 请求讲不会进行
}, err => {
    // 请求发生错误时的相关处理 抛出错误
    //  //响应失败的返回
    Promise.reject(err)
})

// 添加响应拦截器
instance.interceptors.response.use(function (response) {
	if(response.data.code && response.data.code != "200"){
        console.log("Received message: "+response);
        return Promise.reject({'message': response.message, "data": response.data})
    }

	return response;
  }, function (error) {
	// 超出 2xx 范围的状态码都会触发该函数。
	// 对响应错误做点什么
	return Promise.reject(error);
  });

  export default instance;