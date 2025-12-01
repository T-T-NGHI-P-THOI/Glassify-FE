import axios, { type CreateAxiosDefaults } from 'axios';
import EnvVaribles from '../configs/env.config';
import { toast } from 'react-toastify';

const config: CreateAxiosDefaults = {
    baseURL: EnvVaribles.BASIC_URL
}

const api = axios.create(config)

// Handle Request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ACCESS_TOKEN')?.replaceAll('"', '');
        if (!config.headers) config.headers = {} as import('axios').AxiosRequestHeaders;
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        return config;
    }
)

// Handle Response
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error?.response?.data?.reason
            ?? error?.response?.data?.message
            ?? error?.message
            ?? 'An unexpected error occurred';

        toast.error(`${message}`, {
            position: 'top-right',
            autoClose: 3000,
        });

        return Promise.reject(error);
    }
);

export default api