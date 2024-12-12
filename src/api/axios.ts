// api/axios.ts
import axios, { AxiosInstance } from 'axios';
import { nanoid } from 'nanoid';

// 创建API实例的工厂函数
export function createApi(userId: string): AxiosInstance {
    const api = axios.create({
        baseURL: 'http://localhost:3000',
        timeout: 30000,
        withCredentials: true,
        headers: {
            'X-User-ID': userId
        }
    });

    // 添加请求拦截器
    api.interceptors.request.use(config => {
        // 确保每个请求都带上 userId
        config.headers['X-User-ID'] = userId;
        return config;
    }, error => {
        return Promise.reject(error);
    });

    // 可以添加响应拦截器
    api.interceptors.response.use(response => {
        return response;
    }, error => {
        return Promise.reject(error);
    });

    return api;
}

// 普通环境下的实例（非Worker环境）
const SESSION_USER_ID = 'fast_upload_session_user_id';
const userId = typeof localStorage !== 'undefined' 
    ? localStorage.getItem(SESSION_USER_ID) || nanoid()
    : '';

if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_USER_ID, userId);
}

// 创���默认实例
const api = createApi(userId);

// 获取当前用户ID的方法
const getUserId = () => userId;

export { api, getUserId };